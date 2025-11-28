from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.database.session import Base
import enum

class CardCategory(str, enum.Enum):
    service = "service"
    service_basics = "service_basics"
    service_aristokrat = "service_aristokrat"
    bar = "bar"
    kitchen = "kitchen"
    wine = "wine"

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(Enum(CardCategory), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Предварительный вид (карточка на странице)
    preview_title = Column(String, nullable=False)
    preview_description = Column(Text, nullable=True)
    preview_image = Column(String, nullable=True)
    preview_icon = Column(String, nullable=True)  # Иконка для карточки
    
    # Углубленный вид (детальная информация)
    detailed_title = Column(String, nullable=True)
    detailed_description = Column(Text, nullable=True)
    detailed_image = Column(String, nullable=True)
    detailed_images = Column(Text, nullable=True)  # JSON массив путей к изображениям
    
    # Дополнительные поля для разных категорий
    # Для сервиса
    service_points = Column(Text, nullable=True)  # JSON строка с пунктами
    service_benefits = Column(Text, nullable=True)  # JSON строка с преимуществами
    
    # Для меню/бара/вина
    price = Column(String, nullable=True)
    ingredients = Column(Text, nullable=True)
    taste = Column(Text, nullable=True)
    aroma = Column(Text, nullable=True)
    color = Column(Text, nullable=True)
    pairings = Column(Text, nullable=True)
    alcohol_content = Column(String, nullable=True)
    volume = Column(String, nullable=True)
    
    # Порядок отображения
    sort_order = Column(Integer, default=0)
