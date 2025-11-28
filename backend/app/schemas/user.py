from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum
from typing import Optional
import re

class UserRole(str, Enum):
    admin = "admin"
    waiter = "waiter"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.waiter

class WaiterRegister(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str
    password_confirm: str
    phone: Optional[str] = None
    address: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        # Минимум 8 символов, буквы в разных регистрах и цифра
        if len(v) < 8:
            raise ValueError("Пароль должен быть не короче 8 символов")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать заглавную букву")
        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать строчную букву")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать цифру")
        return v

    @field_validator("password_confirm")
    @classmethod
    def passwords_match(cls, v: str, info):
        password = info.data.get("password")
        if password and v != password:
            raise ValueError("Пароли не совпадают")
        return v

class UserRead(UserBase):
    id: int
    is_active: bool
    phone: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserRead] = None
