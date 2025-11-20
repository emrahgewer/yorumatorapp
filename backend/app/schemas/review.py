from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


def _list_factory() -> list[str]:
    return []


class ReviewBase(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    title: str
    body: str
    pros: List[str] = Field(default_factory=_list_factory)
    cons: List[str] = Field(default_factory=_list_factory)


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    body: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None


class ReviewRead(ReviewBase):
    id: str
    user_id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReviewPublic(BaseModel):
    id: str
    product_id: str
    rating: int
    title: str
    body: str
    pros: List[str]
    cons: List[str]
    created_at: datetime
    author_alias: str


class ReviewProductInfo(BaseModel):
    id: str
    brand: str
    model: str

    class Config:
        from_attributes = True


class ReviewWithProduct(ReviewRead):
    product: ReviewProductInfo

    class Config(ReviewRead.Config):
        from_attributes = True


class ReviewCreatePublic(BaseModel):
    username: str | None = Field(None, min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=1)
