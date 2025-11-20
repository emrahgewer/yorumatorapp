from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import review_like as like_crud
from app.schemas.review_like import ReviewLikeCreate, ReviewLikeStats

router = APIRouter()


@router.post("/reviews/{review_id}/like")
def toggle_like(
    review_id: str,
    like_data: ReviewLikeCreate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    result = like_crud.toggle_like(db, UUID(review_id), current_user.id, like_data.is_like)
    if result:
        return {"message": "Liked" if like_data.is_like else "Disliked"}
    else:
        return {"message": "Removed"}


@router.get("/reviews/{review_id}/likes", response_model=ReviewLikeStats)
def get_like_stats(
    review_id: str,
    current_user=Depends(deps.get_current_user_optional),
    db: Session = Depends(deps.get_db_session),
):
    user_id = current_user.id if current_user else None
    stats = like_crud.get_like_stats(db, UUID(review_id), user_id)
    return ReviewLikeStats(**stats)

