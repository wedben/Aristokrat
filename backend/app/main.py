from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database.session import Base, engine
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.admin import router as admin_router
from app.api.password_reset import router as password_reset_router
from app.routers.cards import router as cards_router
try:
    from app.api.tests import router as tests_router
except Exception:
    tests_router = None

app = FastAPI(title="Aristokrat API")

# CORS для dev-фронтенда и внешнего доступа (должен быть ДО роутеров)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем доступ с любых доменов (включая Cloudflare туннели)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600  # Кэширование preflight запросов на 1 час
)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Сиды: админ и примерные карточки
    try:
        from sqlalchemy.orm import Session
        from app.database.session import SessionLocal
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        from app.models.activity import TestProgress, UserActivity
        from app.models.cards import Card, CardCategory
        from app.models.tests import Test, Question, Answer
        from app.models.password_reset import PasswordResetRequest  # Импортируем для создания таблицы

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
        
        # Создаем тесты
        if db.query(User).filter(User.email == "admin@aristokrat.com").first() and db.query(Card).count() > 0:
            # Проверяем, есть ли уже тесты
            if db.query(Test).count() == 0:
                # Создаем тест с базой вопросов
                test = Test(
                    title="Тест по карточкам ресторана Аристократ",
                    description="Проверьте свои знания о меню, сервисе и винной карте ресторана",
                    max_errors_allowed=2,
                    questions_per_test=8,
                    is_active=True
                )
                db.add(test)
                db.flush()
                
                # Создаем вопросы
                questions_data = [
                    {
                        "text": "Какие ингредиенты входят в состав коктейля Негрони?",
                        "answers": [
                            {"text": "Джин, Кампари, красный вермут", "is_correct": True},
                            {"text": "Текила, лайм, трипл сек", "is_correct": False},
                            {"text": "Белый ром, лайм, мята", "is_correct": False},
                            {"text": "Водка, клюквенный сок", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Сколько стоит стейк Рибай?",
                        "answers": [
                            {"text": "1200 ₽", "is_correct": True},
                            {"text": "1000 ₽", "is_correct": False},
                            {"text": "1500 ₽", "is_correct": False},
                            {"text": "800 ₽", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какая крепость у коктейля Маргарита?",
                        "answers": [
                            {"text": "18%", "is_correct": True},
                            {"text": "24%", "is_correct": False},
                            {"text": "12%", "is_correct": False},
                            {"text": "15%", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Из какого региона происходит вино Кьянти Классико?",
                        "answers": [
                            {"text": "Тоскана, Италия", "is_correct": True},
                            {"text": "Бургундия, Франция", "is_correct": False},
                            {"text": "Риоха, Испания", "is_correct": False},
                            {"text": "Мозель, Германия", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в пасту Карбонара?",
                        "answers": [
                            {"text": "Спагетти, бекон, яйца, пармезан, черный перец", "is_correct": True},
                            {"text": "Спагетти, томаты, базилик, моцарелла", "is_correct": False},
                            {"text": "Спагетти, креветки, чеснок, петрушка", "is_correct": False},
                            {"text": "Спагетти, грибы, сливки, лук", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Сколько стоит вино Шардоне Шабли?",
                        "answers": [
                            {"text": "1800 ₽", "is_correct": True},
                            {"text": "2500 ₽", "is_correct": False},
                            {"text": "1200 ₽", "is_correct": False},
                            {"text": "2000 ₽", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой объем у коктейля Негрони?",
                        "answers": [
                            {"text": "120 мл", "is_correct": True},
                            {"text": "150 мл", "is_correct": False},
                            {"text": "200 мл", "is_correct": False},
                            {"text": "100 мл", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какая крепость у вина Кьянти Классико?",
                        "answers": [
                            {"text": "13.5%", "is_correct": True},
                            {"text": "12.5%", "is_correct": False},
                            {"text": "14%", "is_correct": False},
                            {"text": "11%", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Сколько стоит паста Карбонара?",
                        "answers": [
                            {"text": "650 ₽", "is_correct": True},
                            {"text": "550 ₽", "is_correct": False},
                            {"text": "750 ₽", "is_correct": False},
                            {"text": "600 ₽", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в стейк Рибай?",
                        "answers": [
                            {"text": "Говядина Рибай, соль, перец, розмарин, чеснок", "is_correct": True},
                            {"text": "Говядина Рибай, только соль и перец", "is_correct": False},
                            {"text": "Говядина Рибай, тимьян, орегано", "is_correct": False},
                            {"text": "Говядина Рибай, соевый соус, имбирь", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой объем у коктейля Маргарита?",
                        "answers": [
                            {"text": "150 мл", "is_correct": True},
                            {"text": "120 мл", "is_correct": False},
                            {"text": "200 мл", "is_correct": False},
                            {"text": "100 мл", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Из какого региона происходит вино Шардоне Шабли?",
                        "answers": [
                            {"text": "Бургундия, Франция", "is_correct": True},
                            {"text": "Тоскана, Италия", "is_correct": False},
                            {"text": "Риоха, Испания", "is_correct": False},
                            {"text": "Мозель, Германия", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какая крепость у вина Шардоне Шабли?",
                        "answers": [
                            {"text": "12.5%", "is_correct": True},
                            {"text": "13.5%", "is_correct": False},
                            {"text": "11%", "is_correct": False},
                            {"text": "14%", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в состав коктейля Маргарита?",
                        "answers": [
                            {"text": "Текила, лайм, трипл сек, соль", "is_correct": True},
                            {"text": "Джин, Кампари, красный вермут", "is_correct": False},
                            {"text": "Белый ром, лайм, мята", "is_correct": False},
                            {"text": "Водка, клюквенный сок", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Сколько стоит коктейль Негрони?",
                        "answers": [
                            {"text": "450 ₽", "is_correct": True},
                            {"text": "420 ₽", "is_correct": False},
                            {"text": "480 ₽", "is_correct": False},
                            {"text": "400 ₽", "is_correct": False}
                        ]
                    }
                ]
                
                for q_data in questions_data:
                    question = Question(test_id=test.id, text=q_data["text"])
                    db.add(question)
                    db.flush()
                    
                    for a_data in q_data["answers"]:
                        answer = Answer(question_id=question.id, text=a_data["text"], is_correct=a_data["is_correct"])
                        db.add(answer)
                
                db.commit()
                print("✅ Initial test with 15 questions seeded successfully")

        # Создаем карточки сервиса
        if db.query(Card).count() == 0:
            import json
            
            service_cards = [
                Card(
                    name="Приветствие гостей",
                    category=CardCategory.service,
                    preview_title="Приветствие гостей",
                    preview_description="Теплое и искреннее приветствие каждого гостя",
                    preview_icon="FaHandshake",
                    detailed_title="Стандарты приветствия гостей",
                    detailed_description="Профессиональное приветствие - это первое впечатление о нашем ресторане. Каждый гость должен почувствовать себя особенным с момента входа.",
                    service_points=json.dumps([
                        {"icon": "FaSmile", "title": "Улыбка и зрительный контакт", "description": "Теплая улыбка и прямой взгляд в глаза"},
                        {"icon": "FaClock", "title": "Приветствие в течение 30 секунд", "description": "Быстрое реагирование на появление гостя"},
                        {"icon": "FaUser", "title": "Представление себя по имени", "description": "Вежливое представление и готовность помочь"},
                        {"icon": "FaMapMarkerAlt", "title": "Предложение помощи с выбором места", "description": "Активное предложение помощи в размещении"}
                    ]),
                    service_benefits=json.dumps([
                        {"icon": "FaHeart", "title": "Создание позитивного настроения", "description": "Гость сразу чувствует заботу и внимание"},
                        {"icon": "FaStar", "title": "Повышение лояльности", "description": "Первое впечатление влияет на весь визит"},
                        {"icon": "FaUsers", "title": "Улучшение атмосферы", "description": "Дружелюбная атмосфера привлекает новых гостей"}
                    ]),
                    sort_order=1
                ),
                Card(
                    name="Подача меню",
                    category=CardCategory.service,
                    preview_title="Подача меню",
                    preview_description="Профессиональная подача и объяснение блюд",
                    preview_icon="FaUtensils",
                    detailed_title="Стандарты подачи меню",
                    detailed_description="Знание меню - основа профессионального обслуживания. Каждый официант должен быть экспертом в наших блюдах и напитках.",
                    service_points=json.dumps([
                        {"icon": "FaBook", "title": "Знание всех позиций меню", "description": "Полное знание состава и особенностей блюд"},
                        {"icon": "FaLightbulb", "title": "Рекомендации по сочетаниям", "description": "Предложение идеальных сочетаний блюд и напитков"},
                        {"icon": "FaUserCheck", "title": "Учет предпочтений гостя", "description": "Адаптация рекомендаций под вкусы гостя"},
                        {"icon": "FaExclamationTriangle", "title": "Информация об аллергенах", "description": "Обязательное предупреждение об аллергенах"}
                    ]),
                    service_benefits=json.dumps([
                        {"icon": "FaThumbsUp", "title": "Повышение продаж", "description": "Грамотные рекомендации увеличивают средний чек"},
                        {"icon": "FaShieldAlt", "title": "Безопасность гостей", "description": "Предотвращение аллергических реакций"},
                        {"icon": "FaCrown", "title": "Профессиональный имидж", "description": "Демонстрация экспертизы и заботы"}
                    ]),
                    sort_order=2
                ),
                Card(
                    name="Винная карта",
                    category=CardCategory.service,
                    preview_title="Винная карта",
                    preview_description="Экспертное знание вин и их подачи",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Стандарты работы с винной картой",
                    detailed_description="Вино - это искусство. Наши официанты должны быть настоящими сомелье, способными подобрать идеальное вино к любому блюду.",
                    service_points=json.dumps([
                        {"icon": "FaGlobe", "title": "Знание вин по регионам", "description": "Понимание особенностей вин из разных регионов"},
                        {"icon": "FaWineGlass", "title": "Правильная подача вина", "description": "Соблюдение температурных режимов и процедур подачи"},
                        {"icon": "FaUtensils", "title": "Рекомендации по сочетанию с блюдами", "description": "Идеальные сочетания вин и блюд"},
                        {"icon": "FaFlask", "title": "Декантирование при необходимости", "description": "Профессиональное декантирование старых вин"}
                    ]),
                    service_benefits=json.dumps([
                        {"icon": "FaGem", "title": "Премиальное обслуживание", "description": "Высокий уровень сервиса для ценителей"},
                        {"icon": "FaChartLine", "title": "Увеличение продаж", "description": "Рост среднего чека за счет винных продаж"},
                        {"icon": "FaAward", "title": "Репутация экспертов", "description": "Позиционирование как винного ресторана"}
                    ]),
                    sort_order=3
                )
            ]
            
            # Добавляем карточки для барной карты
            bar_cards = [
                Card(
                    name="Негрони",
                    category=CardCategory.bar,
                    preview_title="Негрони",
                    preview_description="Классический итальянский коктейль",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Негрони",
                    detailed_description="Один из самых популярных итальянских коктейлей, созданный в 1919 году в баре Caffè Casoni во Флоренции. Назван в честь графа Камилло Негрони, который попросил бармена заменить содовую в американском коктейле на джин.",
                    detailed_image=None,
                    ingredients="Джин (30 мл), Кампари (30 мл), Красный вермут (30 мл), Апельсиновая цедра для украшения",
                    price="450 ₽",
                    alcohol_content="18%",
                    volume="120 мл",
                    sort_order=1
                ),
                Card(
                    name="Мохито",
                    category=CardCategory.bar,
                    preview_title="Мохито",
                    preview_description="Освежающий кубинский коктейль",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Мохито",
                    detailed_description="Традиционный кубинский коктейль, который стал символом Гаваны. Создан в 16 веке и назван в честь африканского слова 'mojado' (мокрый). Идеально подходит для жаркого дня.",
                    detailed_image=None,
                    ingredients="Белый ром (50 мл), Лайм (1/2 шт), Свежая мята (8-10 листьев), Сахар (2 ч.л.), Содовая (100 мл), Лед",
                    price="380 ₽",
                    alcohol_content="12%",
                    volume="200 мл",
                    sort_order=2
                ),
                Card(
                    name="Маргарита",
                    category=CardCategory.bar,
                    preview_title="Маргарита",
                    preview_description="Классический мексиканский коктейль",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Маргарита",
                    detailed_description="Самый популярный текила-коктейль в мире. Существует множество версий происхождения, но самая романтичная связана с мексиканской красавицей Маргаритой, в честь которой и был назван коктейль.",
                    detailed_image=None,
                    ingredients="Текила (50 мл), Трипл сек (25 мл), Свежий сок лайма (25 мл), Соль для ободка, Лед",
                    price="420 ₽",
                    alcohol_content="18%",
                    volume="150 мл",
                    sort_order=3
                )
            ]

            # Добавляем карточки для кухни
            kitchen_cards = [
                Card(
                    name="Стейк Рибай",
                    category=CardCategory.kitchen,
                    preview_title="Стейк Рибай",
                    preview_description="Премиальная говядина средней прожарки",
                    preview_icon="FaUtensils",
                    detailed_title="Стейк Рибай",
                    detailed_description="Стейк из реберной части говядины - один из самых сочных и ароматных кусков мяса. Название происходит от английского 'rib eye' (реберный глаз). Идеальная прожарка medium rare раскрывает все вкусовые качества мяса.",
                    detailed_image=None,
                    ingredients="Говядина Рибай (300г), Соль морская, Перец черный свежемолотый, Розмарин свежий, Чеснок, Оливковое масло, Сливочное масло",
                    price="1200 ₽",
                    sort_order=1
                ),
                Card(
                    name="Паста Карбонара",
                    category=CardCategory.kitchen,
                    preview_title="Паста Карбонара",
                    preview_description="Классическая итальянская паста с беконом",
                    preview_icon="FaUtensils",
                    detailed_title="Паста Карбонара",
                    detailed_description="Один из самых известных итальянских рецептов пасты. Название происходит от 'carbonaro' (угольщик), так как блюдо было популярно среди угольщиков. Секрет в правильной температуре - яйца должны создать крем, а не скрамбл.",
                    detailed_image=None,
                    ingredients="Спагетти (200г), Бекон панчетта (100г), Яйца (2 шт), Пармезан тертый (50г), Перец черный, Соль, Чеснок",
                    price="650 ₽",
                    sort_order=2
                ),
                Card(
                    name="Цезарь",
                    category=CardCategory.kitchen,
                    preview_title="Салат Цезарь",
                    preview_description="Классический салат с курицей и соусом Цезарь",
                    preview_icon="FaUtensils",
                    detailed_title="Салат Цезарь",
                    detailed_description="Самый популярный салат в мире, созданный в 1924 году Цезарем Кардини в Мексике. Настоящий соус Цезарь готовится с анчоусами и сырым яйцом, что придает ему неповторимый вкус.",
                    detailed_image=None,
                    ingredients="Романо салат (100г), Куриная грудка (150г), Пармезан (30г), Хлебные крутоны, Соус Цезарь, Анчоусы, Чеснок",
                    price="450 ₽",
                    sort_order=3
                )
            ]

            # Добавляем карточки для винной карты
            wine_cards = [
                Card(
                    name="Кьянти Классико",
                    category=CardCategory.wine,
                    preview_title="Кьянти Классико",
                    preview_description="Классическое итальянское вино из Тосканы",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Кьянти Классико DOCG",
                    detailed_description="Самое известное итальянское вино, производимое в регионе Тоскана. Кьянти Классико - это вино с богатой историей, которое производится уже более 300 лет. Создается из сорта Санджовезе с добавлением других местных сортов.",
                    detailed_image=None,
                    taste="Покоряет округлым, полным, превосходно сбалансированным вкусом с фруктово-бальзамическим профилем, тонкими орехово-древесными штрихами, бархатистыми танинами и стойким послевкусием.",
                    aroma="Демонстрирует богатый, насыщенный аромат, сотканный из нот ежевики, вишни, смородины, черники, подлеска, дуба, орехов и ванили.",
                    color="Обладает темно-рубиновым цветом с чернильными штрихами.",
                    pairings="Отлично сочетается с жареным и приготовленным на гриле мясом, дичью, птицей и зрелыми сырами. Перед подачей рекомендуется аэрация.",
                    price="1800 ₽",
                    alcohol_content="13.5%",
                    volume="750 мл",
                    sort_order=1
                ),
                Card(
                    name="Пино Нуар Бургундия",
                    category=CardCategory.wine,
                    preview_title="Пино Нуар Бургундия",
                    preview_description="Элегантное французское вино из Бургундии",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Пино Нуар Бургундия AOC",
                    detailed_description="Король красных вин Бургундии. Пино Нуар - самый капризный сорт винограда, требующий особого климата и почвы. В Бургундии он достигает совершенства, создавая вина невероятной элегантности и сложности.",
                    detailed_image=None,
                    taste="Характеризуется изысканным, элегантным вкусом с нотами красных ягод, вишни, земляники и легкими минеральными оттенками.",
                    aroma="Обладает тонким, сложным ароматом с нотами красных фруктов, розы, фиалки и легкими пряными нотками.",
                    color="Имеет светло-рубиновый цвет с гранатовыми отблесками.",
                    pairings="Идеально подходит к блюдам из птицы, рыбы, мягких сыров и легких закусок. Подается при температуре 14-16°C.",
                    price="2200 ₽",
                    alcohol_content="12.5%",
                    volume="750 мл",
                    sort_order=2
                ),
                Card(
                    name="Шардоне Шабли",
                    category=CardCategory.wine,
                    preview_title="Шардоне Шабли",
                    preview_description="Минеральное белое вино из Шабли",
                    preview_icon="FaWineGlassAlt",
                    detailed_title="Шардоне Шабли AOC",
                    detailed_description="Самое минеральное белое вино Бургундии. Шабли - это уникальный терруар с киммерийскими почвами, которые придают вину особую минеральность и чистоту. Вино производится без выдержки в дубе, что сохраняет его свежесть.",
                    detailed_image=None,
                    taste="Отличается чистым, минеральным вкусом с нотами цитрусовых, зеленого яблока и легкими меловыми оттенками.",
                    aroma="Обладает свежим, чистым ароматом с нотами лимона, лайма, зеленого яблока и минеральными нотками.",
                    color="Имеет бледно-золотистый цвет с зеленоватыми отблесками.",
                    pairings="Прекрасно сочетается с морепродуктами, рыбой, устрицами и легкими салатами. Подается охлажденным до 8-10°C.",
                    price="1600 ₽",
                    alcohol_content="12.5%",
                    volume="750 мл",
                    sort_order=3
                )
            ]

            # Добавляем все карточки в базу данных
            all_cards = service_cards + bar_cards + kitchen_cards + wine_cards
            db.add_all(all_cards)
            db.commit()
            print("✅ Initial service cards seeded successfully")
            print("✅ Initial bar cards seeded successfully")
            print("✅ Initial kitchen cards seeded successfully")
            print("✅ Initial wine cards seeded successfully")
        
        # Дополнительное наполнение: добавить позиции, если их ещё нет
        try:
            from sqlalchemy import and_

            additional_bar_cards = [
                {
                    "name": "Апероль Шприц",
                    "preview_title": "Апероль Шприц",
                    "preview_description": "Игристое вино, апероль и содовая",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Апероль Шприц",
                    "detailed_description": "Свежий итальянский аперитив на основе апероля и просекко.",
                    "ingredients": "Просекко, Апероль, Содовая, Апельсин",
                    "price": "420 ₽",
                    "alcohol_content": "11%",
                    "volume": "200 мл",
                },
                {
                    "name": "Манхэттен",
                    "preview_title": "Манхэттен",
                    "preview_description": "Виски, вермут, биттер",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Манхэттен",
                    "detailed_description": "Классический крепкий коктейль на основе виски.",
                    "ingredients": "Ржаной виски, Красный вермут, Биттер Ангостура",
                    "price": "480 ₽",
                    "alcohol_content": "25%",
                    "volume": "120 мл",
                },
                {
                    "name": "Виски Сауэр",
                    "preview_title": "Виски Сауэр",
                    "preview_description": "Виски, лимон, сахар",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Виски Сауэр",
                    "detailed_description": "Кисло-сладкий коктейль на виски.",
                    "ingredients": "Бурбон, Лимонный сок, Сахарный сироп, Белок (по желанию)",
                    "price": "420 ₽",
                    "alcohol_content": "18%",
                    "volume": "150 мл",
                },
                {
                    "name": "Дайкири",
                    "preview_title": "Дайкири",
                    "preview_description": "Ром, лайм, сахар",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Дайкири",
                    "detailed_description": "Лёгкий и освежающий ромовый коктейль.",
                    "ingredients": "Светлый ром, Лаймовый сок, Сахарный сироп",
                    "price": "390 ₽",
                    "alcohol_content": "20%",
                    "volume": "120 мл",
                },
                {
                    "name": "Мартини Драй",
                    "preview_title": "Мартини Драй",
                    "preview_description": "Джин и сухой вермут",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Мартини Драй",
                    "detailed_description": "Сухой и элегантный коктейль.",
                    "ingredients": "Джин, Сухой вермут, Оливка",
                    "price": "450 ₽",
                    "alcohol_content": "25%",
                    "volume": "120 мл",
                },
                {
                    "name": "Том Коллинз",
                    "preview_title": "Том Коллинз",
                    "preview_description": "Джин, лимон, сахар, содовая",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Том Коллинз",
                    "detailed_description": "Идеальный освежающий длинный коктейль.",
                    "ingredients": "Джин, Лимонный сок, Сахарный сироп, Содовая",
                    "price": "390 ₽",
                    "alcohol_content": "10%",
                    "volume": "250 мл",
                },
                {
                    "name": "Кловер Клаб",
                    "preview_title": "Кловер Клаб",
                    "preview_description": "Джин, малина, белок",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Кловер Клаб",
                    "detailed_description": "Классика джин-баров с нежной пеной.",
                    "ingredients": "Джин, Малиновый сироп, Лимон, Белок",
                    "price": "420 ₽",
                    "alcohol_content": "18%",
                    "volume": "150 мл",
                },
                {
                    "name": "Палома",
                    "preview_title": "Палома",
                    "preview_description": "Текила, грейпфрут, содовая",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Палома",
                    "detailed_description": "Мексиканская классика на текиле.",
                    "ingredients": "Текила, Грейпфрутовый сок, Лайм, Содовая, Соль",
                    "price": "400 ₽",
                    "alcohol_content": "12%",
                    "volume": "250 мл",
                },
                {
                    "name": "Сайдкар",
                    "preview_title": "Сайдкар",
                    "preview_description": "Коньяк, трипл сек, лимон",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Сайдкар",
                    "detailed_description": "Кисло-сладкий цитрусовый баланс.",
                    "ingredients": "Коньяк, Трипл сек, Лимонный сок, Сахар",
                    "price": "480 ₽",
                    "alcohol_content": "22%",
                    "volume": "120 мл",
                },
                {
                    "name": "Френч 75",
                    "preview_title": "Френч 75",
                    "preview_description": "Джин и игристое",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Френч 75",
                    "detailed_description": "Искристый коктейль с джином и шампанским.",
                    "ingredients": "Джин, Лимон, Сахар, Игристое",
                    "price": "520 ₽",
                    "alcohol_content": "14%",
                    "volume": "180 мл",
                },
                {
                    "name": "Кайпиринья",
                    "preview_title": "Кайпиринья",
                    "preview_description": "Кашаса, лайм, сахар",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Кайпиринья",
                    "detailed_description": "Бразильская классика на кашасе.",
                    "ingredients": "Кашаса, Лайм, Сахар",
                    "price": "380 ₽",
                    "alcohol_content": "16%",
                    "volume": "180 мл",
                },
                {
                    "name": "Куба Либре",
                    "preview_title": "Куба Либре",
                    "preview_description": "Ром и кола",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Куба Либре",
                    "detailed_description": "Простой и узнаваемый микс.",
                    "ingredients": "Светлый ром, Кола, Лайм",
                    "price": "350 ₽",
                    "alcohol_content": "12%",
                    "volume": "300 мл",
                },
                {
                    "name": "Май Тай",
                    "preview_title": "Май Тай",
                    "preview_description": "Ром, лайм, оршат",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Май Тай",
                    "detailed_description": "Тики-классика с насыщенным вкусом.",
                    "ingredients": "Светлый и тёмный ром, Лайм, Орешковый сироп, Кюрасао",
                    "price": "520 ₽",
                    "alcohol_content": "20%",
                    "volume": "200 мл",
                },
                {
                    "name": "Белый Русский",
                    "preview_title": "Белый Русский",
                    "preview_description": "Водка, кофейный ликёр, сливки",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Белый Русский",
                    "detailed_description": "Сливочный десертный коктейль.",
                    "ingredients": "Водка, Кофейный ликёр, Сливки",
                    "price": "450 ₽",
                    "alcohol_content": "18%",
                    "volume": "200 мл",
                },
                {
                    "name": "Эспрессо Мартини",
                    "preview_title": "Эспрессо Мартини",
                    "preview_description": "Водка, кофе, ликёр",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Эспрессо Мартини",
                    "detailed_description": "Бодрящий кофейный коктейль.",
                    "ingredients": "Водка, Эспрессо, Кофейный ликёр, Сахарный сироп",
                    "price": "470 ₽",
                    "alcohol_content": "20%",
                    "volume": "150 мл",
                },
                {
                    "name": "Московский Мул",
                    "preview_title": "Московский Мул",
                    "preview_description": "Водка, имбирный эль, лайм",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Московский Мул",
                    "detailed_description": "Освежающий коктейль в медной кружке.",
                    "ingredients": "Водка, Имбирный эль, Лайм",
                    "price": "420 ₽",
                    "alcohol_content": "10%",
                    "volume": "300 мл",
                },
                {
                    "name": "Пина Колада",
                    "preview_title": "Пина Колада",
                    "preview_description": "Ром, ананас, кокос",
                    "preview_icon": "FaWineGlassAlt",
                    "detailed_title": "Пина Колада",
                    "detailed_description": "Тропический сливочный коктейль.",
                    "ingredients": "Светлый ром, Кокосовое молоко, Ананасовый сок",
                    "price": "420 ₽",
                    "alcohol_content": "12%",
                    "volume": "250 мл",
                },
            ]

            additional_kitchen_cards = [
                {
                    "name": "Суп Том Ям",
                    "preview_title": "Суп Том Ям",
                    "preview_description": "Острый тайский суп",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Том Ям",
                    "detailed_description": "Кисло-острый суп с креветками и грибами.",
                    "ingredients": "Бульон, Кокосовое молоко, Креветки, Лимонник, Лайм, Чили",
                    "price": "520 ₽",
                },
                {
                    "name": "Салат Греческий",
                    "preview_title": "Салат Греческий",
                    "preview_description": "Классический салат с фетой",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Греческий",
                    "detailed_description": "Овощной салат с сыром фета и оливками.",
                    "ingredients": "Помидоры, Огурцы, Болгарский перец, Фета, Оливки, Лук, Оливковое масло",
                    "price": "390 ₽",
                },
                {
                    "name": "Пицца Маргарита",
                    "preview_title": "Пицца Маргарита",
                    "preview_description": "Томаты и моцарелла",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Маргарита",
                    "detailed_description": "Традиционная тонкая пицца.",
                    "ingredients": "Томатный соус, Моцарелла, Базилик",
                    "price": "650 ₽",
                },
                {
                    "name": "Борщ",
                    "preview_title": "Борщ",
                    "preview_description": "Свекольный суп со сметаной",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Борщ",
                    "detailed_description": "Классический борщ со свежей зеленью.",
                    "ingredients": "Говядина, Свекла, Капуста, Картофель, Морковь, Лук",
                    "price": "420 ₽",
                },
                {
                    "name": "Паста Болоньезе",
                    "preview_title": "Паста Болоньезе",
                    "preview_description": "Томатный соус и фарш",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Болоньезе",
                    "detailed_description": "Сытная паста с соусом на медленном огне.",
                    "ingredients": "Спагетти, Говяжий фарш, Томатный соус, Пармезан",
                    "price": "520 ₽",
                },
                {
                    "name": "Ризотто с грибами",
                    "preview_title": "Ризотто с грибами",
                    "preview_description": "Кремовое ризотто",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Ризотто",
                    "detailed_description": "Нежное ризотто с белыми грибами.",
                    "ingredients": "Рис Арборио, Белые грибы, Пармезан, Вино",
                    "price": "590 ₽",
                },
                {
                    "name": "Куриный суп с лапшой",
                    "preview_title": "Куриный суп с лапшой",
                    "preview_description": "Домашний суп",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Куриный суп",
                    "detailed_description": "Лёгкий суп на курином бульоне.",
                    "ingredients": "Курица, Лапша, Морковь, Лук, Зелень",
                    "price": "350 ₽",
                },
                {
                    "name": "Оливье",
                    "preview_title": "Салат Оливье",
                    "preview_description": "Традиционный салат",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Оливье",
                    "detailed_description": "Классический праздничный салат.",
                    "ingredients": "Картофель, Морковь, Яйцо, Колбаса, Огурцы, Горошек, Майонез",
                    "price": "360 ₽",
                },
                {
                    "name": "Шашлык из курицы",
                    "preview_title": "Шашлык из курицы",
                    "preview_description": "Маринованное филе на гриле",
                    "preview_icon": "FaUtensils",
                    "detailed_title": "Шашлык",
                    "detailed_description": "Сочный шашлык из куриного филе.",
                    "ingredients": "Куриное филе, Маринад, Лук, Зелень",
                    "price": "690 ₽",
                },
            ]

            # Вставляем барные позиции, если их нет
            for idx, item in enumerate(additional_bar_cards, start=4):
                exists = db.query(Card).filter(and_(Card.name == item["name"], Card.category == CardCategory.bar)).first()
                if not exists:
                    db.add(Card(
                        name=item["name"],
                        category=CardCategory.bar,
                        preview_title=item["preview_title"],
                        preview_description=item.get("preview_description"),
                        preview_icon=item.get("preview_icon"),
                        detailed_title=item.get("detailed_title"),
                        detailed_description=item.get("detailed_description"),
                        detailed_image=None,
                        ingredients=item.get("ingredients"),
                        price=item.get("price"),
                        alcohol_content=item.get("alcohol_content"),
                        volume=item.get("volume"),
                        sort_order=idx
                    ))

            # Вставляем кухонные позиции, если их нет
            for idx, item in enumerate(additional_kitchen_cards, start=4):
                exists = db.query(Card).filter(and_(Card.name == item["name"], Card.category == CardCategory.kitchen)).first()
                if not exists:
                    db.add(Card(
                        name=item["name"],
                        category=CardCategory.kitchen,
                        preview_title=item["preview_title"],
                        preview_description=item.get("preview_description"),
                        preview_icon=item.get("preview_icon"),
                        detailed_title=item.get("detailed_title"),
                        detailed_description=item.get("detailed_description"),
                        detailed_image=None,
                        ingredients=item.get("ingredients"),
                        price=item.get("price"),
                        sort_order=idx
                    ))

            db.commit()
            print("✅ Additional bar and kitchen cards ensured")
        except Exception:
            pass
        
        # Создаем тесты для барной и кухонной карт с вопросами
        try:
            if db.query(User).filter(User.email == "admin@aristokrat.com").first():
                # Тест по барной карте
                bar_test = db.query(Test).filter(Test.title == "Тест по барной карте").first()
            if not bar_test:
                bar_test = Test(
                    title="Тест по барной карте",
                    description="Проверьте свои знания о коктейлях и напитках",
                    max_errors_allowed=2,
                    questions_per_test=10,
                    is_active=True
                )
                db.add(bar_test)
                db.flush()
            
                # Проверяем количество вопросов в тесте по барной карте
                bar_questions_count = db.query(Question).filter(Question.test_id == bar_test.id).count()
                if bar_questions_count < 10:
                    # Добавляем вопросы для барной карты
                    bar_questions = [
                    {
                        "text": "Какие основные ингредиенты входят в коктейль Негрони?",
                        "answers": [
                            {"text": "Джин, Кампари, красный вермут", "is_correct": True},
                            {"text": "Текила, лайм, трипл сек", "is_correct": False},
                            {"text": "Белый ром, лайм, мята", "is_correct": False},
                            {"text": "Водка, клюквенный сок, лайм", "is_correct": False}
                        ]
                    },
                    {
                        "text": "В каком году был создан коктейль Негрони?",
                        "answers": [
                            {"text": "1919 год", "is_correct": True},
                            {"text": "1920 год", "is_correct": False},
                            {"text": "1918 год", "is_correct": False},
                            {"text": "1921 год", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в коктейль Old Fashioned?",
                        "answers": [
                            {"text": "Бурбон, биттер, сахар", "is_correct": True},
                            {"text": "Джин, вермут, оливка", "is_correct": False},
                            {"text": "Ром, лайм, содовая", "is_correct": False},
                            {"text": "Водка, клюква, лайм", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой алкоголь является основой коктейля Мохито?",
                        "answers": [
                            {"text": "Белый ром", "is_correct": True},
                            {"text": "Джин", "is_correct": False},
                            {"text": "Водка", "is_correct": False},
                            {"text": "Текила", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в классический Мохито?",
                        "answers": [
                            {"text": "Белый ром, лайм, мята, содовая", "is_correct": True},
                            {"text": "Джин, вермут, оливка", "is_correct": False},
                            {"text": "Текила, трипл сек, соль", "is_correct": False},
                            {"text": "Водка, клюквенный сок", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой алкоголь является основой коктейля Маргарита?",
                        "answers": [
                            {"text": "Текила", "is_correct": True},
                            {"text": "Джин", "is_correct": False},
                            {"text": "Ром", "is_correct": False},
                            {"text": "Водка", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в коктейль Маргарита?",
                        "answers": [
                            {"text": "Текила, лайм, трипл сек, соль", "is_correct": True},
                            {"text": "Джин, вермут, оливка", "is_correct": False},
                            {"text": "Ром, мята, содовая", "is_correct": False},
                            {"text": "Водка, клюква, лайм", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Что является основой коктейля Космополитен?",
                        "answers": [
                            {"text": "Водка", "is_correct": True},
                            {"text": "Джин", "is_correct": False},
                            {"text": "Ром", "is_correct": False},
                            {"text": "Текила", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в коктейль Пина Колада?",
                        "answers": [
                            {"text": "Белый ром, кокосовое молоко, ананасовый сок", "is_correct": True},
                            {"text": "Джин, вермут, оливка", "is_correct": False},
                            {"text": "Водка, клюква, лайм", "is_correct": False},
                            {"text": "Текила, трипл сек, соль", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в коктейль Манхэттен?",
                        "answers": [
                            {"text": "Виски, красный вермут, биттер", "is_correct": True},
                            {"text": "Джин, вермут, оливка", "is_correct": False},
                            {"text": "Ром, лайм, мята", "is_correct": False},
                            {"text": "Водка, клюква, лайм", "is_correct": False}
                        ]
                    }
                    ]
                    
                    for q_data in bar_questions[:10-bar_questions_count]:
                        question = Question(test_id=bar_test.id, text=q_data["text"], image_path=None)
                        db.add(question)
                        db.flush()
                        for a_data in q_data["answers"]:
                            answer = Answer(question_id=question.id, text=a_data["text"], is_correct=a_data["is_correct"])
                            db.add(answer)
                    db.commit()
                    print(f"✅ Added questions to bar test (now has {db.query(Question).filter(Question.test_id == bar_test.id).count()} questions)")
                
                # Тест по кухонной карте
                kitchen_test = db.query(Test).filter(Test.title == "Тест по кухонной карте").first()
                if not kitchen_test:
                    kitchen_test = Test(
                        title="Тест по кухонной карте",
                        description="Проверьте свои знания о блюдах и кухне ресторана",
                        max_errors_allowed=2,
                        questions_per_test=10,
                        is_active=True
                    )
                    db.add(kitchen_test)
                    db.flush()
                
                # Проверяем количество вопросов в тесте по кухонной карте
                kitchen_questions_count = db.query(Question).filter(Question.test_id == kitchen_test.id).count()
                if kitchen_questions_count < 10:
                    # Добавляем вопросы для кухонной карты
                    kitchen_questions = [
                    {
                        "text": "Какие основные ингредиенты входят в салат Цезарь?",
                        "answers": [
                            {"text": "Курица, салат, пармезан, соус Цезарь, сухарики", "is_correct": True},
                            {"text": "Овощи, оливковое масло, уксус", "is_correct": False},
                            {"text": "Помидоры, моцарелла, базилик", "is_correct": False},
                            {"text": "Капуста, морковь, майонез", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой тип мяса используется для стейка Рибай?",
                        "answers": [
                            {"text": "Говядина", "is_correct": True},
                            {"text": "Свинина", "is_correct": False},
                            {"text": "Баранина", "is_correct": False},
                            {"text": "Телятина", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие ингредиенты входят в классическую пасту Карбонара?",
                        "answers": [
                            {"text": "Спагетти, бекон, яйца, пармезан, черный перец", "is_correct": True},
                            {"text": "Спагетти, томаты, базилик, моцарелла", "is_correct": False},
                            {"text": "Спагетти, креветки, чеснок, петрушка", "is_correct": False},
                            {"text": "Спагетти, грибы, сливки, лук", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой способ приготовления используется для лосося на гриле?",
                        "answers": [
                            {"text": "Гриль", "is_correct": True},
                            {"text": "Жарка на сковороде", "is_correct": False},
                            {"text": "Варка", "is_correct": False},
                            {"text": "Запекание в духовке", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Что входит в блюдо Лосось на гриле?",
                        "answers": [
                            {"text": "Филе лосося с овощами и лимонным соусом", "is_correct": True},
                            {"text": "Лосось с картофелем и соусом тартар", "is_correct": False},
                            {"text": "Лосось с рисом и соевым соусом", "is_correct": False},
                            {"text": "Лосось с пастой и томатным соусом", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какие основные ингредиенты входят в бургер Классик?",
                        "answers": [
                            {"text": "Говяжья котлета, салат, помидор, сыр, соус", "is_correct": True},
                            {"text": "Куриная котлета, капуста, майонез", "is_correct": False},
                            {"text": "Рыбная котлета, салат, тартар", "is_correct": False},
                            {"text": "Овощная котлета, авокадо, хумус", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какая прожарка обычно рекомендуется для стейка Рибай?",
                        "answers": [
                            {"text": "Средняя прожарка", "is_correct": True},
                            {"text": "Полная прожарка", "is_correct": False},
                            {"text": "С кровью", "is_correct": False},
                            {"text": "Слабая прожарка", "is_correct": False}
                        ]
                    },
                    {
                        "text": "С чем обычно подается стейк Рибай?",
                        "answers": [
                            {"text": "С картофелем", "is_correct": True},
                            {"text": "С рисом", "is_correct": False},
                            {"text": "С пастой", "is_correct": False},
                            {"text": "С овощами на гриле", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какое сыро используется в пасте Карбонара?",
                        "answers": [
                            {"text": "Пармезан", "is_correct": True},
                            {"text": "Моцарелла", "is_correct": False},
                            {"text": "Чеддер", "is_correct": False},
                            {"text": "Грюйер", "is_correct": False}
                        ]
                    },
                    {
                        "text": "Какой соус традиционно используется в салате Цезарь?",
                        "answers": [
                            {"text": "Соус Цезарь", "is_correct": True},
                            {"text": "Оливковое масло и уксус", "is_correct": False},
                            {"text": "Майонез", "is_correct": False},
                            {"text": "Горчичный соус", "is_correct": False}
                        ]
                    }
                    ]
                    
                    for q_data in kitchen_questions[:10-kitchen_questions_count]:
                        question = Question(test_id=kitchen_test.id, text=q_data["text"], image_path=None)
                        db.add(question)
                        db.flush()
                        for a_data in q_data["answers"]:
                            answer = Answer(question_id=question.id, text=a_data["text"], is_correct=a_data["is_correct"])
                            db.add(answer)
                    db.commit()
                    print(f"✅ Added questions to kitchen test (now has {db.query(Question).filter(Question.test_id == kitchen_test.id).count()} questions)")
        except Exception as e:
            print(f"⚠️ Error creating test questions: {e}")
            pass

        db.close()
    except Exception:
        # Не валим приложение, если сид не удался
        pass

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(cards_router)
if tests_router:
    app.include_router(tests_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(password_reset_router)

# Статические файлы для загруженных изображений
import os
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/cards", exist_ok=True)
os.makedirs("uploads/tests", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
