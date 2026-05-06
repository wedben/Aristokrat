from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.core.security import get_db, require_role
from app.models.user import User, UserRole
from app.models.tests import Test, TestAttempt
from app.models.activity import TestProgress, UserActivity
from app.schemas.admin import UserActivityRead, TestResultRead, UserStatsRead, CardViewRead

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(UserRole.admin))])

@router.get("/users", response_model=List[UserStatsRead])
def get_users_stats(db: Session = Depends(get_db)):
    """Получить статистику всех пользователей"""
    users = db.query(User).filter(User.role == UserRole.waiter).all()
    stats = []
    
    for user in users:
        card_views = 0
        
        # Подсчет завершенных тестов
        completed_tests = db.query(func.count(TestProgress.id)).filter(
            TestProgress.user_id == user.id,
            TestProgress.completed_at.isnot(None)
        ).scalar() or 0
        
        # Подсчет пройденных тестов
        passed_tests = db.query(func.count(TestProgress.id)).filter(
            TestProgress.user_id == user.id,
            TestProgress.is_passed == True
        ).scalar() or 0
        
        # Последняя активность
        last_activity = db.query(func.max(UserActivity.created_at)).filter(
            UserActivity.user_id == user.id
        ).scalar()
        
        stats.append(UserStatsRead(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            is_active=user.is_active,
            is_pending_verification=getattr(user, 'is_pending_verification', False),
            total_card_views=card_views,
            total_tests_completed=completed_tests,
            total_tests_passed=passed_tests,
            last_activity=last_activity,
            phone=getattr(user, 'phone', None),
            address=getattr(user, 'address', None)
        ))
    
    return stats

@router.get("/users/pending-verification")
def get_pending_verification_count(db: Session = Depends(get_db)):
    """Получить количество пользователей, ожидающих верификацию после регистрации"""
    count = db.query(User).filter(
        User.role == UserRole.waiter,
        User.is_pending_verification == True
    ).count()
    return {"count": count}

@router.get("/password-reset/pending-count")
def get_pending_password_reset_count(db: Session = Depends(get_db)):
    """Получить количество запросов на восстановление пароля, ожидающих подтверждения"""
    from app.models.password_reset import PasswordResetRequest
    count = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.is_approved == False,
        PasswordResetRequest.is_completed == False
    ).count()
    return {"count": count}

@router.get("/users/statistics")
def get_users_statistics(db: Session = Depends(get_db)):
    """Получить общую статистику по всем пользователям"""
    from app.models.activity import NewCardProgress
    
    # Общее количество пользователей
    total_users = db.query(User).filter(User.role == UserRole.waiter).count()
    
    # Активные пользователи
    active_users = db.query(User).filter(
        User.role == UserRole.waiter,
        User.is_active == True
    ).count()
    
    # Пользователи, ожидающие верификации после регистрации
    pending_users = db.query(User).filter(
        User.role == UserRole.waiter,
        User.is_pending_verification == True
    ).count()
    
    # Заблокированные пользователи (неактивные, но не ожидающие верификации)
    blocked_users = db.query(User).filter(
        User.role == UserRole.waiter,
        User.is_active == False,
        User.is_pending_verification == False
    ).count()
    
    # Общая статистика по тестам
    total_tests_completed = db.query(func.count(TestProgress.id)).filter(
        TestProgress.completed_at.isnot(None)
    ).scalar() or 0
    
    total_tests_passed = db.query(func.count(TestProgress.id)).filter(
        TestProgress.is_passed == True
    ).scalar() or 0
    
    # Общая статистика по изученным карточкам
    total_learned_cards = db.query(func.count(NewCardProgress.id)).filter(
        NewCardProgress.is_learned == True
    ).scalar() or 0
    
    # Средняя статистика на пользователя
    avg_tests_per_user = round(total_tests_completed / total_users, 2) if total_users > 0 else 0
    avg_learned_cards_per_user = round(total_learned_cards / total_users, 2) if total_users > 0 else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "pending_users": pending_users,
        "blocked_users": blocked_users,
        "total_tests_completed": total_tests_completed,
        "total_tests_passed": total_tests_passed,
        "total_learned_cards": total_learned_cards,
        "avg_tests_per_user": avg_tests_per_user,
        "avg_learned_cards_per_user": avg_learned_cards_per_user
    }

