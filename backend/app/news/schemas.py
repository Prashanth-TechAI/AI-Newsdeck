"""Pydantic schemas for news endpoints (keywords, articles, analytics, scheduler)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ─── Keywords ──────────────────────────────────────────────────────────────

class KeywordCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=255)


class KeywordUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None


class KeywordOut(BaseModel):
    id: int
    text: str
    is_active: bool
    created_at: datetime
    last_fetched_at: datetime | None = None
    created_by_id: int | None = None

    class Config:
        from_attributes = True


# ─── Articles ──────────────────────────────────────────────────────────────

class ArticleSummaryOut(BaseModel):
    summary: str | None
    category: str | None
    sentiment: str | None
    importance: int | None
    relevance: int | None
    key_points: list[str] | None
    tags: list[str] | None


class ArticleOut(BaseModel):
    id: int
    title: str
    source_name: str
    article_url: str
    published_date: datetime | None
    image_url: str | None
    keyword: str | None
    created_at: datetime
    summary: ArticleSummaryOut

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ArticleOut]


# ─── Analytics ─────────────────────────────────────────────────────────────

class DistributionItem(BaseModel):
    label: str
    count: int


class TimelinePoint(BaseModel):
    date: str       # ISO yyyy-mm-dd
    count: int


class AnalyticsResponse(BaseModel):
    window_days: int
    total: int
    by_category: list[DistributionItem]
    by_sentiment: list[DistributionItem]
    by_source: list[DistributionItem]      # top N
    by_keyword: list[DistributionItem]
    by_importance: list[DistributionItem]  # bucketed 1-3 / 4-6 / 7-10
    timeline: list[TimelinePoint]


# ─── Scheduler ─────────────────────────────────────────────────────────────

class FetchRunOut(BaseModel):
    id: int
    triggered_by: str
    triggered_by_user_id: int | None
    started_at: datetime
    finished_at: datetime | None
    status: str
    keywords_processed: int
    articles_found: int
    articles_persisted: int
    elapsed_seconds: float | None
    error_message: str | None

    class Config:
        from_attributes = True


class SchedulerStatusResponse(BaseModel):
    enabled: bool
    interval_minutes: int
    running: bool
    next_run_at: datetime | None
    last_run: FetchRunOut | None
    in_flight: bool


class RunNowResponse(BaseModel):
    ok: bool
    message: str
    run_id: int | None = None


class FetchRunListResponse(BaseModel):
    total: int
    items: list[FetchRunOut]


# ─── Sort options (used by article list) ───────────────────────────────────

ArticleSort = Literal["newest", "oldest", "importance", "relevance"]
