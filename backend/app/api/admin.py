from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta

from app.core.security import get_db, require_role
from app.models.user import User, UserRole
from app.models.menu import MenuItem
from app.models.tests import Test, TestAttempt
from app.models.activity import CardView, TestProgress, UserActivity
from app.schemas.admin import UserActivityRead, TestResultRead, UserStatsRead, CardViewRead

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(UserRole.admin))])

@router.get("/users", response_model=List[UserStatsRead])
def get_users_stats(db: Session = Depends(get_db)):
    """Получить статистику всех пользователей"""
    users = db.query(User).filter(User.role == UserRole.waiter).all()
    stats = []
    
    for user in users:
        # Подсчет просмотров карточек
        card_views = db.query(func.count(CardView.id)).filter(CardView.user_id == user.id).scalar() or 0
        
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
            total_card_views=card_views,
            total_tests_completed=completed_tests,
            total_tests_passed=passed_tests,
            last_activity=last_activity
        ))
    
    return stats

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
    """Получить просмотры карточек пользователем"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    views = db.query(CardView).filter(
        CardView.user_id == user_id
    ).order_by(desc(CardView.viewed_at)).limit(50).all()
    
    return views

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Удалить аккаунт пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    # Удаляем связанные данные
    db.query(CardView).filter(CardView.user_id == user_id).delete()
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
    
    user.is_active = not user.is_active
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
