from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create(db: Session, user_in: UserCreate) -> User:
    db_obj = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,  # Yeni kullanıcılar varsayılan olarak aktif
        is_superuser=False,  # Yeni kullanıcılar varsayılan olarak admin değil
        two_factor_enabled=user_in.two_factor_enabled,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_by_email(db, email=email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
