from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.review import Review
from app.schemas.common import Message

router = APIRouter()


@router.get("/export", response_model=Message)
def export_user_data(
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).all()
    payload = {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
        },
        "reviews": [
            {
                "id": str(review.id),
                "product_id": str(review.product_id),
                "rating": review.rating,
                "title": review.title,
                "body": review.body,
                "pros": review.pros,
                "cons": review.cons,
            }
            for review in reviews
        ],
    }
    return Message(message="export-ready", detail=payload)


@router.delete("/erase", status_code=status.HTTP_202_ACCEPTED, response_model=Message)
def erase_user_data(
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    current_user.deleted_at = current_user.deleted_at or datetime.utcnow()
    db.add(current_user)
    db.commit()
    return Message(message="erase-requested", detail="Records queued for anonymization")
