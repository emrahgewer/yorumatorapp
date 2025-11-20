from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class CategoryBase(BaseModel):
    name: str
    slug: str
    parent_id: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None


class CategoryRead(CategoryBase):
    id: str

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

    @field_validator('parent_id', mode='before')
    @classmethod
    def convert_parent_uuid_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        if isinstance(v, str):
            return v
        return str(v) if v else None

    class Config:
        from_attributes = True
