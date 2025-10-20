from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import Base, engine
from app.api.auth import router as auth_router
from app.api.menu import router as menu_router
from app.api.users import router as users_router
from app.api.admin import router as admin_router
try:
    from app.api.tests import router as tests_router
except Exception:
    tests_router = None

app = FastAPI(title="Aristokrat API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Импортируем модели активности для создания таблиц
    from app.models.activity import CardView, TestProgress, UserActivity, CardProgress
    # Сиды: админ и примерные карточки
    try:
        from sqlalchemy.orm import Session
        from app.database.session import SessionLocal
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        from app.models.menu import MenuItem, ItemCategory

        db: Session = SessionLocal()
        # Админ admin (новые данные)
        admin = db.query(User).filter(User.email.in_(["wedben", "wedben@example.com", "admin", "admin@aristokrat.com"])) .first()
        if not admin:
            admin_user = User(
                email="admin@aristokrat.com",
                full_name="Administrator",
                hashed_password=get_password_hash("Wersaderba12x.---."),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
        else:
            # Обновляем данные администратора
            admin.email = "admin@aristokrat.com"
            admin.hashed_password = get_password_hash("Wersaderba12x.---.")
            admin.is_active = True
            db.commit()

        # Пример карточек
        if db.query(MenuItem).count() == 0:
            samples = [
                # Барные карточки
                MenuItem(name="Negroni", description="Джин, Кампари, красный вермут", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Old Fashioned", description="Бурбон, биттер, сахар", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Мохито", description="Белый ром, лайм, мята, содовая", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Маргарита", description="Текила, лайм, трипл сек, соль", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Космополитен", description="Водка, клюквенный сок, лайм, трипл сек", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Пина Колада", description="Белый ром, кокосовое молоко, ананасовый сок", category=ItemCategory.bar, image_path=None),
                MenuItem(name="Манхэттен", description="Виски, красный вермут, биттер", category=ItemCategory.bar, image_path=None),
                
                # Кухонные карточки
                MenuItem(name="Цезарь", description="Классический салат с курицей", category=ItemCategory.kitchen, image_path=None),
                MenuItem(name="Стейк Рибай", description="Говяжий стейк средней прожарки с картофелем", category=ItemCategory.kitchen, image_path=None),
                MenuItem(name="Паста Карбонара", description="Спагетти с беконом, яйцом и пармезаном", category=ItemCategory.kitchen, image_path=None),
                MenuItem(name="Лосось на гриле", description="Филе лосося с овощами и лимонным соусом", category=ItemCategory.kitchen, image_path=None),
                MenuItem(name="Бургер Классик", description="Говяжья котлета, салат, помидор, сыр, соус", category=ItemCategory.kitchen, image_path=None),
                
                # Винные карточки
                MenuItem(
                    name="Кьянти Классико", 
                    description="Классическое итальянское вино из региона Тоскана", 
                    category=ItemCategory.wine, 
                    image_path=None,
                    taste="Покоряет округлым, полным, превосходно сбалансированным вкусом с фруктово-бальзамическим профилем, тонкими орехово-древесными штрихами, бархатистыми танинами и стойким послевкусием.",
                    aroma="Демонстрирует богатый, насыщенный аромат, сотканный из нот ежевики, вишни, смородины, черники, подлеска, дуба, орехов и ванили.",
                    color="Обладает темно-рубиновым цветом с чернильными штрихами.",
                    pairings="Отлично сочетается с жареным и приготовленным на гриле мясом, дичью, птицей и зрелыми сырами. Перед подачей рекомендуется аэрация."
                ),
                MenuItem(
                    name="Пино Нуар Бургундия", 
                    description="Элегантное французское вино из региона Бургундия", 
                    category=ItemCategory.wine, 
                    image_path=None,
                    taste="Характеризуется изысканным, элегантным вкусом с нотами красных ягод, вишни, земляники и легкими минеральными оттенками.",
                    aroma="Обладает тонким, сложным ароматом с нотами красных фруктов, розы, фиалки и легкими пряными нотками.",
                    color="Имеет светло-рубиновый цвет с гранатовыми отблесками.",
                    pairings="Идеально подходит к блюдам из птицы, рыбы, мягких сыров и легких закусок. Подается при температуре 14-16°C."
                ),
                MenuItem(
                    name="Шардоне Шабли", 
                    description="Минеральное белое вино из французского региона Шабли", 
                    category=ItemCategory.wine, 
                    image_path=None,
                    taste="Отличается чистым, минеральным вкусом с нотами цитрусовых, зеленого яблока и легкими меловыми оттенками.",
                    aroma="Обладает свежим, чистым ароматом с нотами лимона, лайма, зеленого яблока и минеральными нотками.",
                    color="Имеет бледно-золотистый цвет с зеленоватыми отблесками.",
                    pairings="Прекрасно сочетается с морепродуктами, рыбой, устрицами и легкими салатами. Подается охлажденным до 8-10°C."
                ),
            ]
            db.add_all(samples)
            db.commit()
            print("✅ Initial menu items seeded successfully")

        # Создаем тестовые тесты
        existing_tests = db.query(Test).count()
        if existing_tests == 0:
            from app.models.tests import Test, Question, Answer
            
            test_samples = [
                Test(
                    title="Тест по барной карте",
                    description="Проверьте свои знания о коктейлях и напитках",
                    questions=[
                        Question(
                            text="Какой алкоголь используется в коктейле Негрони?",
                            answers=[
                                Answer(text="Джин", is_correct=True),
                                Answer(text="Водка", is_correct=False),
                                Answer(text="Ром", is_correct=False),
                                Answer(text="Текила", is_correct=False)
                            ]
                        ),
                        Question(
                            text="Что входит в состав классического Мохито?",
                            answers=[
                                Answer(text="Белый ром, лайм, мята, содовая", is_correct=True),
                                Answer(text="Джин, тоник, лайм", is_correct=False),
                                Answer(text="Водка, клюквенный сок", is_correct=False),
                                Answer(text="Текила, лайм, соль", is_correct=False)
                            ]
                        )
                    ]
                ),
                Test(
                    title="Тест по кухонной карте",
                    description="Проверьте знания о блюдах и их приготовлении",
                    questions=[
                        Question(
                            text="Какой соус традиционно используется в салате Цезарь?",
                            answers=[
                                Answer(text="Соус Цезарь с анчоусами", is_correct=True),
                                Answer(text="Майонез", is_correct=False),
                                Answer(text="Оливковое масло", is_correct=False),
                                Answer(text="Бальзамический уксус", is_correct=False)
                            ]
                        ),
                        Question(
                            text="Какая прожарка стейка считается средней?",
                            answers=[
                                Answer(text="Medium (с розовой серединой)", is_correct=True),
                                Answer(text="Rare (с красной серединой)", is_correct=False),
                                Answer(text="Well Done (полностью прожаренный)", is_correct=False),
                                Answer(text="Blue (почти сырой)", is_correct=False)
                            ]
                        )
                    ]
                )
            ]
            
            db.add_all(test_samples)
            db.commit()
            print("✅ Initial test samples seeded successfully")
        db.close()
    except Exception:
        # Не валим приложение, если сид не удался
        pass

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(menu_router)
if tests_router:
    app.include_router(tests_router)
app.include_router(users_router)
app.include_router(admin_router)

# CORS для dev-фронтенда и внешнего доступа
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем доступ с любых доменов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
