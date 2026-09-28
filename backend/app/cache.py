"""Optional Redis cache.

If REDIS_URL is set and reachable, used to cache article summaries by URL hash.
If unset or unreachable, every call is a no-op — the app keeps running.
"""

from __future__ import annotations

import hashlib
import json
import logging

import redis.asyncio as aioredis

from app.config import settings


log = logging.getLogger("cache")


_client: aioredis.Redis | None = None
_disabled: bool = False


def _key_for_url(url: str) -> str:
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:24]
    return f"ainm:summary:{h}"


async def get_client() -> aioredis.Redis | None:
    global _client, _disabled
    if _disabled:
        return None
    if _client is not None:
        return _client
    if not settings.redis_url:
        _disabled = True
        log.info("Redis disabled (no REDIS_URL).")
        return None
    try:
        client = aioredis.from_url(
            settings.redis_url, decode_responses=True, socket_connect_timeout=2
        )
        await client.ping()
        _client = client
        log.info("Redis connected: %s", settings.redis_url)
        return _client
    except Exception as e:
        _disabled = True
        log.warning("Redis unavailable (%s) — caching disabled for this run.", e)
        return None


async def get_summary(url: str) -> dict | None:
    client = await get_client()
    if client is None:
        return None
    try:
        raw = await client.get(_key_for_url(url))
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        log.warning("redis GET failed: %s", e)
        return None


async def set_summary(url: str, summary_payload: dict) -> None:
    client = await get_client()
    if client is None:
        return
    try:
        await client.set(
            _key_for_url(url),
            json.dumps(summary_payload),
            ex=settings.cache_ttl_seconds,
        )
    except Exception as e:
        log.warning("redis SET failed: %s", e)
