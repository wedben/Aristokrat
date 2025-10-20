from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import get_db, get_current_user, require_role
from app.models.tests import Test, Question, Answer, TestAttempt
from app.models.user import User, UserRole
from app.models.activity import TestProgress, UserActivity
from app.schemas.tests import TestCreate, TestRead, TestUpdate, AttemptResult, SubmitAnswer, TestProgressRead

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/", response_model=List[TestRead])
def list_tests(db: Session = Depends(get_db)):
    return db.query(Test).filter(Test.is_active == True).all()


@router.post("/", response_model=TestRead, dependencies=[Depends(require_role(UserRole.admin))])
def create_test(payload: TestCreate, db: Session = Depends(get_db)):
    test = Test(
        title=payload.title, 
        description=payload.description, 
        is_active=payload.is_active,
        max_errors_allowed=payload.max_errors_allowed
    )
    db.add(test)
    db.flush()
    for q in payload.questions:
        question = Question(test_id=test.id, text=q.text, image_path=q.image_path)
        db.add(question)
        db.flush()
        for a in q.answers:
            answer = Answer(question_id=question.id, text=a.text, is_correct=a.is_correct)
            db.add(answer)
    db.commit()
    db.refresh(test)
    return test


@router.post("/{test_id}/start")
def start_test(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Начать тест - создает запись о прогрессе"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Создаем запись о начале теста
    progress = TestProgress(user_id=current_user.id, test_id=test_id)
    db.add(progress)
    
    # Записываем активность
    activity = UserActivity(
        user_id=current_user.id,
        activity_type="test_start",
        target_id=test_id,
        details=f"Начал тест: {test.title}"
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Test started", "test_id": test_id}

@router.post("/{test_id}/submit", response_model=AttemptResult)
def submit_test(test_id: int, answers: List[SubmitAnswer], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Получаем тест
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    questions = db.query(Question).filter(Question.test_id == test_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this test")

    # Создаем карту ответов пользователя
    user_answers = {answer.question_id: set(answer.answer_ids) for answer in answers}
    
    correct = 0
    total = 0
    for q in questions:
        total += 1
        # Получаем правильные ответы для этого вопроса
        correct_answers = {a.id for a in q.answers if a.is_correct}
        # Получаем ответы пользователя для этого вопроса
        user_question_answers = user_answers.get(q.id, set())
        
        # Ответ считается правильным, если пользователь выбрал все правильные ответы и не выбрал неправильные
        if correct_answers == user_question_answers:
            correct += 1

    # Определяем статус теста на основе допустимых ошибок
    errors_made = total - correct
    is_passed = errors_made <= test.max_errors_allowed
    
    # Ищем существующий прогресс (завершенный или незавершенный)
    progress = db.query(TestProgress).filter(
        TestProgress.user_id == current_user.id,
        TestProgress.test_id == test_id
    ).first()
    
    if progress:
        # Увеличиваем счетчик попыток
        progress.attempts_count += 1
        
        # Обновляем только если новый результат лучше
        # Лучший результат: меньше ошибок или больше правильных ответов при том же количестве ошибок
        current_errors = progress.max_score - progress.score
        new_errors = errors_made
        
        should_update = (
            new_errors < current_errors or  # Меньше ошибок
            (new_errors == current_errors and correct > progress.score) or  # Столько же ошибок, но больше правильных
            (not progress.is_passed and is_passed)  # Переход от "не пройден" к "пройден"
        )
        
        if should_update:
            progress.completed_at = db.query(func.now()).scalar()
            progress.score = correct
            progress.max_score = total
            progress.is_passed = is_passed
    else:
        # Создаем новую запись
        progress = TestProgress(
            user_id=current_user.id,
            test_id=test_id,
            completed_at=db.query(func.now()).scalar(),
            score=correct,
            max_score=total,
            is_passed=is_passed,
            attempts_count=1
        )
        db.add(progress)

    attempt = TestAttempt(user_id=current_user.id, test_id=test_id, correct_count=correct, total_count=total)
    db.add(attempt)
    
    # Записываем активность завершения
    activity = UserActivity(
        user_id=current_user.id,
        activity_type="test_complete",
        target_id=test_id,
        details=f"Завершил тест: {test.title}, результат: {correct}/{total}"
    )
    db.add(activity)
    
    db.commit()

    return AttemptResult(correct_count=correct, total_count=total)


@router.get("/{test_id}", response_model=TestRead)
def get_test(test_id: int, db: Session = Depends(get_db)):
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


@router.put("/{test_id}", response_model=TestRead, dependencies=[Depends(require_role(UserRole.admin))])
def update_test(test_id: int, payload: TestUpdate, db: Session = Depends(get_db)):
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Обновляем основные поля
    if payload.title is not None:
        test.title = payload.title
    if payload.description is not None:
        test.description = payload.description
    if payload.is_active is not None:
        test.is_active = payload.is_active
    if payload.max_errors_allowed is not None:
        test.max_errors_allowed = payload.max_errors_allowed
    
    # Обновляем вопросы если они переданы
    if payload.questions is not None:
        # Удаляем старые вопросы
        db.query(Question).filter(Question.test_id == test_id).delete()
        
        # Добавляем новые вопросы
        for q in payload.questions:
            question = Question(test_id=test.id, text=q.text, image_path=q.image_path)
            db.add(question)
            db.flush()
            for a in q.answers:
                answer = Answer(question_id=question.id, text=a.text, is_correct=a.is_correct)
                db.add(answer)
    
    db.commit()
    db.refresh(test)
    return test


@router.get("/attempts/me")
def my_attempts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TestAttempt).filter(TestAttempt.user_id == current_user.id).all()


@router.get("/progress/me", response_model=List[TestProgressRead])
def my_test_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получить прогресс по всем тестам для текущего пользователя"""
    from sqlalchemy.orm import joinedload
    
    progress = db.query(TestProgress).options(
        joinedload(TestProgress.test)
    ).filter(
        TestProgress.user_id == current_user.id,
        TestProgress.completed_at.isnot(None)
    ).all()
    return progress
