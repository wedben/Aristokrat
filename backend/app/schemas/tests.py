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
    answers: List[AnswerRead]
    class Config:
        from_attributes = True

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
    max_errors_allowed: int = 0
    questions: List[QuestionCreate] = []

class TestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_errors_allowed: Optional[int] = None
    questions: Optional[List[QuestionCreate]] = None

class TestRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    is_active: bool
    max_errors_allowed: int
    questions: List[QuestionRead]
    class Config:
        from_attributes = True

class SubmitAnswer(BaseModel):
    question_id: int
    answer_ids: List[int]

class AttemptResult(BaseModel):
    correct_count: int
    total_count: int

class TestProgressRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    score: int
    max_score: int
    is_passed: bool
    attempts_count: int
    test: Optional[TestRead] = None
    class Config:
        from_attributes = True
