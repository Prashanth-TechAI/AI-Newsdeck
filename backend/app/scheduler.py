"""APScheduler-based news fetcher.

- Runs in-process (AsyncIOScheduler) inside the FastAPI event loop.
- On each tick: reads active keywords from DB, runs the agent, persists.
- Logs every run to the `fetch_runs` audit table.
- Uses an asyncio.Lock so overlapping ticks don't pile up.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import async_session_maker
from app.models import FetchRequest
from app.news.db_models import FetchRun, Keyword
from app.news.repo import persist_articles
from app.services.agent import run_agent


log = logging.getLogger("scheduler")

_scheduler: AsyncIOScheduler | None = None
_job_lock = asyncio.Lock()
_last_run_id: int | None = None
_in_flight: bool = False


JOB_ID = "news_fetch_job"


# ─── Core job ──────────────────────────────────────────────────────────────

async def _read_active_keywords(session: AsyncSession) -> list[str]:
    stmt = (
        select(Keyword)
        .where(Keyword.is_active.is_(True))
        .order_by(Keyword.last_fetched_at.asc().nullsfirst(), Keyword.created_at.asc())
        .limit(settings.scheduler_max_keywords_per_run)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [r.text for r in rows]


async def _record_run_start(
    session: AsyncSession, triggered_by: str, user_id: int | None
) -> FetchRun:
    run = FetchRun(
        triggered_by=triggered_by,
        triggered_by_user_id=user_id,
        status="running",
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)
    return run


async def _record_run_end(
    run: FetchRun,
    *,
    status: str,
    keywords_processed: int,
    articles_found: int,
    articles_persisted: int,
    elapsed: float,
    error: str | None = None,
) -> None:
    async with async_session_maker() as session:
        run = await session.get(FetchRun, run.id)
        run.status = status
        run.keywords_processed = keywords_processed
        run.articles_found = articles_found
        run.articles_persisted = articles_persisted
        run.elapsed_seconds = round(elapsed, 2)
        run.error_message = error
        run.finished_at = datetime.now(timezone.utc)
        await session.commit()


async def execute_run(triggered_by: str = "scheduler", user_id: int | None = None) -> int:
    """Run the agent against all active keywords. Returns the FetchRun id."""
    global _last_run_id, _in_flight

    if _job_lock.locked():
        log.warning("scheduled run skipped — previous run still in flight")
        async with async_session_maker() as s:
            run = FetchRun(
                triggered_by=triggered_by,
                triggered_by_user_id=user_id,
                status="skipped",
                finished_at=datetime.now(timezone.utc),
                error_message="previous run still in flight",
            )
            s.add(run)
            await s.commit()
            await s.refresh(run)
            _last_run_id = run.id
            return run.id

    async with _job_lock:
        _in_flight = True
        t0 = asyncio.get_event_loop().time()
        async with async_session_maker() as session:
            run = await _record_run_start(session, triggered_by, user_id)
        _last_run_id = run.id

        try:
            async with async_session_maker() as session:
                keywords = await _read_active_keywords(session)

            if not keywords:
                log.info("[run %d] no active keywords — nothing to do", run.id)
                await _record_run_end(
                    run, status="success", keywords_processed=0,
                    articles_found=0, articles_persisted=0,
                    elapsed=asyncio.get_event_loop().time() - t0,
                )
                return run.id

            log.info("[run %d] %s — %d active keyword(s): %s",
                     run.id, triggered_by, len(keywords), keywords)

            req = FetchRequest(keywords=keywords)
            result = await run_agent(req, user_id=user_id)

            # bump last_fetched_at on each processed keyword
            now = datetime.now(timezone.utc)
            async with async_session_maker() as session:
                for kw_text in keywords:
                    kw = (
                        await session.execute(
                            select(Keyword).where(Keyword.text == kw_text)
                        )
                    ).scalar_one_or_none()
                    if kw:
                        kw.last_fetched_at = now
                await session.commit()

            await _record_run_end(
                run, status="success",
                keywords_processed=len(keywords),
                articles_found=result.total_articles,
                articles_persisted=result.total_articles,
                elapsed=asyncio.get_event_loop().time() - t0,
            )
            log.info(
                "[run %d] success: %d keywords → %d articles in %.2fs",
                run.id, len(keywords), result.total_articles, result.elapsed_seconds,
            )
            return run.id

        except Exception as e:
            log.exception("[run %d] failed: %s", run.id, e)
            await _record_run_end(
                run, status="failed", keywords_processed=0,
                articles_found=0, articles_persisted=0,
                elapsed=asyncio.get_event_loop().time() - t0,
                error=f"{type(e).__name__}: {e}",
            )
            return run.id
        finally:
            _in_flight = False


# ─── Lifecycle ─────────────────────────────────────────────────────────────

def start_scheduler() -> None:
    global _scheduler
    if not settings.scheduler_enabled:
        log.info("scheduler disabled (SCHEDULER_ENABLED=false)")
        return
    if _scheduler is not None and _scheduler.running:
        return

    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(
        execute_run,
        IntervalTrigger(minutes=settings.scheduler_interval_minutes),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=60,
    )
    _scheduler.start()
    log.info(
        "scheduler started — fires every %d minutes (max %d keywords/run)",
        settings.scheduler_interval_minutes,
        settings.scheduler_max_keywords_per_run,
    )

    if settings.scheduler_run_on_startup:
        # fire and forget
        asyncio.create_task(execute_run("scheduler"))


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        log.info("scheduler stopped")
    _scheduler = None


# ─── Introspection ─────────────────────────────────────────────────────────

def get_next_run_at() -> datetime | None:
    if not _scheduler:
        return None
    job = _scheduler.get_job(JOB_ID)
    return job.next_run_time if job else None


def is_in_flight() -> bool:
    return _in_flight


def get_last_run_id() -> int | None:
    return _last_run_id
