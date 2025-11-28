from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.cards import CardCategory

class ServicePoint(BaseModel):
    icon: str
    title: str
    description: str

class ServiceBenefit(BaseModel):
    icon: str
    title: str
    description: str

class CardBase(BaseModel):
    name: str
    category: CardCategory
    is_active: bool = True
    
    # Предварительный вид
    preview_title: str
    preview_description: Optional[str] = None
    preview_image: Optional[str] = None
    preview_icon: Optional[str] = None
    
    # Углубленный вид
    detailed_title: Optional[str] = None
    detailed_description: Optional[str] = None
    detailed_image: Optional[str] = None
    detailed_images: Optional[List[str]] = None  # Множественные изображения
    
    # Дополнительные поля
    service_points: Optional[List[ServicePoint]] = None
    service_benefits: Optional[List[ServiceBenefit]] = None
    price: Optional[str] = None
    ingredients: Optional[str] = None
    taste: Optional[str] = None
    aroma: Optional[str] = None
    color: Optional[str] = None
    pairings: Optional[str] = None
    alcohol_content: Optional[str] = None
    volume: Optional[str] = None
    sort_order: int = 0

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[CardCategory] = None
    is_active: Optional[bool] = None
    
    # Предварительный вид
    preview_title: Optional[str] = None
    preview_description: Optional[str] = None
    preview_image: Optional[str] = None
    preview_icon: Optional[str] = None
    
    # Углубленный вид
    detailed_title: Optional[str] = None
    detailed_description: Optional[str] = None
    detailed_image: Optional[str] = None
    detailed_images: Optional[List[str]] = None  # Множественные изображения
    
    # Дополнительные поля
    service_points: Optional[List[ServicePoint]] = None
    service_benefits: Optional[List[ServiceBenefit]] = None
    price: Optional[str] = None
    ingredients: Optional[str] = None
    taste: Optional[str] = None
    aroma: Optional[str] = None
    color: Optional[str] = None
    pairings: Optional[str] = None
    alcohol_content: Optional[str] = None
    volume: Optional[str] = None
    sort_order: Optional[int] = None

class Card(CardBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
