from enum import Enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as PgEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ReviewStatusEnum(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    title = Column(String(160), nullable=False)
    body = Column(Text, nullable=False)
    pros = Column(ARRAY(Text), nullable=False)
    cons = Column(ARRAY(Text), nullable=False)
    status = Column(PgEnum(ReviewStatusEnum), default=ReviewStatusEnum.pending, nullable=False)
    ai_flags = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    author = relationship("User", back_populates="reviews")
    aspects = relationship("ReviewAspect", back_populates="review")
    votes = relationship("ReviewVote", back_populates="review")


class ReviewAspect(Base):
    __tablename__ = "review_aspects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False)
    aspect = Column(String(100), nullable=False)
    sentiment_score = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=True)

    review = relationship("Review", back_populates="aspects")


class ReviewVote(Base):
    __tablename__ = "review_votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    vote = Column(Integer, nullable=False)

    review = relationship("Review", back_populates="votes")
