from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class FollowCreate(BaseModel):
    following_id: str


class FollowRead(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime

    @field_validator('id', 'follower_id', 'following_id', mode='before')
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


class UserProfileRead(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    follower_count: int = 0
    following_count: int = 0
    review_count: int = 0
    is_following: bool = False
    created_at: datetime

    @field_validator('id', mode='before')
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

