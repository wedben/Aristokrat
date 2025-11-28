from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from app.database.session import get_db
from app.models.cards import Card, CardCategory
from app.schemas.cards import CardCreate, CardUpdate, Card as CardSchema, ServicePoint, ServiceBenefit
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/cards", response_model=List[CardSchema])
def get_cards(
    category: Optional[CardCategory] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить все карточки с возможностью фильтрации по категории"""
    query = db.query(Card).filter(Card.is_active == True)
    
    if category:
        query = query.filter(Card.category == category)
    
    cards = query.order_by(Card.sort_order, Card.name).offset(skip).limit(limit).all()
    
    # Преобразуем JSON строки обратно в объекты для ответа
    for card in cards:
        if card.service_points:
            try:
                card.service_points = [ServicePoint(**point) for point in json.loads(card.service_points)]
            except:
                card.service_points = []
        if card.service_benefits:
            try:
                card.service_benefits = [ServiceBenefit(**benefit) for benefit in json.loads(card.service_benefits)]
            except:
                card.service_benefits = []
        if card.detailed_images:
            try:
                card.detailed_images = json.loads(card.detailed_images)
            except:
                card.detailed_images = []
    
    return cards

@router.get("/cards/{card_id}", response_model=CardSchema)
def get_card(card_id: int, db: Session = Depends(get_db)):
    """Получить конкретную карточку"""
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    return card

@router.post("/cards", response_model=CardSchema)
def create_card(
    card: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую карточку (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Преобразуем списки в JSON строки для хранения в БД
    db_card = Card(
        name=card.name,
        category=card.category,
        is_active=card.is_active,
        preview_title=card.preview_title,
        preview_description=card.preview_description,
        preview_image=card.preview_image,
        preview_icon=card.preview_icon,
        detailed_title=card.detailed_title,
        detailed_description=card.detailed_description,
        detailed_image=card.detailed_image,
        service_points=json.dumps([point.dict() for point in card.service_points]) if card.service_points else None,
        service_benefits=json.dumps([benefit.dict() for benefit in card.service_benefits]) if card.service_benefits else None,
        price=card.price,
        ingredients=card.ingredients,
        taste=card.taste,
        aroma=card.aroma,
        color=card.color,
        pairings=card.pairings,
        alcohol_content=card.alcohol_content,
        volume=card.volume,
        sort_order=card.sort_order
    )
    
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    
    # Преобразуем JSON строки обратно в объекты для ответа
    if db_card.service_points:
        db_card.service_points = [ServicePoint(**point) for point in json.loads(db_card.service_points)]
    if db_card.service_benefits:
        db_card.service_benefits = [ServiceBenefit(**benefit) for benefit in json.loads(db_card.service_benefits)]
    
    return db_card

@router.put("/cards/{card_id}", response_model=CardSchema)
def update_card(
    card_id: int,
    card_update: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить карточку (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    
    # Обновляем только переданные поля
    update_data = card_update.dict(exclude_unset=True)
    
    # Преобразуем списки в JSON строки
    if 'service_points' in update_data and update_data['service_points'] is not None:
        update_data['service_points'] = json.dumps([point.dict() for point in update_data['service_points']])
    if 'service_benefits' in update_data and update_data['service_benefits'] is not None:
        update_data['service_benefits'] = json.dumps([benefit.dict() for benefit in update_data['service_benefits']])
    
    for field, value in update_data.items():
        setattr(db_card, field, value)
    
    db.commit()
    db.refresh(db_card)
    
    # Преобразуем JSON строки обратно в объекты для ответа
    if db_card.service_points:
        db_card.service_points = [ServicePoint(**point) for point in json.loads(db_card.service_points)]
    if db_card.service_benefits:
        db_card.service_benefits = [ServiceBenefit(**benefit) for benefit in json.loads(db_card.service_benefits)]
    
    return db_card

@router.delete("/cards/{card_id}")
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить карточку (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    
    db.delete(db_card)
    db.commit()
    
    return {"message": "Карточка удалена"}

@router.post("/cards/{card_id}/upload-image")
def upload_card_image(
    card_id: int,
    file: UploadFile = File(...),
    image_type: str = "preview",  # "preview" или "detailed"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Загрузить изображение для карточки (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    
    # Создаем папку для изображений если её нет
    upload_dir = "uploads/cards"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Генерируем имя файла
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"card_{card_id}_{image_type}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    # Обновляем путь к изображению в БД
    if image_type == "preview":
        db_card.preview_image = f"/uploads/cards/{filename}"
    else:
        db_card.detailed_image = f"/uploads/cards/{filename}"
    
    db.commit()
    
    return {"message": "Изображение загружено", "image_path": f"/uploads/cards/{filename}"}

@router.post("/cards/{card_id}/mark-learned")
def mark_card_learned(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отметить новую карточку как изученную"""
    from app.models.activity import NewCardProgress, UserActivity
    from datetime import datetime
    
    # Проверяем, что карточка существует
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    
    # Ищем или создаем запись прогресса
    progress = db.query(NewCardProgress).filter(
        NewCardProgress.user_id == current_user.id,
        NewCardProgress.card_id == card_id
    ).first()
    
    if not progress:
        progress = NewCardProgress(
            user_id=current_user.id,
            card_id=card_id,
            viewed_count=1,
            is_learned=True,
            learned_at=datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.is_learned = True
        progress.learned_at = datetime.utcnow()
        progress.updated_at = datetime.utcnow()
    
    # Записываем активность
    activity = UserActivity(
        user_id=current_user.id,
        activity_type='new_card_learned',
        target_id=card_id,
        details=f'Карточка "{db_card.name}" отмечена как изученная'
    )
    db.add(activity)
    
    db.commit()
    
    return {"status": "success", "message": "Карточка отмечена как изученная", "is_learned": True}

@router.get("/cards/{card_id}/progress")
def get_card_progress(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить прогресс по новой карточке для текущего пользователя"""
    from app.models.activity import NewCardProgress
    
    progress = db.query(NewCardProgress).filter(
        NewCardProgress.user_id == current_user.id,
        NewCardProgress.card_id == card_id
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
        "learned_at": progress.learned_at.isoformat() if progress.learned_at else None
    }

@router.get("/cards/progress/me")
def get_my_cards_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить прогресс по всем новым карточкам для текущего пользователя"""
    from app.models.activity import NewCardProgress
    
    progress = db.query(NewCardProgress).filter(
        NewCardProgress.user_id == current_user.id
    ).all()
    
    return {str(p.card_id): {
        "viewed_count": p.viewed_count,
        "is_learned": p.is_learned,
        "learned_at": p.learned_at.isoformat() if p.learned_at else None
    } for p in progress}
