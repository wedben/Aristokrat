from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import random
import os

from app.core.security import get_db, get_current_user, require_role
from app.models.tests import Test, Question, Answer, TestAttempt
from app.models.user import User, UserRole
from app.models.activity import TestProgress, UserActivity
from app.schemas.tests import (
    TestCreate, TestRead, TestUpdate, 
    QuestionCreate, QuestionRead,
    AttemptResult, SubmitAnswer, SubmitTestRequest,
    TestProgressRead, TestAttemptRead
)

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
        max_errors_allowed=payload.max_errors_allowed,
        questions_per_test=payload.questions_per_test,
        time_limit=payload.time_limit
    )
    db.add(test)
    db.flush()
    
    # Добавляем новые вопросы в базу вопросов этого теста
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


@router.get("/{test_id}/questions")
def get_test_questions(test_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получить вопросы для теста (случайный выбор если настроено)"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Получаем все вопросы из базы вопросов этого теста (все вопросы, привязанные к тесту)
    test_pool_questions = db.query(Question).filter(Question.test_id == test_id).all()
    
    if not test_pool_questions:
        raise HTTPException(status_code=404, detail="No questions found for this test")
    
    # Если questions_per_test > 0, выбираем случайные вопросы из базы вопросов этого теста
    if test.questions_per_test > 0 and test.questions_per_test <= len(test_pool_questions):
        # Выбираем случайные вопросы из базы вопросов этого теста
        selected_questions = random.sample(test_pool_questions, test.questions_per_test)
    elif test.questions_per_test > 0 and test.questions_per_test > len(test_pool_questions):
        # Если запрошено больше вопросов, чем есть в базе, используем все доступные
        selected_questions = test_pool_questions
    else:
        # Если questions_per_test == 0, используем все вопросы из базы вопросов этого теста
        selected_questions = test_pool_questions
    
    # Возвращаем вопросы без правильных ответов
    questions_data = []
    for q in selected_questions:
        question_data = {
            "id": q.id,
            "text": q.text,
            "image_path": q.image_path,
            "answers": [{"id": a.id, "text": a.text} for a in q.answers]  # Без is_correct
        }
        questions_data.append(question_data)
    
    return {
        "test_id": test_id,
        "questions": questions_data,
        "total_questions": len(questions_data)
    }

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
def submit_test(test_id: int, payload: SubmitTestRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    answers = payload.answers
    completion_time = payload.completion_time
    # Получаем тест
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Получаем ID вопросов из ответов пользователя
    question_ids = {answer.question_id for answer in answers}
    
    # Получаем вопросы по их ID (могут быть из базы или привязанные к тесту)
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this test")

    # Создаем карту ответов пользователя
    user_answers = {answer.question_id: set(answer.answer_ids) for answer in answers}
    
    correct = 0
    total = 0
    question_results = []
    
    for q in questions:
        total += 1
        # Получаем правильные ответы для этого вопроса
        correct_answers = {a.id for a in q.answers if a.is_correct}
        # Получаем ответы пользователя для этого вопроса
        user_question_answers = user_answers.get(q.id, set())
        
        # Ответ считается правильным, если пользователь выбрал все правильные ответы и не выбрал неправильные
        is_correct = correct_answers == user_question_answers
        if is_correct:
            correct += 1
        
        # Сохраняем результат для каждого вопроса
        question_results.append({
            "question_id": q.id,
            "question_text": q.text,
            "is_correct": is_correct,
            "user_answers": list(user_question_answers)
        })

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
            if completion_time is not None:
                progress.completion_time = completion_time
    else:
        # Создаем новую запись
        progress = TestProgress(
            user_id=current_user.id,
            test_id=test_id,
            completed_at=db.query(func.now()).scalar(),
            completion_time=completion_time,
            score=correct,
            max_score=total,
            is_passed=is_passed,
            attempts_count=1
        )
        db.add(progress)

    # Сохраняем детальную информацию о попытке
    selected_questions_ids = [q.id for q in questions]
    user_answers_json = json.dumps({str(k): list(v) for k, v in user_answers.items()})
    
    attempt = TestAttempt(
        user_id=current_user.id, 
        test_id=test_id, 
        correct_count=correct, 
        total_count=total,
        selected_questions=json.dumps(selected_questions_ids),
        user_answers=user_answers_json
    )
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

    return AttemptResult(correct_count=correct, total_count=total, question_results=question_results)


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
    if payload.questions_per_test is not None:
        test.questions_per_test = payload.questions_per_test
    if payload.time_limit is not None:
        test.time_limit = payload.time_limit
    
    # Обновляем вопросы если они переданы и массив не пустой
    # Теперь вопросы управляются через базу вопросов отдельно, поэтому не удаляем их при обновлении теста
    # Эта логика оставлена для обратной совместимости, но используется только если явно переданы вопросы
    if payload.questions is not None and len(payload.questions) > 0:
        # Удаляем старые вопросы из базы этого теста
        db.query(Question).filter(Question.test_id == test_id).delete()
        
        # Добавляем новые вопросы в базу этого теста
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

@router.get("/attempts/{attempt_id}/results")
def get_attempt_results(attempt_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получить детальные результаты попытки прохождения теста"""
    attempt = db.query(TestAttempt).filter(
        TestAttempt.id == attempt_id,
        TestAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Получаем тест
    test = db.query(Test).get(attempt.test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Получаем вопросы из попытки
    selected_questions_ids = json.loads(attempt.selected_questions) if attempt.selected_questions else []
    questions = db.query(Question).filter(Question.id.in_(selected_questions_ids)).all()
    
    # Получаем ответы пользователя
    user_answers = json.loads(attempt.user_answers) if attempt.user_answers else {}
    
    # Формируем детальные результаты
    question_results = []
    for q in questions:
        user_question_answers = set(user_answers.get(str(q.id), []))
        correct_answers = {a.id for a in q.answers if a.is_correct}
        
        is_correct = correct_answers == user_question_answers
        
        question_results.append({
            "question_id": q.id,
            "question_text": q.text,
            "is_correct": is_correct,
            "user_answers": list(user_question_answers),
            "all_answers": [{"id": a.id, "text": a.text} for a in q.answers]  # Без is_correct
        })
    
    return {
        "attempt_id": attempt.id,
        "test_title": test.title,
        "correct_count": attempt.correct_count,
        "total_count": attempt.total_count,
        "question_results": question_results
    }


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


# ==================== База вопросов для конкретного теста (Question Pool) ====================

@router.get("/{test_id}/questions/pool", response_model=List[QuestionRead], dependencies=[Depends(require_role(UserRole.admin))])
def get_question_pool_for_test(test_id: int, db: Session = Depends(get_db)):
    """Получить все вопросы из базы вопросов конкретного теста"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    questions = db.query(Question).filter(Question.test_id == test_id).all()
    return questions


@router.post("/{test_id}/questions/pool", response_model=QuestionRead, dependencies=[Depends(require_role(UserRole.admin))])
def create_question_in_pool(test_id: int, payload: QuestionCreate, db: Session = Depends(get_db)):
    """Создать вопрос в базе вопросов конкретного теста"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    question = Question(test_id=test_id, text=payload.text, image_path=payload.image_path)
    db.add(question)
    db.flush()
    for a in payload.answers:
        answer = Answer(question_id=question.id, text=a.text, is_correct=a.is_correct)
        db.add(answer)
    db.commit()
    db.refresh(question)
    return question


@router.put("/{test_id}/questions/pool/{question_id}", response_model=QuestionRead, dependencies=[Depends(require_role(UserRole.admin))])
def update_question_in_pool(test_id: int, question_id: int, payload: QuestionCreate, db: Session = Depends(get_db)):
    """Обновить вопрос в базе вопросов конкретного теста"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.test_id == test_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in test pool")
    
    question.text = payload.text
    question.image_path = payload.image_path
    
    # Удаляем старые ответы ПЕРЕД добавлением новых (сначала удаляем, затем коммитим)
    db.query(Answer).filter(Answer.question_id == question_id).delete()
    db.flush()  # Убеждаемся, что удаление выполняется перед добавлением
    
    # Добавляем новые ответы
    for a in payload.answers:
        answer = Answer(question_id=question.id, text=a.text, is_correct=a.is_correct)
        db.add(answer)
    
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{test_id}/questions/pool/{question_id}", dependencies=[Depends(require_role(UserRole.admin))])
def delete_question_from_pool(test_id: int, question_id: int, db: Session = Depends(get_db)):
    """Удалить вопрос из базы вопросов конкретного теста"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.test_id == test_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in test pool")
    
    db.delete(question)
    db.commit()
    return {"message": "Question deleted from test pool"}


@router.post("/{test_id}/questions/pool/{question_id}/upload-image", dependencies=[Depends(require_role(UserRole.admin))])
def upload_question_image(test_id: int, question_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Загрузить изображение для вопроса в базе вопросов теста"""
    test = db.query(Test).get(test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.test_id == test_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in test pool")
    
    # Создаем папку для изображений если её нет
    upload_dir = "uploads/tests"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Генерируем имя файла
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"test_{test_id}_question_{question_id}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # Обновляем путь к изображению в БД
    question.image_path = f"/uploads/tests/{filename}"
    db.commit()
    
    return {"message": "Изображение загружено", "image_path": f"/uploads/tests/{filename}"}
