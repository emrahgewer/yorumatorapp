from sqlalchemy.orm import Session, joinedload

from app.models.review import Review, ReviewStatusEnum
from app.schemas.review import ReviewCreate, ReviewUpdate


def create(db: Session, review_in: ReviewCreate, *, user_id: str) -> Review:
    db_obj = Review(**review_in.model_dump(), user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, review: Review, review_in: ReviewUpdate) -> Review:
    for field, value in review_in.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_product_reviews_paginated(
    db: Session,
    product_id: str,
    *,
    skip: int = 0,
    limit: int = 20,
    status: ReviewStatusEnum | None = ReviewStatusEnum.approved,
):
    query = (
        db.query(Review)
        .options(joinedload(Review.author))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    if status:
        query = query.filter(Review.status == status)
    return query.offset(skip).limit(min(limit, 100)).all()


def get_user_reviews(db: Session, user_id: str, *, skip: int = 0, limit: int = 20):
    return (
        db.query(Review)
        .options(joinedload(Review.product))
        .filter(Review.user_id == user_id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )
