from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime

class CardView(Base):
    __tablename__ = "card_views"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    card_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)

class CardProgress(Base):
    __tablename__ = "card_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    card_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    viewed_count = Column(Integer, default=0)
    is_learned = Column(Boolean, default=False)
    learned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TestProgress(Base):
    __tablename__ = "test_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    is_passed = Column(Boolean, default=False)
    attempts_count = Column(Integer, default=0)
    
    # Связь с тестом
    test = relationship("Test", back_populates="progress")

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    activity_type = Column(String, nullable=False)  # 'card_view', 'test_start', 'test_complete'
    target_id = Column(Integer, nullable=True)  # card_id or test_id
    details = Column(String, nullable=True)  # JSON string for additional info
    created_at = Column(DateTime, default=datetime.utcnow)
