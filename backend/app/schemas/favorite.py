from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class FavoriteCreate(BaseModel):
    product_id: str


class FavoriteRead(BaseModel):
    id: str
    product_id: str
    created_at: datetime
    product: dict  # Will be populated with product data

    @field_validator('id', 'product_id', mode='before')
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

