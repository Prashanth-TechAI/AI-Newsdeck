from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    is_admin: bool
    created_at: datetime
    last_login_at: datetime | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserOut


class ForgotPasswordResponse(BaseModel):
    ok: bool = True
    message: str
    # Returned ONLY for dev — in production this token would be emailed.
    dev_reset_token: str | None = None


class ResetPasswordResponse(BaseModel):
    ok: bool = True
    message: str
