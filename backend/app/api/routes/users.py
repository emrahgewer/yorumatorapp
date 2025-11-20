from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import deps
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_current_user(
    current_user=Depends(deps.get_current_user),
):
    return UserRead.model_validate(current_user)
