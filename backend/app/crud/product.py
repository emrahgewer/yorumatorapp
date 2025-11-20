from typing import Any, Dict, Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.review import Review, ReviewStatusEnum
from app.schemas.product import ProductCreate, ProductUpdate


def create(db: Session, product_in: ProductCreate) -> Product:
    import uuid
    from app.models.category import Category
    
    # category_id'yi string'den UUID'ye dönüştür
    try:
        category_uuid = uuid.UUID(product_in.category_id) if isinstance(product_in.category_id, str) else product_in.category_id
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid category_id format: {product_in.category_id}")
    
    # Kategori var mı kontrol et
    category = db.query(Category).filter(Category.id == category_uuid).first()
    if not category:
        raise ValueError(f"Category with id {product_in.category_id} not found")
    
    # Product oluştur
    product_data = product_in.model_dump(exclude={'category_id'})
    product_data['category_id'] = category_uuid
    
    db_obj = Product(**product_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, product: Product, product_in: ProductUpdate) -> Product:
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def get(db: Session, product_id: str) -> Optional[Product]:
    import uuid
    # product_id'yi UUID'ye çevir
    product_uuid = uuid.UUID(product_id) if isinstance(product_id, str) else product_id
    return db.query(Product).filter(Product.id == product_uuid).first()


def get_multi(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 20,
    brand: str | None = None,
    category_id: str | None = None,
    search: str | None = None,
    sort_by: str | None = None,
    min_rating: float | None = None,
):
    query = db.query(Product)
    
    # Filtreleme
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if category_id:
        import uuid
        category_uuid = uuid.UUID(category_id) if isinstance(category_id, str) else category_id
        query = query.filter(Product.category_id == category_uuid)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.brand.ilike(search_term),
                Product.model.ilike(search_term)
            )
        )
    if min_rating is not None:
        query = query.filter(Product.average_rating >= min_rating)
    
    # Sıralama
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc().nullslast())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc().nullslast())
    elif sort_by == "rating_desc":
        query = query.order_by(Product.average_rating.desc().nullslast())
    else:
        # Varsayılan: en yeni ürünler
        query = query.order_by(Product.created_at.desc())
    
    return (
        query.offset(skip)
        .limit(min(limit, 100))
        .all()
    )


def get_distinct_brands(db: Session) -> list[str]:
    """Veritabanındaki tüm ürünlerin tekilleştirilmiş markalarını getir."""
    from sqlalchemy import distinct
    
    brands = (
        db.query(distinct(Product.brand))
        .filter(Product.brand.isnot(None))
        .order_by(Product.brand.asc())
        .all()
    )
    # Tuple'ları string'e çevir
    return [brand[0] for brand in brands if brand[0]]


def refresh_rating_cache(db: Session, product_id: str) -> Dict[str, Any]:
    """Recompute rating aggregates and persist denormalized fields on the product row."""
    import uuid
    product = get(db, product_id)
    if not product:
        return {"average_rating": None, "review_count": 0}

    # product_id'yi UUID'ye çevir
    product_uuid = uuid.UUID(product_id) if isinstance(product_id, str) else product_id

    agg = (
        db.query(
            func.avg(Review.rating).label("average_rating"),
            func.count(Review.id).label("review_count"),
        )
        .filter(
            Review.product_id == product_uuid,
            Review.status == ReviewStatusEnum.approved,
        )
        .one()
    )
    average = float(agg.average_rating) if agg.average_rating is not None else None
    review_count = int(agg.review_count)

    product.average_rating = average
    product.review_count = review_count
    db.add(product)
    db.commit()
    db.refresh(product)

    return {"average_rating": average, "review_count": review_count}
