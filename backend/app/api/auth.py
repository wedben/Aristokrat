from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.security import get_db, get_password_hash, verify_password, create_access_token, get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, Token, WaiterRegister
from pydantic import BaseModel
from fastapi import Query

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db), current_user: Optional[User] = Depends(lambda: None)):
    # Правила: первый пользователь -> admin; далее публично можно регистрировать только waiter
    existing_count = db.query(User).count()

    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if existing_count == 0:
        role = UserRole.admin
    else:
        if user_in.role != UserRole.waiter:
            # Не-админам нельзя создавать администраторов
            if current_user is None or current_user.role != UserRole.admin:
                raise HTTPException(status_code=403, detail="Only admin can create non-waiter users")
        role = user_in.role

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register/waiter", response_model=UserRead)
def register_waiter(payload: WaiterRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=f"{payload.first_name} {payload.last_name}",
        hashed_password=get_password_hash(payload.password),
        role=UserRole.waiter,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=Token)
def login(form: LoginRequest, db: Session = Depends(get_db)):
    user: Optional[User] = db.query(User).filter(User.email == form.email).first()
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Проверяем, заблокирован ли пользователь
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is blocked")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token, user=user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
