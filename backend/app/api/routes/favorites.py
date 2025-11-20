from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import favorite as favorite_crud
from app.crud import product as product_crud
from app.schemas.favorite import FavoriteRead
from app.schemas.product import ProductRead

router = APIRouter()


@router.post("/products/{product_id}/favorite", response_model=FavoriteRead)
def add_favorite(
    product_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    # Check if product exists
    product = product_crud.get(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    try:
        favorite = favorite_crud.add_favorite(db, current_user.id, UUID(product_id))
        product = product_crud.get(db, product_id)
        product_dict = ProductRead.model_validate(product).model_dump() if product else {}
        return FavoriteRead(
            id=str(favorite.id),
            product_id=str(favorite.product_id),
            created_at=favorite.created_at,
            product=product_dict
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{product_id}/favorite")
def remove_favorite(
    product_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    success = favorite_crud.remove_favorite(db, current_user.id, UUID(product_id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    return {"message": "Removed from favorites"}


@router.get("/products/{product_id}/favorite")
def check_favorite(
    product_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    is_fav = favorite_crud.is_favorite(db, current_user.id, UUID(product_id))
    return {"is_favorite": is_fav}


@router.get("/users/me/favorites")
def get_my_favorites(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    favorites = favorite_crud.get_user_favorites(db, current_user.id, skip, limit)
    result = []
    for fav in favorites:
        product = product_crud.get(db, str(fav.product_id))
        if product:
            product_dict = ProductRead.model_validate(product).model_dump()
            result.append(FavoriteRead(
                id=str(fav.id),
                product_id=str(fav.product_id),
                created_at=fav.created_at,
                product=product_dict
            ))
    return result

