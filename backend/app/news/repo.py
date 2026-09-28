"""Article persistence — UPSERT by article_url so duplicates don't pile up."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import async_session_maker
from app.models import Article as ApiArticle
from app.news.db_models import Article as DBArticle


log = logging.getLogger("repo")


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        # Handle '2026-05-13', '2026-05-13T09:00:00Z', etc.
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


async def persist_articles(
    api_articles: Iterable[ApiArticle],
    fetched_by_user_id: int | None = None,
) -> tuple[int, int]:
    """Upsert by article_url. Returns (inserted, updated)."""
    inserted = updated = 0
    async with async_session_maker() as session:  # type: AsyncSession
        for a in api_articles:
            if not a.url:
                continue
            existing = (
                await session.execute(
                    select(DBArticle).where(DBArticle.article_url == a.url)
                )
            ).scalar_one_or_none()

            summary = a.summary
            row_fields = dict(
                title=a.title or "",
                source_name=a.source or "unknown",
                article_url=a.url,
                published_date=_parse_dt(a.published_at),
                summary=summary.summary if summary else None,
                category=summary.category if summary else None,
                sentiment=summary.sentiment if summary else None,
                keyword=a.keyword,
                image_url=a.image_url,
                importance=summary.importance if summary else None,
                relevance=summary.relevance if summary else None,
                key_points=summary.key_points if summary else None,
                tags=summary.tags if summary else None,
                fetched_by_user_id=fetched_by_user_id,
            )

            if existing is None:
                session.add(DBArticle(**row_fields))
                inserted += 1
            else:
                for k, v in row_fields.items():
                    setattr(existing, k, v)
                updated += 1

        try:
            await session.commit()
        except Exception as e:
            log.warning("persist_articles commit failed: %s", e)
            await session.rollback()
            return (0, 0)

    log.info("● [persist]  articles inserted=%d updated=%d", inserted, updated)
    return (inserted, updated)
