import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.api_response import error_payload
from core.constants import (
    ERROR_CODE_ACCOUNT_TYPE_MISMATCH,
    ERROR_CODE_EMAIL_EXISTS,
    ERROR_CODE_INVALID_CREDENTIALS,
    LOGIN_MODE_TO_ROLE_TIER,
    ROLE_TO_DEFAULT_TIER,
)
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from models.user import User
from schemas.auth import LoginRequest, RegisterRequest, TokenPair


def _normalize_key(value: str) -> str:
    return value.strip().lower().replace("_", " ").replace("-", " ")


def _resolve_login_mode(login_as: str | None) -> tuple[str, str] | None:
    if login_as is None:
        return None
    return LOGIN_MODE_TO_ROLE_TIER.get(_normalize_key(login_as))


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    email = payload.email.lower()
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error_payload(ERROR_CODE_EMAIL_EXISTS, "Email is already registered."),
        )

    subscription_tier = payload.subscription_tier or ROLE_TO_DEFAULT_TIER[payload.role]

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        subscription_tier=subscription_tier,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> User:
    email = payload.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_payload(ERROR_CODE_INVALID_CREDENTIALS, "Email or password is incorrect."),
        )

    requested_login_mode = _resolve_login_mode(payload.login_as)
    if requested_login_mode is not None:
        expected_role, expected_tier = requested_login_mode
        if user.role != expected_role or user.subscription_tier != expected_tier:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_payload(
                    ERROR_CODE_ACCOUNT_TYPE_MISMATCH,
                    "The selected login mode does not match this account.",
                ),
            )

    return user


def build_token_pair(user: User) -> TokenPair:
    user_id = str(user.id)
    return TokenPair(
        access_token=create_access_token(
            subject=user_id,
            role=user.role,
            subscription_tier=user.subscription_tier,
        ),
        refresh_token=create_refresh_token(
            subject=user_id,
            role=user.role,
            subscription_tier=user.subscription_tier,
        ),
    )


async def refresh_session(db: AsyncSession, refresh_token: str) -> tuple[User, TokenPair]:
    payload = decode_token(refresh_token)
    if payload.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_payload("invalid_token_type", "Expected a refresh token."),
        )

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_payload("invalid_token", "Token subject is missing."),
        )

    try:
        user_id = uuid.UUID(subject)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_payload("invalid_token", "Token subject is invalid."),
        ) from exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_payload("user_not_found", "Token user does not exist."),
        )

    return user, build_token_pair(user)
