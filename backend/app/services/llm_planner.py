"""Planner + Evaluator: the 'agent brain' calls.

plan_search(keyword)       → Claude classifies intent & picks search params/queries
evaluate_results(...)      → Claude judges if results are on-topic enough; says proceed/retry/give_up
"""

from __future__ import annotations

import json
import logging
from typing import Literal

from app.config import settings
from app.services.llm_service import _extract_json, get_client


log = logging.getLogger("planner")


# ─── PLAN ──────────────────────────────────────────────────────────────────

PLAN_SYSTEM = """You are a research strategist for a news + web search agent.

Given a user's raw keyword, decide HOW to search for it. Your output drives a
Tavily call: you choose the index ("news" vs "general"), the time window, and
1-2 OPTIMIZED query strings.

STEP 1 — Classify INTENT:
- "news"     : current events / breaking news. Examples: "Israel Iran ceasefire",
               "Tesla earnings", "AI regulation EU"
- "research" : reviews, analyses, explainers, evergreen content. Examples:
               "Dhurandhar movie review", "best laptops 2025", "how RAG works"
- "entity"   : look up a specific person/company/product. Examples:
               "Sundar Pichai", "OpenAI funding round", "iPhone 17 Pro"

STEP 2 — Pick search parameters:
- intent=news     → topic="news",    days_back ∈ [3, 14]
- intent=research → topic="general", days_back ∈ [90, 365]
- intent=entity   → topic="general", days_back ∈ [30, 180]
- search_depth: "advanced" (longer bodies, more reliable) for research/entity,
                "basic" (fast, cheaper) for breaking news where freshness > depth

STEP 3 — Generate 1-2 OPTIMIZED query variants that will produce good search
results. Improve over the user input:
- Fix typos and misspellings
- Add disambiguators (year, full name, "review", "movie", etc.) when needed
- Use precise terminology

OUTPUT — JSON ONLY (no markdown, no preamble):
{
  "intent": "news" | "research" | "entity",
  "reasoning": "one short sentence — why this classification",
  "queries": ["query 1", "query 2"],   // 1-2 strings, ranked best-first
  "topic": "news" | "general",
  "days_back": <integer>,
  "search_depth": "basic" | "advanced"
}

Be conservative: prefer 1 sharp query over 2 mediocre ones.
NEVER invent facts. Only use what's in the keyword."""


async def plan_search(keyword: str) -> dict:
    client = get_client()
    user = f'Raw user keyword: "{keyword}"\n\nProduce the search plan JSON now.'
    resp = await client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {"role": "system", "content": PLAN_SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        plan = _extract_json(raw)
    except Exception as e:
        log.warning("plan_search parse failed (%s) — falling back to safe defaults", e)
        plan = {}

    intent = plan.get("intent", "news")
    if intent not in ("news", "research", "entity"):
        intent = "news"

    plan["intent"] = intent
    plan.setdefault("reasoning", "(no reasoning)")
    plan["topic"] = plan.get("topic") or ("news" if intent == "news" else "general")
    if plan["topic"] not in ("news", "general"):
        plan["topic"] = "news" if intent == "news" else "general"

    db = plan.get("days_back")
    if not isinstance(db, int) or db < 1 or db > 365:
        plan["days_back"] = {"news": 7, "entity": 90, "research": 180}[intent]

    sd = plan.get("search_depth")
    if sd not in ("basic", "advanced"):
        plan["search_depth"] = "basic" if intent == "news" else "advanced"

    queries = plan.get("queries") or []
    if not isinstance(queries, list) or not queries:
        queries = [keyword]
    plan["queries"] = [str(q).strip() for q in queries if str(q).strip()][:2]
    if not plan["queries"]:
        plan["queries"] = [keyword]

    log.info(
        "  ⚙ plan  %r → intent=%s queries=%s topic=%s days=%d depth=%s",
        keyword, plan["intent"], plan["queries"], plan["topic"],
        plan["days_back"], plan["search_depth"],
    )
    log.info("    reasoning: %s", plan["reasoning"])
    return plan


# ─── EVALUATE ──────────────────────────────────────────────────────────────

EVAL_SYSTEM = """You are a relevance judge for a web/news search agent.

Given the user's ORIGINAL keyword and a list of search result titles, decide:
1. How many results are clearly on-topic vs off-topic for the keyword
2. Whether to PROCEED to summarization, RETRY with a refined query, or GIVE_UP

OUTPUT — JSON ONLY:
{
  "on_topic_count": <int>,
  "off_topic_count": <int>,
  "decision": "proceed" | "retry" | "give_up",
  "reasoning": "one short sentence",
  "new_queries": ["..."]    // ONLY when decision="retry", 1-2 NEW queries we haven't tried
}

DECISION RULES:
- "proceed"  : at least 2 results look on-topic (good enough to summarize) — even if some are off-topic
- "retry"    : 0-1 on-topic results AND you can suggest a substantively different query (different angle, added disambiguator, fixed phrasing)
- "give_up"  : we've tried multiple queries with bad results AND you can't think of a better angle

WHEN SUGGESTING new_queries:
- Look at WHY results were off-topic (ambiguous word, missing context, wrong index).
- Add disambiguators: year, full name, "review", "movie", "company", etc.
- Try a different angle — don't just rephrase the same thing.
- 1-2 queries max. Better to suggest one strong query than two weak ones.

Be honest. If results are genuinely on-topic, say proceed even if off-topic items exist."""


async def evaluate_results(
    keyword: str,
    titles_with_sources: list[dict],
    attempted_queries: list[str],
    attempt_number: int,
) -> dict:
    client = get_client()
    if titles_with_sources:
        titles_block = "\n".join(
            f"{i + 1}. [{t.get('source', '?')}] {t.get('title', '(no title)')}"
            for i, t in enumerate(titles_with_sources)
        )
    else:
        titles_block = "(no results returned)"

    user = (
        f'Original user keyword: "{keyword}"\n'
        f"Queries already tried: {attempted_queries}\n"
        f"This is attempt #{attempt_number} of max 2.\n\n"
        f"Search results so far:\n{titles_block}\n\n"
        "Produce the evaluation JSON now."
    )
    resp = await client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {"role": "system", "content": EVAL_SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        result = _extract_json(raw)
    except Exception as e:
        log.warning("evaluate_results parse failed (%s) — defaulting to proceed", e)
        result = {"decision": "proceed"}

    dec = result.get("decision")
    if dec not in ("proceed", "retry", "give_up"):
        dec = "proceed"
    result["decision"] = dec

    result["on_topic_count"] = int(result.get("on_topic_count") or 0)
    result["off_topic_count"] = int(result.get("off_topic_count") or 0)
    result.setdefault("reasoning", "(no reasoning)")
    nq = result.get("new_queries") or []
    if not isinstance(nq, list):
        nq = []
    result["new_queries"] = [str(q).strip() for q in nq if str(q).strip()][:2]

    log.info(
        "  ⚖ eval  %r attempt=%d → decision=%s on_topic=%d off_topic=%d",
        keyword, attempt_number, result["decision"],
        result["on_topic_count"], result["off_topic_count"],
    )
    log.info("    reasoning: %s", result["reasoning"])
    if dec == "retry" and result["new_queries"]:
        log.info("    new queries: %s", result["new_queries"])
    return result
