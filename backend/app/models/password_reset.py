from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime


class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # ID админа, который одобрил
    is_completed = Column(Boolean, default=False, nullable=False)  # Пароль был изменен
    completed_at = Column(DateTime, nullable=True)

