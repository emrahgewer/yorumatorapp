import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as PgEnum

from app.db.base_class import Base


class NotificationTypeEnum(str, Enum):
    new_review = "new_review"
    reply_to_review = "reply_to_review"
    like_on_review = "like_on_review"
    new_follower = "new_follower"
    product_price_drop = "product_price_drop"
    answer_to_question = "answer_to_question"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notification_type = Column(PgEnum(NotificationTypeEnum), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    related_review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id"), nullable=True)
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    extra_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], backref="notifications")
    related_product = relationship("Product", foreign_keys=[related_product_id])
    related_review = relationship("Review", foreign_keys=[related_review_id])
    related_user = relationship("User", foreign_keys=[related_user_id])

