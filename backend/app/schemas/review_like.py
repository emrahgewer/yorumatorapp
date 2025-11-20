from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ReviewLikeCreate(BaseModel):
    is_like: bool  # True for like, False for dislike


class ReviewLikeRead(BaseModel):
    id: str
    review_id: str
    user_id: str
    is_like: bool
    created_at: datetime

    @field_validator('id', 'review_id', 'user_id', mode='before')
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


class ReviewLikeStats(BaseModel):
    like_count: int = 0
    dislike_count: int = 0
    user_like_status: Optional[bool] = None  # True=liked, False=disliked, None=no action

