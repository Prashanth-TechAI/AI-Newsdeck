"""LangGraph AI agent for keyword-driven news + research.

Graph topology (Claude makes the decisions in plan/evaluate; loop on retry):

    START
      │
      ▼
    plan ─────────────────────────────────►  Claude classifies intent, picks
      │                                       queries / topic / days_back
      ▼
    search ◄─────────────┐                    Tavily, fan-out over (kw, query) pairs
      │                  │
      ▼                  │
    evaluate ────────────┤                    Claude judges per-keyword:
      │                  │                    proceed / retry / give_up
      ├─ retry (loop) ───┘
      └─ proceed
      ▼
    summarize                                 Claude → structured summary per article
      ▼
    filter                                    drop low-relevance
      ▼
    rank                                      sort by importance × relevance × date
      ▼
     END
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TypedDict

import httpx
from langgraph.graph import END, START, StateGraph

from app.cache import get_summary as cache_get, set_summary as cache_set
from app.config import settings
from app.models import Article, AgentTraceEvent, ArticleSummary, FetchRequest, FetchResponse
from app.news.repo import persist_articles
from app.services.llm_planner import evaluate_results, plan_search
from app.services.llm_service import summarize_article
from app.services.news_service import search_news


log = logging.getLogger("agent")

MAX_ATTEMPTS = 2  # initial + 1 retry


class KeywordCtx(TypedDict, total=False):
    keyword: str
    plan: dict                  # intent, queries, topic, days_back, depth, reasoning
    attempts: int
    queries_tried: list[str]
    pending_queries: list[str]  # queries to run in next search round
    last_eval: dict | None      # most recent evaluate_results output
    decision: str               # "proceed" | "retry" | "give_up"


class AgentState(TypedDict, total=False):
    request: FetchRequest
    ctxs: dict[str, KeywordCtx]                # keyword -> ctx
    raw_articles: dict[str, dict]              # id -> raw article
    articles: list[Article]
    started_at: float
    elapsed: float
    stats: dict
    trace: list[dict]                          # list of {stage, keyword, detail}
    errors: list[str]


def _emit(state: AgentState, stage: str, keyword: str | None, **detail) -> None:
    state.setdefault("trace", []).append(
        {"stage": stage, "keyword": keyword, "detail": detail}
    )


# ──────────────────────────────────────────────────────────────────────────
# Nodes
# ──────────────────────────────────────────────────────────────────────────

async def node_plan(state: AgentState) -> dict:
    req = state["request"]
    log.info("● [plan]     planning %d keyword(s) in parallel", len(req.keywords))

    plans = await asyncio.gather(
        *[plan_search(kw) for kw in req.keywords], return_exceptions=True
    )

    ctxs: dict[str, KeywordCtx] = {}
    trace: list[dict] = []
    errors: list[str] = []
    for kw, plan in zip(req.keywords, plans):
        if isinstance(plan, Exception):
            err = f"plan failed for '{kw}': {type(plan).__name__}: {plan}"
            log.warning("    ✗ %s", err)
            errors.append(err)
            plan = {
                "intent": "news",
                "reasoning": "fallback (planner errored)",
                "queries": [kw],
                "topic": "news",
                "days_back": 7,
                "search_depth": "advanced",
            }
        ctxs[kw] = {
            "keyword": kw,
            "plan": plan,
            "attempts": 0,
            "queries_tried": [],
            "pending_queries": list(plan["queries"]),
            "last_eval": None,
            "decision": "pending",
        }
        trace.append({
            "stage": "plan",
            "keyword": kw,
            "detail": {
                "intent": plan["intent"],
                "reasoning": plan["reasoning"],
                "queries": plan["queries"],
                "topic": plan["topic"],
                "days_back": plan["days_back"],
                "search_depth": plan["search_depth"],
            },
        })

    return {
        "ctxs": ctxs,
        "started_at": time.perf_counter(),
        "raw_articles": {},
        "errors": (state.get("errors") or []) + errors,
        "trace": (state.get("trace") or []) + trace,
        "stats": {
            "keywords": len(req.keywords),
            "search_rounds": 0,
            "searches_executed": 0,
            "found": 0,
            "duplicates": 0,
            "unique": 0,
            "retries": 0,
            "summarized_ok": 0,
            "summarized_failed": 0,
            "filtered_off_topic": 0,
        },
    }


async def node_search(state: AgentState) -> dict:
    ctxs = state["ctxs"]
    pending_pairs: list[tuple[str, str]] = []
    for kw, ctx in ctxs.items():
        if ctx["decision"] in ("proceed", "give_up"):
            continue
        for q in ctx["pending_queries"]:
            pending_pairs.append((kw, q))

    if not pending_pairs:
        log.info("● [search]   no pending queries — skipping")
        return {}

    log.info(
        "● [search]   Tavily × %d (keyword, query) pair(s) in parallel",
        len(pending_pairs),
    )

    async with httpx.AsyncClient() as http:
        async def _run(kw: str, q: str):
            plan = ctxs[kw]["plan"]
            return kw, q, await search_news(
                http, q, state["request"].max_per_keyword or settings.max_articles_per_keyword,
                plan["days_back"], plan["search_depth"], topic=plan["topic"],
            )

        results = await asyncio.gather(
            *[_run(kw, q) for kw, q in pending_pairs], return_exceptions=True
        )

    raw = dict(state.get("raw_articles", {}))
    trace_add: list[dict] = []
    errors: list[str] = []
    found_total = 0
    dup_total = 0

    for entry in results:
        if isinstance(entry, Exception):
            log.warning("    ✗ search task crashed: %s", entry)
            errors.append(str(entry))
            continue
        kw, q, items = entry
        ctxs[kw]["queries_tried"].append(q)
        log.info("    ↪ '%s' [%s] → %d articles", kw, q, len(items))
        added, dups = 0, 0
        for item in items:
            # tag with the originating keyword (in case multi-keyword)
            item["keyword"] = kw
            if item["id"] in raw:
                dups += 1
            else:
                raw[item["id"]] = item
                added += 1
        found_total += len(items)
        dup_total += dups
        trace_add.append({
            "stage": "search",
            "keyword": kw,
            "detail": {"query": q, "found": len(items), "added": added, "duplicates": dups},
        })

    # clear pending queries (they've been executed)
    for kw, ctx in ctxs.items():
        ctx["pending_queries"] = []

    stats = dict(state["stats"])
    stats["search_rounds"] = stats["search_rounds"] + 1
    stats["searches_executed"] += len(pending_pairs)
    stats["found"] += found_total
    stats["duplicates"] += dup_total
    stats["unique"] = len(raw)

    return {
        "raw_articles": raw,
        "ctxs": ctxs,
        "stats": stats,
        "errors": (state.get("errors") or []) + errors,
        "trace": (state.get("trace") or []) + trace_add,
    }


async def node_evaluate(state: AgentState) -> dict:
    ctxs = state["ctxs"]
    raw = state.get("raw_articles", {})

    # Bucket articles by keyword for evaluation
    by_kw: dict[str, list[dict]] = {kw: [] for kw in ctxs}
    for art in raw.values():
        by_kw.setdefault(art.get("keyword", ""), []).append(art)

    eval_tasks = []
    active_kws: list[str] = []
    for kw, ctx in ctxs.items():
        if ctx["decision"] in ("proceed", "give_up"):
            continue
        ctx["attempts"] += 1
        titles = [{"source": a["source"], "title": a["title"]} for a in by_kw.get(kw, [])]
        eval_tasks.append(
            evaluate_results(kw, titles, ctx["queries_tried"], ctx["attempts"])
        )
        active_kws.append(kw)

    if not eval_tasks:
        log.info("● [evaluate] no keywords to evaluate")
        return {}

    log.info("● [evaluate] judging %d keyword(s)", len(eval_tasks))
    results = await asyncio.gather(*eval_tasks, return_exceptions=True)

    trace_add: list[dict] = []
    stats = dict(state["stats"])

    for kw, result in zip(active_kws, results):
        ctx = ctxs[kw]
        if isinstance(result, Exception):
            log.warning("    ✗ evaluate failed for '%s': %s — defaulting to proceed", kw, result)
            ctx["decision"] = "proceed"
            ctx["last_eval"] = {"decision": "proceed", "reasoning": "evaluator errored"}
            trace_add.append({
                "stage": "evaluate", "keyword": kw,
                "detail": {"decision": "proceed", "reasoning": "evaluator errored", "attempt": ctx["attempts"]},
            })
            continue

        ctx["last_eval"] = result
        decision = result["decision"]

        # Bound retries
        if decision == "retry" and ctx["attempts"] >= MAX_ATTEMPTS:
            log.info("    ↪ '%s' max attempts reached — forcing proceed", kw)
            decision = "proceed"
            result["reasoning"] = (result.get("reasoning", "") + " [retry cap reached]").strip()

        if decision == "retry":
            new_qs = [
                q for q in result.get("new_queries", [])
                if q and q not in ctx["queries_tried"]
            ]
            if not new_qs:
                log.info("    ↪ '%s' retry requested but no new queries — forcing proceed", kw)
                decision = "proceed"
            else:
                ctx["pending_queries"] = new_qs[:2]
                stats["retries"] += 1

        ctx["decision"] = decision
        trace_add.append({
            "stage": "evaluate",
            "keyword": kw,
            "detail": {
                "decision": decision,
                "on_topic": result.get("on_topic_count", 0),
                "off_topic": result.get("off_topic_count", 0),
                "reasoning": result.get("reasoning", ""),
                "new_queries": result.get("new_queries", []) if decision == "retry" else [],
                "attempt": ctx["attempts"],
            },
        })

    return {
        "ctxs": ctxs,
        "stats": stats,
        "trace": (state.get("trace") or []) + trace_add,
    }


def route_after_evaluate(state: AgentState) -> str:
    for ctx in state["ctxs"].values():
        if ctx["decision"] == "retry" and ctx["pending_queries"]:
            return "search"
    return "summarize"


async def node_summarize(state: AgentState) -> dict:
    # only keep articles whose keyword's decision is proceed (not give_up)
    keepers = {
        kw for kw, ctx in state["ctxs"].items() if ctx["decision"] != "give_up"
    }
    items = [a for a in state["raw_articles"].values() if a.get("keyword") in keepers]

    if not items:
        log.info("● [summary]  nothing to summarize")
        return {"articles": []}

    concurrency = settings.summarize_concurrency
    log.info("● [summary]  %d article(s) via Claude  (concurrency=%d)", len(items), concurrency)
    sem = asyncio.Semaphore(concurrency)
    total = len(items)

    async def _one(a: dict, idx: int) -> Article:
        async with sem:
            t0 = time.perf_counter()
            title_short = (a.get("title") or "")[:55]
            base = dict(
                id=a["id"],
                keyword=a["keyword"],
                title=a["title"],
                url=a["url"],
                source=a["source"],
                published_at=a.get("published_at"),
                image_url=a.get("image_url"),
                raw_snippet=a.get("raw_snippet", ""),
            )

            cached = await cache_get(a["url"])
            if cached:
                try:
                    summary = ArticleSummary(**cached)
                    log.info(
                        "    ⚡ [%d/%d] %-22s %s (cache hit, imp=%d, rel=%d)",
                        idx, total, a["source"][:22], title_short,
                        summary.importance, summary.relevance,
                    )
                    return Article(**base, summary=summary)
                except Exception:
                    pass  # malformed cache, fall through to recompute

            try:
                summary = await summarize_article(a)
                log.info(
                    "    ✓ [%d/%d] %-22s %s (%.2fs, imp=%d, rel=%d)",
                    idx, total, a["source"][:22], title_short,
                    time.perf_counter() - t0, summary.importance, summary.relevance,
                )
                await cache_set(a["url"], summary.model_dump())
                return Article(**base, summary=summary)
            except Exception as e:
                log.warning("    ✗ [%d/%d] %-22s %s (%s)", idx, total, a["source"][:22], title_short, e)
                return Article(**base, error=f"summarization failed: {type(e).__name__}")

    articles = await asyncio.gather(*[_one(a, i + 1) for i, a in enumerate(items)])
    ok = sum(1 for a in articles if a.summary)
    stats = dict(state["stats"])
    stats["summarized_ok"] = ok
    stats["summarized_failed"] = len(articles) - ok
    return {"articles": articles, "stats": stats}


async def node_filter(state: AgentState) -> dict:
    articles = state.get("articles", []) or []
    threshold = settings.relevance_threshold
    kept: list[Article] = []
    dropped = 0
    for a in articles:
        if a.summary is None:
            kept.append(a)
            continue
        if a.summary.relevance >= threshold:
            kept.append(a)
        else:
            dropped += 1
    log.info(
        "● [filter]   relevance≥%d → kept %d, dropped %d off-topic",
        threshold, len(kept), dropped,
    )
    stats = dict(state["stats"])
    stats["filtered_off_topic"] = dropped
    return {"articles": kept, "stats": stats}


async def node_rank(state: AgentState) -> dict:
    articles = list(state.get("articles", []) or [])

    def _key(a: Article):
        if a.summary is None:
            return (1, 0, 0, "")
        score = a.summary.importance * 10 + a.summary.relevance
        date = a.published_at or ""
        return (0, -score, -len(date), date)

    articles.sort(key=_key)
    elapsed = round(time.perf_counter() - state["started_at"], 2)
    top = articles[0].summary.importance if articles and articles[0].summary else 0
    log.info(
        "● [rank]     %d articles sorted  (top importance=%d)  total %.2fs",
        len(articles), top, elapsed,
    )
    return {"articles": articles, "elapsed": elapsed}


# ──────────────────────────────────────────────────────────────────────────
# Graph
# ──────────────────────────────────────────────────────────────────────────

def _build_graph():
    g = StateGraph(AgentState)
    g.add_node("plan", node_plan)
    g.add_node("search", node_search)
    g.add_node("evaluate", node_evaluate)
    g.add_node("summarize", node_summarize)
    g.add_node("filter", node_filter)
    g.add_node("rank", node_rank)

    g.add_edge(START, "plan")
    g.add_edge("plan", "search")
    g.add_edge("search", "evaluate")
    g.add_conditional_edges("evaluate", route_after_evaluate,
                            {"search": "search", "summarize": "summarize"})
    g.add_edge("summarize", "filter")
    g.add_edge("filter", "rank")
    g.add_edge("rank", END)

    return g.compile()


_graph = _build_graph()


async def run_agent(req: FetchRequest, user_id: int | None = None) -> FetchResponse:
    log.info("════════ AI agent run start ═══════════════════════════════════")
    final: AgentState = await _graph.ainvoke({"request": req})
    articles = final.get("articles", [])
    if articles:
        try:
            await persist_articles(articles, fetched_by_user_id=user_id)
        except Exception as e:
            log.warning("persistence skipped (%s)", e)
    log.info(
        "════════ AI agent run end  ──  stats=%s  (%.2fs) ════════",
        final.get("stats"), final.get("elapsed", 0.0),
    )
    trace = [
        AgentTraceEvent(stage=e["stage"], keyword=e.get("keyword"), detail=e["detail"])
        for e in final.get("trace", [])
    ]
    return FetchResponse(
        keywords=req.keywords,
        total_articles=len(final.get("articles", [])),
        articles=final.get("articles", []),
        elapsed_seconds=final.get("elapsed", 0.0),
        stats=final.get("stats", {}),
        trace=trace,
    )