@router.get("/users/{user_id}/activity", response_model=List[UserActivityRead])
def get_user_activity(user_id: int, db: Session = Depends(get_db)):
    """Получить активность конкретного пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    activities = db.query(UserActivity).filter(
        UserActivity.user_id == user_id
    ).order_by(desc(UserActivity.created_at)).limit(100).all()
    
    return activities

@router.get("/users/{user_id}/test-results", response_model=List[TestResultRead])
def get_user_test_results(user_id: int, db: Session = Depends(get_db)):
    """Получить результаты тестирования пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    results = db.query(TestProgress).filter(
        TestProgress.user_id == user_id
    ).order_by(desc(TestProgress.started_at)).all()
    
    return results

@router.get("/users/{user_id}/card-views", response_model=List[CardViewRead])
def get_user_card_views(user_id: int, db: Session = Depends(get_db)):
    """Получить просмотры карточек пользователем (устаревший endpoint - возвращает пустой список)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return []

@router.get("/users/{user_id}/learned-cards")
def get_user_learned_cards(user_id: int, db: Session = Depends(get_db)):
    """Получить изученные карточки пользователя"""
    from app.models.activity import NewCardProgress
    from app.models.cards import Card
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Новые изученные карточки
    new_progress = db.query(NewCardProgress).filter(
        NewCardProgress.user_id == user_id,
        NewCardProgress.is_learned == True
    ).all()
    
    new_card_ids = [p.card_id for p in new_progress]
    new_cards = db.query(Card).filter(Card.id.in_(new_card_ids)).all() if new_card_ids else []
    
    return {
        "new_cards": [{"id": c.id, "name": c.name, "preview_title": c.preview_title, "preview_description": c.preview_description, "detailed_title": c.detailed_title, "detailed_description": c.detailed_description} for c in new_cards]
    }

@router.get("/users/{user_id}/new-card-progress")
def get_user_new_card_progress(user_id: int, db: Session = Depends(get_db)):
    """Получить прогресс по новым карточкам"""
    from app.models.activity import NewCardProgress
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    progress = db.query(NewCardProgress).filter(
        NewCardProgress.user_id == user_id
    ).all()
    
    return [{
        "id": p.id,
        "user_id": p.user_id,
        "card_id": p.card_id,
        "is_learned": p.is_learned,
        "learned_at": p.learned_at
    } for p in progress]

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Удалить аккаунт пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    # Удаляем связанные данные
    db.query(TestProgress).filter(TestProgress.user_id == user_id).delete()
    db.query(UserActivity).filter(UserActivity.user_id == user_id).delete()
    db.query(TestAttempt).filter(TestAttempt.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db)):
    """Заблокировать/разблокировать пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot modify admin user")
    
    was_active = user.is_active
    user.is_active = not user.is_active
    
    # Если пользователь активируется впервые (был pending_verification), сбрасываем флаг
    if user.is_active and user.is_pending_verification:
        user.is_pending_verification = False
    # Если пользователь блокируется админом (был активен), не меняем is_pending_verification
    # Это позволяет различать новых пользователей от заблокированных
    
    db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

@router.get("/test-results", response_model=List[TestResultRead])
def get_all_test_results(
    user_id: Optional[int] = None,
    test_id: Optional[int] = None,
    passed_only: bool = False,
    db: Session = Depends(get_db)
):
    """Получить все результаты тестирования с фильтрами"""
    query = db.query(TestProgress)
    
    if user_id:
        query = query.filter(TestProgress.user_id == user_id)
    if test_id:
        query = query.filter(TestProgress.test_id == test_id)
    if passed_only:
        query = query.filter(TestProgress.is_passed == True)
    
    results = query.order_by(desc(TestProgress.started_at)).limit(200).all()
    return results
