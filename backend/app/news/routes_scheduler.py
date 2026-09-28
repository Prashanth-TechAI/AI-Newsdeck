import asyncio
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.admin import admin_only
from app.auth.deps import current_user
from app.auth.models import User
from app.config import settings
from app.db import get_session
from app.news.db_models import FetchRun
from app.news.schemas import (
    FetchRunListResponse,
    FetchRunOut,
    RunNowResponse,
    SchedulerStatusResponse,
)
from app.scheduler import execute_run, get_last_run_id, get_next_run_at, is_in_flight


log = logging.getLogger("scheduler.routes")
router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])


@router.get("/status", response_model=SchedulerStatusResponse)
async def status(
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
) -> SchedulerStatusResponse:
    last_id = get_last_run_id()
    last = None
    if last_id is not None:
        last = (
            await session.execute(select(FetchRun).where(FetchRun.id == last_id))
        ).scalar_one_or_none()

    return SchedulerStatusResponse(
        enabled=settings.scheduler_enabled,
        interval_minutes=settings.scheduler_interval_minutes,
        running=settings.scheduler_enabled,
        next_run_at=get_next_run_at(),
        last_run=FetchRunOut.model_validate(last) if last else None,
        in_flight=is_in_flight(),
    )


@router.get("/runs", response_model=FetchRunListResponse)
async def list_runs(
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
) -> FetchRunListResponse:
    total = (await session.execute(select(func.count(FetchRun.id)))).scalar_one()
    rows = (
        await session.execute(
            select(FetchRun).order_by(desc(FetchRun.started_at)).limit(limit).offset(offset)
        )
    ).scalars().all()
    return FetchRunListResponse(
        total=total,
        items=[FetchRunOut.model_validate(r) for r in rows],
    )


@router.post("/run-now", response_model=RunNowResponse)
async def run_now(admin: User = Depends(admin_only)) -> RunNowResponse:
    if is_in_flight():
        return RunNowResponse(
            ok=False,
            message="A run is already in flight — try again in a moment.",
        )
    # Kick off in background and return immediately.
    task = asyncio.create_task(execute_run(triggered_by="manual", user_id=admin.id))
    log.info("manual run kicked off by user=%s task=%s", admin.email, task.get_name())
    return RunNowResponse(
        ok=True,
        message="Run started in background. Check /api/scheduler/runs for progress.",
    )
