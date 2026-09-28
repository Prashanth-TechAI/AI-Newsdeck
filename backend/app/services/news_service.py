import hashlib
from urllib.parse import urlparse

import httpx

from app.config import settings


def _article_id(url: str) -> str:
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]


def _source_from_url(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
        return host.removeprefix("www.")
    except Exception:
        return "unknown"


async def search_news(
    client: httpx.AsyncClient,
    keyword: str,
    max_results: int,
    days_back: int,
    search_depth: str,
    topic: str = "news",
) -> list[dict]:
    payload: dict = {
        "query": keyword,
        "topic": topic,
        "max_results": max_results,
        "search_depth": search_depth,
        "include_raw_content": True,
        "include_images": False,
        "include_answer": False,
    }
    if topic == "news":
        payload["days"] = days_back
    else:
        # Tavily uses `time_range` for general topic
        if days_back <= 7:
            payload["time_range"] = "week"
        elif days_back <= 31:
            payload["time_range"] = "month"
        elif days_back <= 366:
            payload["time_range"] = "year"
    resp = await client.post(
        f"{settings.tavily_base_url}/search",
        json=payload,
        headers={"Authorization": f"Bearer {settings.tavily_api_key}"},
        timeout=settings.request_timeout_seconds,
    )
    resp.raise_for_status()
    data = resp.json()

    results = []
    for r in data.get("results", []):
        url = r.get("url", "")
        if not url:
            continue
        content = r.get("raw_content") or r.get("content") or ""
        # Per-article image only — never use the top-level `images` array as a
        # fallback because it's not aligned with results (would render the same
        # image on every card that lacks its own).
        per_article_image = r.get("image") if isinstance(r.get("image"), str) else None
        results.append(
            {
                "id": _article_id(url),
                "keyword": keyword,
                "title": (r.get("title") or "").strip(),
                "url": url,
                "source": _source_from_url(url),
                "published_at": r.get("published_date"),
                "image_url": per_article_image,
                "raw_snippet": (r.get("content") or "")[:400],
                "content": content,
            }
        )
    return results
