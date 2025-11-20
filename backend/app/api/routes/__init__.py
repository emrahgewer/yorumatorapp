from fastapi import APIRouter

from app.api.routes import (
    auth, categories, products, reviews, users, gdpr, ingest,
    follow, favorites, review_likes, comment_replies, notifications, questions
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(reviews.public_router, tags=["reviews"])
api_router.include_router(gdpr.router, prefix="/gdpr", tags=["compliance"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(follow.router, tags=["social"])
api_router.include_router(favorites.router, tags=["social"])
api_router.include_router(review_likes.router, tags=["social"])
api_router.include_router(comment_replies.router, tags=["social"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(questions.router, tags=["qna"])
