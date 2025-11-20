from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_2fa_secret,
    get_totp_uri,
)
from app.crud import user as user_crud
from app.schemas import auth as auth_schema
from app.schemas.user import UserRead, UserCreate

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: auth_schema.RegisterRequest, db: Session = Depends(deps.get_db_session)):
    try:
        # Email kontrolü
        existing_user = user_crud.get_by_email(db, payload.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # UserCreate şeması oluştur
        user_in = UserCreate(
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            two_factor_enabled=payload.two_factor_enabled,
        )
        
        # Kullanıcı oluştur
        user = user_crud.create(db, user_in=user_in)
        
        # UUID'yi string'e çevirerek UserRead oluştur
        user_read = UserRead(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            two_factor_enabled=user.two_factor_enabled,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        
        return user_read
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_trace = traceback.format_exc()
        logger.error(f"Register error: {str(e)}\n{error_trace}")
        # Daha detaylı hata mesajı döndür
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=auth_schema.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db_session)):
    user = user_crud.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")

    deps.enforce_totp(user, otp=form_data.scopes[0] if form_data.scopes else None)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return auth_schema.Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=auth_schema.Token)
def refresh(payload: auth_schema.RefreshRequest):
    try:
        decoded = decode_token(payload.refresh_token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    return auth_schema.Token(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/2fa/setup", response_model=auth_schema.TwoFactorSetupResponse)
def setup_2fa(current_user=Depends(deps.get_current_user), db: Session = Depends(deps.get_db_session)):
    secret = generate_2fa_secret(current_user.email)
    current_user.two_factor_secret = secret
    current_user.two_factor_enabled = True
    db.add(current_user)
    db.commit()
    return auth_schema.TwoFactorSetupResponse(secret=secret, provisioning_uri=get_totp_uri(secret, current_user.email))
