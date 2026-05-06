from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.security import get_db, get_password_hash, require_role
from app.models.user import User, UserRole
from app.models.password_reset import PasswordResetRequest
from app.schemas.password_reset import (
    PasswordResetRequestCreate,
    PasswordResetRequestRead,
    PasswordResetApprove,
    PasswordResetSetNew
)

router = APIRouter(prefix="/password-reset", tags=["password-reset"])


@router.post("/request", response_model=dict)
def request_password_reset(
    request: PasswordResetRequestCreate,
    db: Session = Depends(get_db)
):
    """Пользователь запрашивает восстановление пароля"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # Не раскрываем, существует ли пользователь
        return {
            "message": "Если пользователь с таким email существует, запрос на восстановление пароля отправлен администратору"
        }
    
    # Проверяем, есть ли уже активный (незавершенный) запрос
    # Активным считается любой запрос, который еще не завершен (пароль не установлен)
    existing_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.user_id == user.id,
        PasswordResetRequest.is_completed == False
    ).first()
    
    if existing_request:
        if existing_request.is_approved:
            raise HTTPException(
                status_code=400,
                detail="У вас уже есть подтвержденный запрос на восстановление пароля. Проверьте его статус или дождитесь завершения."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="У вас уже есть активный запрос на восстановление пароля. Ожидайте подтверждения администратора."
            )
    
    # Создаем новый запрос
    reset_request = PasswordResetRequest(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        requested_at=datetime.utcnow()
    )
    
    db.add(reset_request)
    db.commit()
    db.refresh(reset_request)
    
    return {
        "message": "Запрос на восстановление пароля отправлен администратору. Ожидайте подтверждения.",
        "request_id": reset_request.id
    }


@router.get("/check-approved")
def check_approved_request(
    email: str,
    db: Session = Depends(get_db)
):
    """Публичный endpoint для проверки, есть ли одобренный запрос для email"""
    reset_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.email == email,
        PasswordResetRequest.is_approved == True,
        PasswordResetRequest.is_completed == False
    ).first()
    
    if reset_request:
        return {
            "has_approved_request": True,
            "request_id": reset_request.id
        }
    
    return {
        "has_approved_request": False
    }

@router.get("/requests", response_model=List[PasswordResetRequestRead])
def get_password_reset_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin))
):
    """Получить все запросы на восстановление пароля (только для админа)"""
    requests = db.query(PasswordResetRequest).order_by(
        PasswordResetRequest.requested_at.desc()
    ).all()
    
    return requests


@router.post("/approve", response_model=dict)
def approve_password_reset(
    approve: PasswordResetApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    """Админ подтверждает запрос на восстановление пароля"""
    reset_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.id == approve.request_id
    ).first()
    
    if not reset_request:
        raise HTTPException(status_code=404, detail="Запрос не найден")
    
    if reset_request.is_approved:
        raise HTTPException(status_code=400, detail="Запрос уже подтвержден")
    
    if reset_request.is_completed:
        raise HTTPException(status_code=400, detail="Пароль уже был изменен")
    
    # Подтверждаем запрос
    reset_request.is_approved = True
    reset_request.approved_at = datetime.utcnow()
    reset_request.approved_by = current_user.id
    
    db.commit()
    
    return {
        "message": "Запрос подтвержден. Пользователь может теперь установить новый пароль.",
        "request_id": reset_request.id,
        "user_email": reset_request.email
    }


@router.post("/set-new-password", response_model=dict)
def set_new_password(
    new_password: PasswordResetSetNew,
    db: Session = Depends(get_db)
):
    """Пользователь устанавливает новый пароль после подтверждения админом"""
    reset_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.id == new_password.request_id
    ).first()
    
    if not reset_request:
        raise HTTPException(status_code=404, detail="Запрос не найден")
    
    if not reset_request.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Запрос еще не подтвержден администратором"
        )
    
    if reset_request.is_completed:
        raise HTTPException(
            status_code=400,
            detail="Пароль уже был изменен"
        )
    
    # Получаем пользователя
    user = db.query(User).filter(User.id == reset_request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Устанавливаем новый пароль
    user.hashed_password = get_password_hash(new_password.new_password)
    
    # Помечаем запрос как выполненный
    reset_request.is_completed = True
    reset_request.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Пароль успешно изменен. Теперь вы можете войти с новым паролем."
    }

