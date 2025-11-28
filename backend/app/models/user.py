from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.database.session import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    waiter = "waiter"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_pending_verification = Column(Boolean, default=False)  # True для новых пользователей, ожидающих верификацию
    role = Column(Enum(UserRole), default=UserRole.waiter, nullable=False)
