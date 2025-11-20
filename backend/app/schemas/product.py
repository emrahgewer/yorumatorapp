from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    category_id: UUID
    brand: str
    model: str
    sku: Optional[str] = None
    price: Optional[float] = None
    currency: str = "TRY"
    specs: Optional[Dict[str, Any]] = None


class ProductCreate(BaseModel):
    category_id: str = Field(..., description="Kategori UUID'si (string formatında)")
    brand: str = Field(..., min_length=1, max_length=120, description="Ürün markası")
    model: str = Field(..., min_length=1, max_length=160, description="Ürün modeli")
    sku: Optional[str] = Field(None, max_length=120, description="Ürün SKU kodu")
    price: Optional[float] = Field(None, ge=0, description="Ürün fiyatı (0 veya pozitif)")
    currency: str = Field("TRY", max_length=3, description="Para birimi (varsayılan: TRY)")
    specs: Optional[Dict[str, Any]] = Field(None, description="Teknik özellikler (JSON objesi)")


class ProductUpdate(BaseModel):
    price: Optional[float] = None
    specs: Optional[Dict[str, Any]] = None
    is_verified: Optional[bool] = None


class ProductRead(ProductBase):
    id: UUID
    is_verified: bool
    average_rating: float | None = None
    review_count: int = 0

    class Config:
        from_attributes = True


class ProductSummary(ProductRead):
    """Ürün özet bilgisi - liste görünümü için"""
    average_rating: Optional[float] = None
    review_count: int = 0


class ProductDetail(ProductSummary):
    """Ürün detay bilgisi - detay sayfası için"""
    average_rating: Optional[float] = None
    review_count: int = 0
