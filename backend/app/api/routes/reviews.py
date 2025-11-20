import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import product as product_crud
from app.crud import review as review_crud
from app.models.product import Product
from app.models.review import Review, ReviewStatusEnum
from app.models.user import User
from app.schemas.common import Message
from app.schemas.review import (
    ReviewCreate,
    ReviewCreatePublic,
    ReviewPublic,
    ReviewRead,
    ReviewWithProduct,
)

router = APIRouter()
public_router = APIRouter()


def _anonymize_user(user: User | None) -> str:
    if not user:
        return "Anonim Kullanıcı"
    prefix = str(user.id).replace("-", "").upper()[:6]
    return f"Anonim Kullanıcı {prefix}"


@router.post("/", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    product_exists = db.query(Product.id).filter(Product.id == payload.product_id).first()
    if not product_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    review = review_crud.create(db, review_in=payload, user_id=str(current_user.id))
    product_crud.refresh_rating_cache(db, payload.product_id)
    return ReviewRead.model_validate(review)


@public_router.get(
    "/products/{product_id}/reviews",
    response_model=list[ReviewPublic],
    status_code=status.HTTP_200_OK,
)
def list_product_reviews(
    product_id: str,
    db: Session = Depends(deps.get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    product_exists = db.query(Product.id).filter(Product.id == product_id).first()
    if not product_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    reviews = review_crud.get_product_reviews_paginated(
        db, product_id=product_id, skip=skip, limit=limit
    )
    result: list[ReviewPublic] = []
    for review in reviews:
        result.append(
            ReviewPublic(
                id=str(review.id),
                product_id=str(review.product_id),
                rating=review.rating,
                title=review.title,
                body=review.body,
                pros=review.pros or [],
                cons=review.cons or [],
                created_at=review.created_at,
                author_alias=_anonymize_user(review.author),
            )
        )
    return result


@public_router.post(
    "/products/{product_id}/reviews",
    response_model=Message,
    status_code=status.HTTP_201_CREATED,
)
def create_product_review_public(
    product_id: str,
    payload: ReviewCreatePublic,
    current_user: User | None = Depends(deps.get_current_user_optional),
    db: Session = Depends(deps.get_db_session),
):
    # UUID'ye çevir
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID format")

    product_exists = db.query(Product.id).filter(Product.id == product_uuid).first()
    if not product_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # JWT token varsa gerçek kullanıcıyı kullan, yoksa anonim kullanıcı oluştur
    if current_user:
        # JWT ile giriş yapılmış - gerçek kullanıcıyı kullan
        review_user = current_user
        author_alias = current_user.full_name or current_user.email.split('@')[0]
    else:
        # Anonim kullanıcı için username zorunlu
        if not payload.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is required for anonymous reviews"
            )
        
        # Anonim kullanıcı oluştur veya mevcut anonim kullanıcıyı kullan
        anon_email = f"anon_{payload.username.lower().replace(' ', '_')}@yorumator.local"
        review_user = db.query(User).filter(User.email == anon_email).first()
        
        if not review_user:
            from app.core.security import get_password_hash
            review_user = User(
                email=anon_email,
                password_hash=get_password_hash("anon_password_123"),
                full_name=payload.username,
                is_active=True,
            )
            db.add(review_user)
            db.flush()
        
        author_alias = payload.username

    # Review oluştur - UUID objelerini kullan
    db_obj = Review(
        product_id=product_uuid,
        user_id=review_user.id,
        rating=payload.rating,
        title=f"Yorum - {author_alias}",
        body=payload.text,
        pros=[],
        cons=[],
        status=ReviewStatusEnum.approved,  # Public yorumlar otomatik onaylanır
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    product_crud.refresh_rating_cache(db, str(product_uuid))
    
    review_public = ReviewPublic(
        id=str(db_obj.id),
        product_id=str(db_obj.product_id),
        rating=db_obj.rating,
        title=db_obj.title,
        body=db_obj.body,
        pros=db_obj.pros or [],
        cons=db_obj.cons or [],
        created_at=db_obj.created_at,
        author_alias=author_alias,
    )
    
    return Message(
        message="Yeni yorum başarıyla eklendi",
        detail=review_public.model_dump(),
    )


@public_router.get(
    "/users/me/reviews",
    response_model=list[ReviewWithProduct],
    status_code=status.HTTP_200_OK,
)
def list_my_reviews(
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    reviews = review_crud.get_user_reviews(
        db, user_id=str(current_user.id), skip=skip, limit=limit
    )
    return [ReviewWithProduct.model_validate(review) for review in reviews]
