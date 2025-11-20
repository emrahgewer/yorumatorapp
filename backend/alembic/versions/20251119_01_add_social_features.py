"""add social features

Revision ID: 20251119_01
Revises: 20251118_01
Create Date: 2025-11-19 10:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20251119_01"
down_revision = "20251118_01"
branch_labels = None
depends_on = None


notification_type_enum = postgresql.ENUM(
    "new_review",
    "reply_to_review",
    "like_on_review",
    "new_follower",
    "product_price_drop",
    "answer_to_question",
    name="notificationtypeenum",
    create_type=False,
)


def upgrade() -> None:
    # Enum'u oluştur (zaten varsa hata vermez)
    bind = op.get_bind()
    notification_type_enum.create(bind, checkfirst=True)

    # User Follows
    op.create_table(
        "user_follows",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("follower_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("following_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "following_id", name="unique_follow"),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_user_follows_follower", "user_follows", ["follower_id"])
    op.create_index("ix_user_follows_following", "user_follows", ["following_id"])

    # Favorite Products
    op.create_table(
        "favorite_products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "product_id", name="unique_favorite"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_favorite_products_user", "favorite_products", ["user_id"])
    op.create_index("ix_favorite_products_product", "favorite_products", ["product_id"])

    # Comment Replies
    op.create_table(
        "comment_replies",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_reply_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_reply_id"], ["comment_replies.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_comment_replies_review", "comment_replies", ["review_id"])
    op.create_index("ix_comment_replies_user", "comment_replies", ["user_id"])

    # Notifications
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notification_type", notification_type_enum, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("related_product_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_review_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("extra_data", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_user", "notifications", ["user_id"])
    op.create_index("ix_notifications_read", "notifications", ["is_read"])

    # Questions
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("is_answered", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("answer_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_questions_product", "questions", ["product_id"])
    op.create_index("ix_questions_user", "questions", ["user_id"])

    # Answers
    op.create_table(
        "answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=False),
        sa.Column("is_helpful", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("helpful_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_answers_question", "answers", ["question_id"])
    op.create_index("ix_answers_user", "answers", ["user_id"])

    # Badges
    op.create_table(
        "badges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_badges_name"),
    )

    # User Badges
    op.create_table(
        "user_badges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("badge_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("earned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["badge_id"], ["badges.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_user_badges_user", "user_badges", ["user_id"])

    # Review Likes
    op.create_table(
        "review_likes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_like", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("review_id", "user_id", name="unique_review_like"),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_review_likes_review", "review_likes", ["review_id"])
    op.create_index("ix_review_likes_user", "review_likes", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_review_likes_user", table_name="review_likes")
    op.drop_index("ix_review_likes_review", table_name="review_likes")
    op.drop_table("review_likes")
    
    op.drop_index("ix_user_badges_user", table_name="user_badges")
    op.drop_table("user_badges")
    op.drop_table("badges")
    
    op.drop_index("ix_answers_user", table_name="answers")
    op.drop_index("ix_answers_question", table_name="answers")
    op.drop_table("answers")
    
    op.drop_index("ix_questions_user", table_name="questions")
    op.drop_index("ix_questions_product", table_name="questions")
    op.drop_table("questions")
    
    op.drop_index("ix_notifications_read", table_name="notifications")
    op.drop_index("ix_notifications_user", table_name="notifications")
    op.drop_table("notifications")
    
    op.drop_index("ix_comment_replies_user", table_name="comment_replies")
    op.drop_index("ix_comment_replies_review", table_name="comment_replies")
    op.drop_table("comment_replies")
    
    op.drop_index("ix_favorite_products_product", table_name="favorite_products")
    op.drop_index("ix_favorite_products_user", table_name="favorite_products")
    op.drop_table("favorite_products")
    
    op.drop_index("ix_user_follows_following", table_name="user_follows")
    op.drop_index("ix_user_follows_follower", table_name="user_follows")
    op.drop_table("user_follows")
    
    notification_type_enum.drop(op.get_bind(), checkfirst=True)

