from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.review_like import ReviewLike


def toggle_like(db: Session, review_id: UUID, user_id: UUID, is_like: bool) -> ReviewLike:
    existing = db.query(ReviewLike).filter(
        ReviewLike.review_id == review_id,
        ReviewLike.user_id == user_id
    ).first()
    
    if existing:
        if existing.is_like == is_like:
            # Same action, remove like/dislike
            db.delete(existing)
            db.commit()
            return None
        else:
            # Different action, update
            existing.is_like = is_like
            db.commit()
            db.refresh(existing)
            return existing
    else:
        # New like/dislike
        like = ReviewLike(review_id=review_id, user_id=user_id, is_like=is_like)
        db.add(like)
        db.commit()
        db.refresh(like)
        return like


def get_like_stats(db: Session, review_id: UUID, user_id: UUID = None) -> dict:
    like_count = db.query(func.count(ReviewLike.id)).filter(
        ReviewLike.review_id == review_id,
        ReviewLike.is_like == True
    ).scalar() or 0
    
    dislike_count = db.query(func.count(ReviewLike.id)).filter(
        ReviewLike.review_id == review_id,
        ReviewLike.is_like == False
    ).scalar() or 0
    
    user_like_status = None
    if user_id:
        user_like = db.query(ReviewLike).filter(
            ReviewLike.review_id == review_id,
            ReviewLike.user_id == user_id
        ).first()
        if user_like:
            user_like_status = user_like.is_like
    
    return {
        "like_count": like_count,
        "dislike_count": dislike_count,
        "user_like_status": user_like_status,
    }

