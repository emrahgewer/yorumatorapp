from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def create(db: Session, category_in: CategoryCreate) -> Category:
    db_obj = Category(**category_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(db: Session, category: Category, category_in: CategoryUpdate) -> Category:
    for field, value in category_in.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_all(db: Session, skip: int = 0, limit: int = 100):
    """Tüm kategorileri getir"""
    return (
        db.query(Category)
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )


def get_tree(db: Session):
    """Kategori ağacını getir (hierarchical)"""
    return db.query(Category).all()
