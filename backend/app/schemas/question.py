from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class QuestionCreate(BaseModel):
    question_text: str


class QuestionRead(BaseModel):
    id: str
    product_id: str
    user_id: str
    question_text: str
    is_answered: bool
    answer_count: int
    created_at: datetime
    updated_at: datetime
    author: dict  # Will be populated with user data
    answers: list = []

    @field_validator('id', 'product_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        if isinstance(v, str):
            return v
        return str(v)

    class Config:
        from_attributes = True


class AnswerCreate(BaseModel):
    answer_text: str


class AnswerRead(BaseModel):
    id: str
    question_id: str
    user_id: str
    answer_text: str
    is_helpful: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    author: dict  # Will be populated with user data

    @field_validator('id', 'question_id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        if isinstance(v, str):
            return v
        return str(v)

    class Config:
        from_attributes = True

