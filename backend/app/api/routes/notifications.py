from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import notification as notification_crud
from app.schemas.notification import NotificationRead, NotificationUpdate

router = APIRouter()


@router.get("/notifications", response_model=list[NotificationRead])
def get_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    notifications = notification_crud.get_user_notifications(
        db, current_user.id, skip, limit, unread_only
    )
    return [NotificationRead.model_validate(n) for n in notifications]


@router.get("/notifications/unread-count")
def get_unread_count(
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    count = notification_crud.get_unread_count(db, current_user.id)
    return {"count": count}


@router.patch("/notifications/{notification_id}", response_model=NotificationRead)
def mark_notification_read(
    notification_id: str,
    notification_data: NotificationUpdate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    success = notification_crud.mark_notification_read(
        db, UUID(notification_id), current_user.id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    # Return updated notification
    notifications = notification_crud.get_user_notifications(
        db, UUID(current_user.id), 0, 1
    )
    for n in notifications:
        if str(n.id) == notification_id:
            return NotificationRead.model_validate(n)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")


@router.post("/notifications/mark-all-read")
def mark_all_read(
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    count = notification_crud.mark_all_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read"}

