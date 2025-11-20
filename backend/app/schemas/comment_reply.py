from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class CommentReplyCreate(BaseModel):
    body: str
    parent_reply_id: Optional[str] = None


class CommentReplyRead(BaseModel):
    id: str
    review_id: str
    user_id: str
    parent_reply_id: Optional[str] = None
    body: str
    created_at: datetime
    updated_at: datetime
    author: dict  # Will be populated with user data
    child_replies: list = []

    @field_validator('id', 'review_id', 'user_id', 'parent_reply_id', mode='before')
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

