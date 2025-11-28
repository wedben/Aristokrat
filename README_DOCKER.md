# 🐳 Инструкция по развертыванию проекта с помощью Docker

## Предварительные требования

- Установленный [Docker](https://www.docker.com/get-started)
- Установленный [Docker Compose](https://docs.docker.com/compose/install/)

## Быстрый старт

### 1. Клонирование и подготовка

```bash
# Перейдите в директорию проекта
cd /Users/wedben/Aristokrat
```

### 2. Запуск проекта

```bash
# Запуск всех сервисов (бэкенд + фронтенд)
docker-compose up -d

# Или с просмотром логов
docker-compose up
```

### 3. Доступ к приложению

- **Фронтенд**: http://localhost:5173
- **Бэкенд API**: http://localhost:8000
- **Документация API**: http://localhost:8000/docs

### 4. Остановка проекта

```bash
# Остановка всех контейнеров
docker-compose down

# Остановка с удалением volumes (БД будет удалена!)
docker-compose down -v
```

## Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только бэкенд
docker-compose logs -f backend

# Только фронтенд
docker-compose logs -f frontend
```

### Пересборка контейнеров

```bash
# Пересборка после изменений в коде
docker-compose up -d --build

# Пересборка конкретного сервиса
docker-compose up -d --build backend
```

### Выполнение команд внутри контейнера

```bash
# Войти в контейнер бэкенда
docker-compose exec backend bash

# Войти в контейнер фронтенда
docker-compose exec frontend sh

# Выполнить команду Python в бэкенде
docker-compose exec backend python -m pip list
```

### Очистка

```bash
# Остановка и удаление контейнеров
docker-compose down

# Удаление образов
docker-compose down --rmi all

# Полная очистка (контейнеры + volumes + образы)
docker-compose down -v --rmi all
```

## Структура проекта

```
Aristokrat/
├── backend/
│   ├── Dockerfile          # Конфигурация бэкенда
│   ├── requirements.txt    # Python зависимости
│   └── app/               # Код приложения
├── frontend/
│   ├── Dockerfile          # Конфигурация фронтенда
│   ├── package.json       # Node зависимости
│   └── src/               # Код приложения
└── docker-compose.yml     # Оркестрация сервисов
```

## Переменные окружения

### Бэкенд

- `DATABASE_URL` - URL базы данных (по умолчанию: `sqlite:///./app.db`)

### Фронтенд

- `VITE_API_URL` - URL API бэкенда (по умолчанию: `http://localhost:8000`)

Для изменения переменных окружения отредактируйте `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=sqlite:///./app.db
  - VITE_API_URL=http://localhost:8000
```

## Решение проблем

### Порт уже занят

Если порты 8000 или 5173 заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Вместо 8000:8000
  - "5174:5173"  # Вместо 5173:5173
```

### База данных не сохраняется

Убедитесь, что volume для БД настроен в `docker-compose.yml`:

```yaml
volumes:
  - ./backend/app.db:/app/app.db
```

### Изменения в коде не применяются

В development режиме изменения применяются автоматически благодаря volumes. Если не работает:

1. Проверьте, что volumes настроены в `docker-compose.yml`
2. Перезапустите контейнер: `docker-compose restart`

### Проблемы с правами доступа

На Linux/Mac может потребоваться изменить права:

```bash
sudo chown -R $USER:$USER backend/uploads
```

## Production развертывание

Для production рекомендуется:

1. Использовать production build фронтенда
2. Настроить nginx для статики
3. Использовать PostgreSQL вместо SQLite
4. Настроить SSL/TLS
5. Использовать secrets для чувствительных данных

Пример production `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/aristokrat
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=aristokrat
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Дополнительная информация

- [Docker документация](https://docs.docker.com/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [FastAPI документация](https://fastapi.tiangolo.com/)
- [Vite документация](https://vitejs.dev/)

