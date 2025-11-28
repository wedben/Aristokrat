from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AnswerCreate(BaseModel):
    text: str
    is_correct: bool = False

class AnswerRead(BaseModel):
    id: int
    text: str
    is_correct: bool
    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    text: str
    image_path: Optional[str] = None
    answers: List[AnswerCreate]

class QuestionRead(BaseModel):
    id: int
    text: str
    image_path: Optional[str] = None
    test_id: Optional[int] = None  # ID теста, к которому привязан вопрос
    answers: List[AnswerRead]
    class Config:
        from_attributes = True

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
    max_errors_allowed: int = 0
    questions_per_test: int = 0  # Количество вопросов в тесте (0 = все вопросы из базы)
    time_limit: Optional[int] = None  # Ограничение по времени в секундах (null = без ограничения)
    questions: List[QuestionCreate] = []  # Вопросы для добавления в базу вопросов этого теста

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_errors_allowed: Optional[int] = None
    questions_per_test: Optional[int] = None  # Количество вопросов в тесте (0 = все вопросы)
    time_limit: Optional[int] = None  # Ограничение по времени в секундах (null = без ограничения)
    questions: Optional[List[QuestionCreate]] = None  # Вопросы для обновления базы вопросов этого теста

class TestRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_active: bool
    max_errors_allowed: int
    questions_per_test: int
    time_limit: Optional[int] = None  # Ограничение по времени в секундах (null = без ограничения)
    questions: List[QuestionRead]
    class Config:
        from_attributes = True

class SubmitAnswer(BaseModel):
    question_id: int
    answer_ids: List[int]

class SubmitTestRequest(BaseModel):
    answers: List[SubmitAnswer]
    completion_time: Optional[int] = None  # Время прохождения в секундах

class AttemptResult(BaseModel):
    correct_count: int
    total_count: int
    question_results: List[dict]  # Детальные результаты по каждому вопросу

class TestAttemptRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    correct_count: int
    total_count: int
    selected_questions: Optional[str] = None
    user_answers: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class TestProgressRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    completion_time: Optional[int] = None  # Время прохождения в секундах
    score: int
    max_score: int
    is_passed: bool
    attempts_count: int
    test: Optional[TestRead] = None
    class Config:
        from_attributes = True
