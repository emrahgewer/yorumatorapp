from sqlalchemy.orm import Session
from uuid import UUID

from app.models.favorite import FavoriteProduct


def add_favorite(db: Session, user_id: UUID, product_id: UUID) -> FavoriteProduct:
    existing = db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == user_id,
        FavoriteProduct.product_id == product_id
    ).first()
    
    if existing:
        raise ValueError("Product already in favorites")
    
    favorite = FavoriteProduct(user_id=user_id, product_id=product_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite


def remove_favorite(db: Session, user_id: UUID, product_id: UUID) -> bool:
    favorite = db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == user_id,
        FavoriteProduct.product_id == product_id
    ).first()
    
    if not favorite:
        return False
    
    db.delete(favorite)
    db.commit()
    return True


def is_favorite(db: Session, user_id: UUID, product_id: UUID) -> bool:
    return db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == user_id,
        FavoriteProduct.product_id == product_id
    ).first() is not None


def get_user_favorites(db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(FavoriteProduct).filter(
        FavoriteProduct.user_id == user_id
    ).offset(skip).limit(limit).all()

