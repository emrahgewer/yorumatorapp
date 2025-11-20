import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    brand = Column(String(120), nullable=False)
    model = Column(String(160), nullable=False)
    sku = Column(String(120), nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), default="TRY")
    specs = Column(JSONB, nullable=True)
    is_verified = Column(Boolean, default=False)
    import_source = Column(String(120), nullable=True)
    average_rating = Column(Numeric(3, 2), nullable=True)
    review_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product")
    media = relationship("MediaAsset", back_populates="product")
