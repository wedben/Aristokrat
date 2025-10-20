from sqlalchemy import Column, Integer, String, Text, Boolean, Enum
from app.database.session import Base
import enum

class ItemCategory(str, enum.Enum):
    bar = "bar"
    kitchen = "kitchen"
    wine = "wine"

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    image_path = Column(String, nullable=True)
    category = Column(Enum(ItemCategory), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Поля для винных карточек
    taste = Column(Text, nullable=True)  # Вкус
    aroma = Column(Text, nullable=True)  # Аромат
    color = Column(Text, nullable=True)  # Цвет
    pairings = Column(Text, nullable=True)  # Сочетания
