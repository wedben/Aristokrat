from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    max_errors_allowed = Column(Integer, default=0)
    questions_per_test = Column(Integer, default=0)  # Количество вопросов в тесте (0 = все вопросы)
    time_limit = Column(Integer, nullable=True)  # Ограничение по времени в секундах (null = без ограничения)

    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    progress = relationship("TestProgress", back_populates="test")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True)  # nullable для базы вопросов
    text = Column(Text, nullable=False)
    image_path = Column(String, nullable=True)

    test = relationship("Test", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="answers")

class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    correct_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    selected_questions = Column(Text, nullable=True)  # JSON строка с ID выбранных вопросов
    user_answers = Column(Text, nullable=True)  # JSON строка с ответами пользователя
    created_at = Column(DateTime(timezone=True), server_default=func.now())
