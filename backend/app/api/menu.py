from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from datetime import datetime
import os

from app.core.security import get_db, require_role, get_current_user
from app.models.user import UserRole, User
from app.models.menu import MenuItem
from app.models.activity import CardView, UserActivity, CardProgress
from app.schemas.menu import MenuItemCreate, MenuItemRead, MenuItemUpdate

router = APIRouter(prefix="/menu", tags=["menu"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploaded_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[MenuItemRead])
def list_items(db: Session = Depends(get_db), category: Optional[str] = None, active_only: bool = True):
    q = db.query(MenuItem)
    if category:
        q = q.filter(MenuItem.category == category)
    if active_only:
        q = q.filter(MenuItem.is_active == True)
    return q.order_by(MenuItem.name.asc()).all()


@router.post("/", response_model=MenuItemRead, dependencies=[Depends(require_role(UserRole.admin))])
def create_item(item: MenuItemCreate, db: Session = Depends(get_db)):
    entity = MenuItem(**item.model_dump())
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


@router.get("/{item_id}", response_model=MenuItemRead)
def get_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entity = db.query(MenuItem).get(item_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Отслеживаем просмотр карточки
    if current_user:
        card_view = CardView(user_id=current_user.id, card_id=item_id)
        db.add(card_view)
        
        # Обновляем или создаем запись прогресса
        progress = db.query(CardProgress).filter(
            CardProgress.user_id == current_user.id,
            CardProgress.card_id == item_id
        ).first()
        
        if not progress:
            progress = CardProgress(
                user_id=current_user.id,
                card_id=item_id,
                viewed_count=1
            )
            db.add(progress)
        else:
            progress.viewed_count += 1
            progress.updated_at = datetime.now()
        
        activity = UserActivity(
            user_id=current_user.id,
            activity_type="card_view",
            target_id=item_id,
            details=f"Просмотр карточки: {entity.name}"
        )
        db.add(activity)
        db.commit()
    
    return entity


@router.put("/{item_id}", response_model=MenuItemRead, dependencies=[Depends(require_role(UserRole.admin))])
def update_item(item_id: int, item: MenuItemUpdate, db: Session = Depends(get_db)):
    entity = db.query(MenuItem).get(item_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Item not found")
    data = item.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(entity, k, v)
    db.commit()
    db.refresh(entity)
    return entity


@router.delete("/{item_id}", dependencies=[Depends(require_role(UserRole.admin))])
def delete_item(item_id: int, db: Session = Depends(get_db)):
    entity = db.query(MenuItem).get(item_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(entity)
    db.commit()
    return {"status": "deleted"}


@router.post("/{item_id}/upload-image", response_model=MenuItemRead, dependencies=[Depends(require_role(UserRole.admin))])
def upload_image(item_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    entity = db.query(MenuItem).get(item_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Item not found")
    filename = f"item_{item_id}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file.file.read())
    entity.image_path = path
    db.commit()
    db.refresh(entity)
    return entity


@router.post("/{item_id}/mark-learned")
def mark_card_learned(
    item_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Отметить карточку как изученную"""
    try:
        # Проверяем, что карточка существует
        card = db.query(MenuItem).get(item_id)
        if not card:
            raise HTTPException(status_code=404, detail="Карточка не найдена")
        
        # Ищем или создаем запись прогресса
        progress = db.query(CardProgress).filter(
            CardProgress.user_id == current_user.id,
            CardProgress.card_id == item_id
        ).first()
        
        if not progress:
            progress = CardProgress(
                user_id=current_user.id,
                card_id=item_id,
                viewed_count=1,
                is_learned=True,
                learned_at=datetime.now()
            )
            db.add(progress)
        else:
            progress.is_learned = True
            progress.learned_at = datetime.now()
            progress.updated_at = datetime.now()
        
        # Записываем активность
        activity = UserActivity(
            user_id=current_user.id,
            activity_type='card_learned',
            target_id=item_id,
            details=f'Карточка "{card.name}" отмечена как изученная'
        )
        db.add(activity)
        
        db.commit()
        
        return {"status": "success", "message": "Карточка отмечена как изученная"}
    except Exception as e:
        db.rollback()
        print(f"Error in mark_card_learned: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера: {str(e)}")


@router.get("/{item_id}/progress")
def get_card_progress(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить прогресс по карточке для текущего пользователя"""
    progress = db.query(CardProgress).filter(
        CardProgress.user_id == current_user.id,
        CardProgress.card_id == item_id
    ).first()
    
    if not progress:
        return {
            "viewed_count": 0,
            "is_learned": False,
            "learned_at": None
        }
    
    return {
        "viewed_count": progress.viewed_count,
        "is_learned": progress.is_learned,
        "learned_at": progress.learned_at
    }


@router.get("/progress/me")
def get_my_card_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получить прогресс по всем карточкам для текущего пользователя"""
    progress = db.query(CardProgress).filter(
        CardProgress.user_id == current_user.id
    ).all()
    return progress
