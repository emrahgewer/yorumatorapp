from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None
    type: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    otp: str | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    two_factor_enabled: bool = False


class TwoFactorSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
