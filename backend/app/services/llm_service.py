import json
import logging

from openai import AsyncOpenAI
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.models import ArticleSummary


log = logging.getLogger("llm")

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            default_headers={
                "HTTP-Referer": settings.app_url,
                "X-Title": "NewsPulse",
            },
            timeout=settings.request_timeout_seconds,
        )
    return _client


SYSTEM_PROMPT = """You are a senior news editor producing concise structured summaries for an executive briefing dashboard. Busy professionals scan your output in 10 seconds, so density and clarity matter more than length.

OUTPUT FORMAT — return ONLY a JSON object (no markdown fences, no preamble, no closing remarks) matching this exact schema:

{
  "summary": string,         // 2-3 sentences. Lead with WHO did WHAT, WHEN, WHERE. Prefer numbers and named entities.
  "key_points": string[],    // 3-5 bullets. Each under 25 words. Concrete facts only — no narrative, no opinion.
  "category": string,        // EXACTLY one of the categories listed below (case-sensitive).
  "sentiment": string,       // "positive" | "neutral" | "negative" — tone of the event for those AFFECTED, not your opinion.
  "importance": number,      // Integer 1-10 per the rubric below.
  "relevance": number,       // Integer 0-10 — how relevant the article is to the SEARCH KEYWORD provided.
  "tags": string[]           // 3-5 short lowercase filter tags. Hyphenated if multi-word: "data-breach", "ai", "ceo-change".
}

CATEGORY TAXONOMY (pick the BEST single fit):
- Business      — companies, M&A, earnings, layoffs, products, business-side regulation
- Technology    — AI, software, hardware, cybersecurity, internet platforms, devices
- Politics      — government, elections, legislation, party politics, geopolitics that is primarily political
- Sports        — athletes, teams, leagues, tournaments, match results
- Entertainment — film, TV, music, celebrity, gaming culture, awards
- Science       — research, space, biology, physics, climate science
- World         — international events not fitting elsewhere: conflicts, diplomacy, humanitarian
- Health        — medicine, public health, healthcare systems, drugs, mental health
- Finance       — stocks, crypto, banking, monetary policy, personal finance
- Other         — only if truly none of the above

IMPORTANCE RUBRIC (be conservative — default 4-6, reserve 9-10 for genuinely major news):
- 10  — Major global event (large war, pandemic outbreak, presidential election result)
- 8-9 — Significant national or industry event (major policy change, top-5-company acquisition, supreme court ruling)
- 6-7 — Notable regional or sector event (product launch from major company, mid-size deal)
- 4-5 — Typical news item of interest to people who follow that domain
- 2-3 — Minor, niche, or local-only
- 1   — Trivial, clickbait, or unverified rumor

SENTIMENT — tone of the EVENT for those affected, not your judgment:
- positive — gains, recoveries, breakthroughs, wins, releases people wanted
- neutral  — factual reports, mixed effects, announcements without clear valence
- negative — losses, deaths, lawsuits, layoffs, disasters, breaches, controversies

RELEVANCE — how directly the article addresses the SEARCH KEYWORD:
- 9-10 — Article is centrally about the keyword topic
- 6-8  — Keyword is a significant subtopic
- 3-5  — Keyword appears but isn't the focus
- 0-2  — Off-topic; keyword appears only incidentally or not at all

STRICT RULES:
1. Output JSON only. No markdown. No commentary before or after.
2. Use only facts present in the article. Do NOT speculate or add background you weren't given.
3. If the article is paywalled or truncated, still produce the JSON from what's available and lower 'importance' by 1-2.
4. 'category' must match one of the listed strings exactly, case-sensitive.
5. 'key_points' must be facts (numbers, names, decisions, dates) — never narrative or opinion.
6. 'summary' is at most 3 sentences. No editorializing words like "shocking", "amazing", "tragic".
7. If two languages mix in the source, write the summary in English.
8. Tags are lowercase, hyphenated for multi-word. Examples: "ai", "merger", "earnings", "data-breach", "fed-rate-cut".
"""


def _build_user_prompt(article: dict) -> str:
    content = (article.get("content") or article.get("raw_snippet") or "").strip()
    content = content[:8000]
    return (
        f"SEARCH KEYWORD: {article.get('keyword','')}\n\n"
        f"Article title: {article.get('title','')}\n"
        f"Source: {article.get('source','')}\n"
        f"Published: {article.get('published_at','unknown')}\n"
        f"URL: {article.get('url','')}\n\n"
        f"Article content:\n---\n{content}\n---\n\n"
        "Produce the JSON object now."
    )


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        nl = text.find("\n")
        text = text[nl + 1 :] if nl != -1 else text
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"No JSON object found in LLM output: {text[:200]!r}")
    return json.loads(text[start : end + 1])


class LLMOutputError(Exception):
    """Raised when the model output cannot be parsed into ArticleSummary."""


async def _call_once(article: dict) -> ArticleSummary:
    client = get_client()
    completion = await client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(article)},
        ],
        temperature=settings.llm_temperature,
        max_tokens=700,
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or ""
    try:
        data = _extract_json(raw)
        return ArticleSummary(**data)
    except Exception as e:
        raise LLMOutputError(f"{type(e).__name__}: {e}") from e


async def summarize_article(article: dict) -> ArticleSummary:
    last_exc: Exception | None = None
    async for attempt in AsyncRetrying(
        stop=stop_after_attempt(settings.llm_max_retries + 1),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4.0),
        retry=retry_if_exception_type((LLMOutputError, Exception)),
        reraise=True,
    ):
        with attempt:
            try:
                return await _call_once(article)
            except Exception as e:
                last_exc = e
                if attempt.retry_state.attempt_number <= settings.llm_max_retries:
                    log.warning(
                        "  [llm]    retry %d for %s: %s",
                        attempt.retry_state.attempt_number,
                        article.get("source"),
                        e,
                    )
                raise
    raise last_exc or RuntimeError("summarize_article exhausted retries")
