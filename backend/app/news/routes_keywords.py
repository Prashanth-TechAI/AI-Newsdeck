import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.admin import admin_only
from app.auth.deps import current_user
from app.auth.models import User
from app.db import get_session
from app.news.db_models import Keyword
from app.news.schemas import KeywordCreate, KeywordOut, KeywordUpdate


log = logging.getLogger("keywords")
router = APIRouter(prefix="/api/keywords", tags=["keywords"])


@router.get("", response_model=list[KeywordOut])
async def list_keywords(
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
) -> list[Keyword]:
    stmt = select(Keyword)
    if not include_inactive:
        stmt = stmt.where(Keyword.is_active.is_(True))
    stmt = stmt.order_by(Keyword.created_at.desc())
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.post("", response_model=KeywordOut, status_code=status.HTTP_201_CREATED)
async def create_keyword(
    payload: KeywordCreate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(admin_only),
) -> Keyword:
    text = payload.text.strip()
    if not text:
        raise HTTPException(400, "Keyword text cannot be empty.")

    existing = (
        await session.execute(
            select(Keyword).where(func.lower(Keyword.text) == text.lower())
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(409, "Keyword already exists.")

    kw = Keyword(text=text, is_active=True, created_by_id=admin.id)
    session.add(kw)
    await session.commit()
    await session.refresh(kw)
    log.info("keyword created: id=%d text=%r by user=%s", kw.id, kw.text, admin.email)
    return kw


@router.put("/{keyword_id}", response_model=KeywordOut)
async def update_keyword(
    keyword_id: int,
    payload: KeywordUpdate,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(admin_only),
) -> Keyword:
    kw = (
        await session.execute(select(Keyword).where(Keyword.id == keyword_id))
    ).scalar_one_or_none()
    if not kw:
        raise HTTPException(404, "Keyword not found.")

    if payload.text is not None:
        new_text = payload.text.strip()
        if not new_text:
            raise HTTPException(400, "Keyword text cannot be empty.")
        if new_text.lower() != kw.text.lower():
            dupe = (
                await session.execute(
                    select(Keyword).where(
                        func.lower(Keyword.text) == new_text.lower(),
                        Keyword.id != keyword_id,
                    )
                )
            ).scalar_one_or_none()
            if dupe:
                raise HTTPException(409, "Another keyword with that text already exists.")
        kw.text = new_text

    if payload.is_active is not None:
        kw.is_active = payload.is_active

    await session.commit()
    await session.refresh(kw)
    log.info("keyword updated: id=%d text=%r active=%s by user=%s",
             kw.id, kw.text, kw.is_active, admin.email)
    return kw


@router.delete("/{keyword_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keyword(
    keyword_id: int,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(admin_only),
) -> None:
    kw = (
        await session.execute(select(Keyword).where(Keyword.id == keyword_id))
    ).scalar_one_or_none()
    if not kw:
        raise HTTPException(404, "Keyword not found.")
    await session.delete(kw)
    await session.commit()
    log.info("keyword deleted: id=%d text=%r by user=%s", keyword_id, kw.text, admin.email)
