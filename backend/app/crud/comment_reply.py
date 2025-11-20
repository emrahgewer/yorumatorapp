from sqlalchemy.orm import Session
from uuid import UUID

from app.models.comment_reply import CommentReply


def create_reply(db: Session, review_id: UUID, user_id: UUID, body: str, parent_reply_id: UUID = None) -> CommentReply:
    reply = CommentReply(
        review_id=review_id,
        user_id=user_id,
        body=body,
        parent_reply_id=parent_reply_id
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


def get_replies_for_review(db: Session, review_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(CommentReply).filter(
        CommentReply.review_id == review_id,
        CommentReply.parent_reply_id == None  # Top-level replies only
    ).offset(skip).limit(limit).all()


def get_reply_children(db: Session, parent_reply_id: UUID):
    return db.query(CommentReply).filter(
        CommentReply.parent_reply_id == parent_reply_id
    ).all()

