import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import current_user
from app.auth.models import User
from app.db import get_session
from app.news.db_models import Article
from app.news.schemas import (
    AnalyticsResponse,
    ArticleListResponse,
    ArticleOut,
    ArticleSort,
    ArticleSummaryOut,
    DistributionItem,
    TimelinePoint,
)


log = logging.getLogger("articles")
router = APIRouter(prefix="/api", tags=["articles"])


def _to_out(row: Article) -> ArticleOut:
    return ArticleOut(
        id=row.id,
        title=row.title,
        source_name=row.source_name,
        article_url=row.article_url,
        published_date=row.published_date,
        image_url=row.image_url,
        keyword=row.keyword,
        created_at=row.created_at,
        summary=ArticleSummaryOut(
            summary=row.summary,
            category=row.category,
            sentiment=row.sentiment,
            importance=row.importance,
            relevance=row.relevance,
            key_points=row.key_points,
            tags=row.tags,
        ),
    )


def _apply_filters(
    stmt,
    *,
    keyword: str | None,
    category: str | None,
    sentiment: str | None,
    source: str | None,
    q: str | None,
    min_importance: int | None,
    days: int | None,
):
    if keyword:
        stmt = stmt.where(func.lower(Article.keyword) == keyword.lower())
    if category:
        stmt = stmt.where(Article.category == category)
    if sentiment:
        stmt = stmt.where(Article.sentiment == sentiment)
    if source:
        stmt = stmt.where(func.lower(Article.source_name) == source.lower())
    if min_importance is not None:
        stmt = stmt.where(Article.importance >= min_importance)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Article.title).like(like),
                func.lower(Article.summary).like(like),
            )
        )
    if days is not None and days > 0:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = stmt.where(Article.created_at >= since)
    return stmt


# ─── List ──────────────────────────────────────────────────────────────────

@router.get("/articles", response_model=ArticleListResponse)
async def list_articles(
    keyword: Annotated[str | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    sentiment: Annotated[str | None, Query()] = None,
    source: Annotated[str | None, Query()] = None,
    q: Annotated[str | None, Query(description="search title + summary")] = None,
    min_importance: Annotated[int | None, Query(ge=1, le=10)] = None,
    days: Annotated[int, Query(ge=1, le=365)] = 7,
    sort: Annotated[ArticleSort, Query()] = "newest",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
) -> ArticleListResponse:
    base = _apply_filters(
        select(Article),
        keyword=keyword, category=category, sentiment=sentiment, source=source,
        q=q, min_importance=min_importance, days=days,
    )

    total = (
        await session.execute(
            _apply_filters(
                select(func.count(Article.id)),
                keyword=keyword, category=category, sentiment=sentiment, source=source,
                q=q, min_importance=min_importance, days=days,
            )
        )
    ).scalar_one()

    if sort == "newest":
        order = Article.created_at.desc()
    elif sort == "oldest":
        order = Article.created_at.asc()
    elif sort == "importance":
        order = Article.importance.desc().nullslast()
    else:  # relevance
        order = Article.relevance.desc().nullslast()

    rows = (
        await session.execute(base.order_by(order).limit(limit).offset(offset))
    ).scalars().all()

    return ArticleListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[_to_out(r) for r in rows],
    )


# ─── Analytics ─────────────────────────────────────────────────────────────

def _bucket_importance(score: int | None) -> str:
    if score is None:
        return "unscored"
    if score <= 3:
        return "low (1-3)"
    if score <= 6:
        return "medium (4-6)"
    return "high (7-10)"


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    days: Annotated[int, Query(ge=1, le=90)] = 7,
    keyword: Annotated[str | None, Query()] = None,
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
) -> AnalyticsResponse:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    base_where = [Article.created_at >= since]
    if keyword:
        base_where.append(func.lower(Article.keyword) == keyword.lower())

    # Total
    total = (
        await session.execute(
            select(func.count(Article.id)).where(and_(*base_where))
        )
    ).scalar_one()

    # By category
    cat_rows = (
        await session.execute(
            select(Article.category, func.count(Article.id))
            .where(and_(*base_where, Article.category.is_not(None)))
            .group_by(Article.category)
            .order_by(func.count(Article.id).desc())
        )
    ).all()
    by_category = [DistributionItem(label=c or "Other", count=n) for c, n in cat_rows]

    # By sentiment
    sent_rows = (
        await session.execute(
            select(Article.sentiment, func.count(Article.id))
            .where(and_(*base_where, Article.sentiment.is_not(None)))
            .group_by(Article.sentiment)
            .order_by(func.count(Article.id).desc())
        )
    ).all()
    by_sentiment = [DistributionItem(label=s, count=n) for s, n in sent_rows]

    # By source (top 10)
    src_rows = (
        await session.execute(
            select(Article.source_name, func.count(Article.id))
            .where(and_(*base_where))
            .group_by(Article.source_name)
            .order_by(func.count(Article.id).desc())
            .limit(10)
        )
    ).all()
    by_source = [DistributionItem(label=s or "unknown", count=n) for s, n in src_rows]

    # By keyword
    kw_rows = (
        await session.execute(
            select(Article.keyword, func.count(Article.id))
            .where(and_(*base_where, Article.keyword.is_not(None)))
            .group_by(Article.keyword)
            .order_by(func.count(Article.id).desc())
        )
    ).all()
    by_keyword = [DistributionItem(label=k, count=n) for k, n in kw_rows]

    # Importance buckets
    imp_rows = (
        await session.execute(
            select(Article.importance, func.count(Article.id))
            .where(and_(*base_where))
            .group_by(Article.importance)
        )
    ).all()
    buckets: dict[str, int] = {"low (1-3)": 0, "medium (4-6)": 0, "high (7-10)": 0, "unscored": 0}
    for imp, n in imp_rows:
        buckets[_bucket_importance(imp)] += n
    by_importance = [
        DistributionItem(label=k, count=v) for k, v in buckets.items() if v > 0
    ]

    # Timeline (daily counts using DATE_TRUNC for Postgres compat)
    day_col = func.date_trunc("day", Article.created_at)
    tl_rows = (
        await session.execute(
            select(day_col.label("day"), func.count(Article.id))
            .where(and_(*base_where))
            .group_by("day")
            .order_by("day")
        )
    ).all()
    timeline = [
        TimelinePoint(date=d.date().isoformat() if d else "unknown", count=n)
        for d, n in tl_rows
    ]

    log.info("analytics: days=%d keyword=%s total=%d", days, keyword, total)
    return AnalyticsResponse(
        window_days=days,
        total=total,
        by_category=by_category,
        by_sentiment=by_sentiment,
        by_source=by_source,
        by_keyword=by_keyword,
        by_importance=by_importance,
        timeline=timeline,
    )
