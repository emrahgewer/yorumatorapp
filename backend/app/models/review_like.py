import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_like = Column(Boolean, nullable=False)  # True for like, False for dislike
    created_at = Column(DateTime, default=datetime.utcnow)

    review = relationship("Review", backref="likes")
    user = relationship("User", backref="review_likes")

    __table_args__ = (
        UniqueConstraint('review_id', 'user_id', name='unique_review_like'),
    )

