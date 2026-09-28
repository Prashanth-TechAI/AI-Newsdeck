import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import current_user
from app.auth.models import User
from app.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SigninRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.auth.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    verify_password,
)
from app.config import settings
from app.db import get_session


log = logging.getLogger("auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, session: AsyncSession = Depends(get_session)):
    existing = (
        await session.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        hashed_password=hash_password(payload.password),
        is_admin=False,
        is_active=True,
    )
    # First registered user becomes admin (handy for MVP)
    user_count = (await session.execute(select(User.id))).first()
    if user_count is None:
        user.is_admin = True

    session.add(user)
    await session.commit()
    await session.refresh(user)

    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()

    token, expires_in = create_access_token(user.id, user.email)
    log.info("signup ok: user_id=%d email=%s admin=%s", user.id, user.email, user.is_admin)
    return TokenResponse(
        access_token=token,
        expires_in_seconds=expires_in,
        user=UserOut.model_validate(user),
    )


@router.post("/signin", response_model=TokenResponse)
async def signin(payload: SigninRequest, session: AsyncSession = Depends(get_session)):
    user = (
        await session.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated.")

    user.last_login_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(user)

    token, expires_in = create_access_token(user.id, user.email)
    log.info("signin ok: user_id=%d email=%s", user.id, user.email)
    return TokenResponse(
        access_token=token,
        expires_in_seconds=expires_in,
        user=UserOut.model_validate(user),
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    payload: ForgotPasswordRequest, session: AsyncSession = Depends(get_session)
):
    user = (
        await session.execute(select(User).where(User.email == payload.email.lower()))
    ).scalar_one_or_none()

    # Always return success — don't leak whether email exists
    generic_msg = (
        "If an account exists for this email, password reset instructions have been sent."
    )

    if not user:
        log.info("forgot-password: email not found (%s) — returning generic ok", payload.email)
        return ForgotPasswordResponse(message=generic_msg)

    token = generate_reset_token()
    user.reset_token = token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_expires_minutes
    )
    await session.commit()
    log.info(
        "forgot-password: token issued for user_id=%d email=%s (expires in %dm)",
        user.id, user.email, settings.password_reset_expires_minutes,
    )

    # In production, email this. In MVP we surface it so testing is possible.
    return ForgotPasswordResponse(
        message=generic_msg
        + " (DEV: token returned in dev_reset_token field — wire up email in production.)",
        dev_reset_token=token,
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    payload: ResetPasswordRequest, session: AsyncSession = Depends(get_session)
):
    user = (
        await session.execute(select(User).where(User.reset_token == payload.token))
    ).scalar_one_or_none()
    if not user or not user.reset_token_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    expires = user.reset_token_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await session.commit()
    log.info("reset-password ok for user_id=%d email=%s", user.id, user.email)

    return ResetPasswordResponse(message="Password updated. You can now sign in.")


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)):
    return UserOut.model_validate(user)
