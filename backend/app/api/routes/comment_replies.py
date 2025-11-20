from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import comment_reply as reply_crud
from app.schemas.comment_reply import CommentReplyCreate, CommentReplyRead

router = APIRouter()


@router.post("/reviews/{review_id}/replies", response_model=CommentReplyRead)
def create_reply(
    review_id: str,
    reply_data: CommentReplyCreate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    parent_id = UUID(reply_data.parent_reply_id) if reply_data.parent_reply_id else None
    reply = reply_crud.create_reply(
        db, UUID(review_id), current_user.id, reply_data.body, parent_id
    )
    
    # Populate author data
    author_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
    }
    
    return CommentReplyRead(
        id=str(reply.id),
        review_id=str(reply.review_id),
        user_id=str(reply.user_id),
        parent_reply_id=str(reply.parent_reply_id) if reply.parent_reply_id else None,
        body=reply.body,
        created_at=reply.created_at,
        updated_at=reply.updated_at,
        author=author_data,
        child_replies=[]
    )


@router.get("/reviews/{review_id}/replies")
def get_replies(
    review_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db_session),
):
    replies = reply_crud.get_replies_for_review(db, UUID(review_id), skip, limit)
    result = []
    for reply in replies:
        # Get child replies
        children = reply_crud.get_reply_children(db, reply.id)
        child_data = []
        for child in children:
            child_data.append({
                "id": str(child.id),
                "body": child.body,
                "author": {"id": str(child.user_id)},
                "created_at": child.created_at.isoformat(),
            })
        
        result.append({
            "id": str(reply.id),
            "review_id": str(reply.review_id),
            "user_id": str(reply.user_id),
            "body": reply.body,
            "created_at": reply.created_at.isoformat(),
            "updated_at": reply.updated_at.isoformat(),
            "author": {"id": str(reply.user_id)},
            "child_replies": child_data,
        })
    return result

