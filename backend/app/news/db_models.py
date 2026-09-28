"""SQLAlchemy models: Keyword, Article, FetchRun."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Keyword(Base):
    """Shared admin-managed keyword list (one global set, not per-user)."""

    __tablename__ = "keywords"
    __table_args__ = (
        # Postgres expression index: case-insensitive uniqueness
        Index("uq_keyword_lower_text", text("lower(text)"), unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_fetched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class Article(Base):
    """Persisted article. Matches spec section 2.5 + agent extras."""

    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Spec fields
    title: Mapped[str] = mapped_column(Text, nullable=False)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    article_url: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    published_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    sentiment: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Agent extensions (powers the dashboard)
    keyword: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    importance: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    relevance: Mapped[int | None] = mapped_column(Integer, nullable=True)
    key_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)

    fetched_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class FetchRun(Base):
    """Audit trail of every scheduler / manual agent run."""

    __tablename__ = "fetch_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    triggered_by: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    # "scheduler" | "manual" | "user"
    triggered_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="running", index=True)
    # "running" | "success" | "failed" | "skipped"

    keywords_processed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    articles_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    articles_persisted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    elapsed_seconds: Mapped[float | None] = mapped_column(nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
