from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api import deps
from app.crud import question as question_crud
from app.crud import product as product_crud
from app.schemas.question import QuestionCreate, QuestionRead, AnswerCreate, AnswerRead

router = APIRouter()


@router.post("/products/{product_id}/questions", response_model=QuestionRead)
def create_question(
    product_id: str,
    question_data: QuestionCreate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    # Check if product exists
    product = product_crud.get(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    question = question_crud.create_question(
        db, UUID(product_id), current_user.id, question_data.question_text
    )
    
    author_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
    }
    
    return QuestionRead(
        id=str(question.id),
        product_id=str(question.product_id),
        user_id=str(question.user_id),
        question_text=question.question_text,
        is_answered=question.is_answered,
        answer_count=question.answer_count,
        created_at=question.created_at,
        updated_at=question.updated_at,
        author=author_data,
        answers=[]
    )


@router.get("/products/{product_id}/questions", response_model=list[QuestionRead])
def get_product_questions(
    product_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db_session),
):
    questions = question_crud.get_product_questions(db, UUID(product_id), skip, limit)
    result = []
    for q in questions:
        author_data = {
            "id": str(q.user_id),
            "email": q.author.email if q.author else None,
            "full_name": q.author.full_name if q.author else None,
        }
        answers_data = []
        for ans in q.answers:
            answers_data.append({
                "id": str(ans.id),
                "answer_text": ans.answer_text,
                "author": {
                    "id": str(ans.user_id),
                    "email": ans.author.email if ans.author else None,
                    "full_name": ans.author.full_name if ans.author else None,
                },
                "created_at": ans.created_at.isoformat(),
            })
        
        result.append(QuestionRead(
            id=str(q.id),
            product_id=str(q.product_id),
            user_id=str(q.user_id),
            question_text=q.question_text,
            is_answered=q.is_answered,
            answer_count=q.answer_count,
            created_at=q.created_at,
            updated_at=q.updated_at,
            author=author_data,
            answers=answers_data
        ))
    return result


@router.post("/questions/{question_id}/answers", response_model=AnswerRead)
def create_answer(
    question_id: str,
    answer_data: AnswerCreate,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    answer = question_crud.create_answer(
        db, UUID(question_id), current_user.id, answer_data.answer_text
    )
    
    author_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
    }
    
    return AnswerRead(
        id=str(answer.id),
        question_id=str(answer.question_id),
        user_id=str(answer.user_id),
        answer_text=answer.answer_text,
        is_helpful=answer.is_helpful,
        helpful_count=answer.helpful_count,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
        author=author_data
    )


@router.post("/answers/{answer_id}/helpful")
def mark_answer_helpful(
    answer_id: str,
    current_user=Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db_session),
):
    success = question_crud.mark_answer_helpful(db, UUID(answer_id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found")
    return {"message": "Marked as helpful"}

