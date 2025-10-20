from pydantic import BaseModel
from enum import Enum
from typing import Optional

class ItemCategory(str, Enum):
    bar = "bar"
    kitchen = "kitchen"
    wine = "wine"

class MenuItemBase(BaseModel):
    name: str
    description: str
    category: ItemCategory
    image_path: Optional[str] = None
    is_active: bool = True
    
    # Поля для винных карточек
    taste: Optional[str] = None
    aroma: Optional[str] = None
    color: Optional[str] = None
    pairings: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ItemCategory] = None
    image_path: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Поля для винных карточек
    taste: Optional[str] = None
    aroma: Optional[str] = None
    color: Optional[str] = None
    pairings: Optional[str] = None

class MenuItemRead(MenuItemBase):
    id: int

    class Config:
        from_attributes = True
