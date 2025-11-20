from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.follow import UserFollow
from app.models.user import User


def follow_user(db: Session, follower_id: UUID, following_id: UUID) -> UserFollow:
    if follower_id == following_id:
        raise ValueError("Cannot follow yourself")
    
    existing = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if existing:
        raise ValueError("Already following this user")
    
    follow = UserFollow(follower_id=follower_id, following_id=following_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow


def unfollow_user(db: Session, follower_id: UUID, following_id: UUID) -> bool:
    follow = db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first()
    
    if not follow:
        return False
    
    db.delete(follow)
    db.commit()
    return True


def is_following(db: Session, follower_id: UUID, following_id: UUID) -> bool:
    return db.query(UserFollow).filter(
        UserFollow.follower_id == follower_id,
        UserFollow.following_id == following_id
    ).first() is not None


def get_user_profile(db: Session, user_id: UUID, current_user_id: UUID = None) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    follower_count = db.query(func.count(UserFollow.id)).filter(
        UserFollow.following_id == user_id
    ).scalar() or 0
    
    following_count = db.query(func.count(UserFollow.id)).filter(
        UserFollow.follower_id == user_id
    ).scalar() or 0
    
    review_count = len(user.reviews) if user.reviews else 0
    
    is_following_user = False
    if current_user_id:
        is_following_user = is_following(db, current_user_id, user_id)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "follower_count": follower_count,
        "following_count": following_count,
        "review_count": review_count,
        "is_following": is_following_user,
        "created_at": user.created_at,
    }


def get_followers(db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(UserFollow).filter(
        UserFollow.following_id == user_id
    ).offset(skip).limit(limit).all()


def get_following(db: Session, user_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(UserFollow).filter(
        UserFollow.follower_id == user_id
    ).offset(skip).limit(limit).all()

