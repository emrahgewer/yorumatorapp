from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import follow as follow_crud
from app.schemas.follow import FollowRead, UserProfileRead

router = APIRouter()


@router.post("/users/{user_id}/follow", response_model=FollowRead)
def follow_user(
    user_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    try:
        follow = follow_crud.follow_user(db, current_user.id, UUID(user_id))
        return FollowRead.model_validate(follow)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    success = follow_crud.unfollow_user(db, current_user.id, UUID(user_id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not following this user")
    return {"message": "Unfollowed successfully"}


@router.get("/users/{user_id}/profile", response_model=UserProfileRead)
def get_user_profile(
    user_id: str,
    current_user=Depends(deps.get_current_user_optional),
    db: Session = Depends(deps.get_db_session),
):
    current_user_id = current_user.id if current_user else None
    profile = follow_crud.get_user_profile(db, UUID(user_id), current_user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserProfileRead(**profile)


@router.get("/users/me/followers")
def get_my_followers(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    followers = follow_crud.get_followers(db, current_user.id, skip, limit)
    return [FollowRead.model_validate(f) for f in followers]


@router.get("/users/me/following")
def get_my_following(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    following = follow_crud.get_following(db, current_user.id, skip, limit)
    return [FollowRead.model_validate(f) for f in following]

