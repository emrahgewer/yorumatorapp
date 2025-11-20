from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class NotificationRead(BaseModel):
    id: str
    notification_type: str
    title: str
    message: str
    is_read: bool
    related_product_id: Optional[str] = None
    related_review_id: Optional[str] = None
    related_user_id: Optional[str] = None
    extra_data: Optional[dict] = None
    created_at: datetime

    @field_validator('id', 'related_product_id', 'related_review_id', 'related_user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        if isinstance(v, str):
            return v
        return str(v)

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: bool

