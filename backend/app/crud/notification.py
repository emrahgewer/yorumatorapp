from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.models.notification import Notification, NotificationTypeEnum


def create_notification(
    db: Session,
    user_id: UUID,
    notification_type: NotificationTypeEnum,
    title: str,
    message: str,
    related_product_id: UUID = None,
    related_review_id: UUID = None,
    related_user_id: UUID = None,
    extra_data: dict = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_product_id=related_product_id,
        related_review_id=related_review_id,
        related_user_id=related_user_id,
        extra_data=extra_data
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_user_notifications(db: Session, user_id: UUID, skip: int = 0, limit: int = 100, unread_only: bool = False):
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


def mark_notification_read(db: Session, notification_id: UUID, user_id: UUID) -> bool:
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if not notification:
        return False
    
    notification.is_read = True
    db.commit()
    return True


def mark_all_read(db: Session, user_id: UUID) -> int:
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return count


def get_unread_count(db: Session, user_id: UUID) -> int:
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

