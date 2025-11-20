from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import category as category_crud
from app.schemas.category import CategoryRead

router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(deps.get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """Tüm kategorileri listele"""
    categories = category_crud.get_all(db, skip=skip, limit=limit)
    return [CategoryRead.model_validate(cat) for cat in categories]

