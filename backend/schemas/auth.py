from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from core.constants import LOGIN_MODE_TYPE, ROLE_TYPE, TIER_TYPE
from schemas.user import UserRead


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: ROLE_TYPE = "merchandiser"
    subscription_tier: TIER_TYPE | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    login_as: LOGIN_MODE_TYPE | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    token_type: Literal["bearer"] = "bearer"
    access_token: str
    refresh_token: str


class AuthResponseData(BaseModel):
    user: UserRead
    tokens: TokenPair
