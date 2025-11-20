from sqlalchemy.orm import Session
from uuid import UUID

from app.models.question import Question, Answer


def create_question(db: Session, product_id: UUID, user_id: UUID, question_text: str) -> Question:
    question = Question(
        product_id=product_id,
        user_id=user_id,
        question_text=question_text
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def get_product_questions(db: Session, product_id: UUID, skip: int = 0, limit: int = 100):
    return db.query(Question).filter(
        Question.product_id == product_id
    ).order_by(Question.created_at.desc()).offset(skip).limit(limit).all()


def create_answer(db: Session, question_id: UUID, user_id: UUID, answer_text: str) -> Answer:
    answer = Answer(
        question_id=question_id,
        user_id=user_id,
        answer_text=answer_text
    )
    db.add(answer)
    
    # Update question answer count
    question = db.query(Question).filter(Question.id == question_id).first()
    if question:
        question.answer_count = (question.answer_count or 0) + 1
        question.is_answered = True
    
    db.commit()
    db.refresh(answer)
    return answer


def mark_answer_helpful(db: Session, answer_id: UUID) -> bool:
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        return False
    
    answer.helpful_count = (answer.helpful_count or 0) + 1
    answer.is_helpful = True
    db.commit()
    return True

