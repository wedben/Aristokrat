# 🚀 Инструкция по запуску и проверке проекта

## 📋 Содержание

1. [Запуск проекта](#запуск-проекта)
2. [Проверка статуса](#проверка-статуса)
3. [Проверка подключений](#проверка-подключений)
4. [Доступ к приложению](#доступ-к-приложению)
5. [Остановка проекта](#остановка-проекта)
6. [Решение проблем](#решение-проблем)

---

## 🚀 Запуск проекта

### Предварительные требования

- Установлен Docker и Docker Compose
- **Docker Desktop запущен** (проверьте иконку Docker в меню macOS)
- Порты 8000 и 5173 свободны

### Проверка Docker

Перед запуском убедитесь, что Docker работает:

```bash
docker ps
```

Если видите ошибку "Cannot connect to the Docker daemon":
1. Откройте Docker Desktop
2. Дождитесь полного запуска (иконка перестанет мигать)
3. Попробуйте снова

### Шаг 1: Перейдите в директорию проекта

```bash
cd /Users/wedben/Aristokrat
```

### Шаг 2: Запустите проект

```bash
docker-compose -f docker-compose.production.yml up -d
```

Флаг `-d` запускает контейнеры в фоновом режиме.

### Шаг 3: Дождитесь запуска

Подождите 5-10 секунд, пока контейнеры полностью запустятся.

---

## 📊 Проверка статуса

### Проверка статуса контейнеров

```bash
docker-compose -f docker-compose.production.yml ps
```

**Ожидаемый результат:**
```
NAME                  STATUS
aristokrat-backend    Up X seconds
aristokrat-frontend   Up X seconds
```

Оба контейнера должны быть в статусе `Up`.

### Просмотр логов

**Все сервисы:**
```bash
docker-compose -f docker-compose.production.yml logs -f
```

**Только бэкенд:**
```bash
docker-compose -f docker-compose.production.yml logs -f backend
```

**Только фронтенд:**
```bash
docker-compose -f docker-compose.production.yml logs -f frontend
```

Нажмите `Ctrl+C` для выхода из просмотра логов.

---

## 🔍 Проверка подключений

### 1. Проверка базы данных

```bash
docker-compose -f docker-compose.production.yml exec backend python3 -c "
from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()
print('✅ База данных подключена')
print(f'📊 Найдено таблиц: {len(tables)}')

db = SessionLocal()
users_count = db.query(User).count()
admin = db.query(User).filter(User.role == UserRole.admin).first()
print(f'👥 Пользователей в БД: {users_count}')
if admin:
    print(f'✅ Админ найден: {admin.email}')
db.close()
"
```

**Ожидаемый результат:**
```
✅ База данных подключена
📊 Найдено таблиц: 12
👥 Пользователей в БД: X
✅ Админ найден: admin@aristokrat.com
```

### 2. Проверка бэкенда

```bash
curl http://localhost:8000/health
```

**Ожидаемый результат:**
```json
{"status":"ok"}
```

Или откройте в браузере: http://localhost:8000/docs

### 3. Проверка фронтенда

```bash
curl -I http://localhost:5173
```

**Ожидаемый результат:**
```
HTTP/1.1 200 OK
```

Или откройте в браузере: http://localhost:5173

---

## 🌐 Доступ к приложению

### Локальный доступ

- **Фронтенд:** http://localhost:5173
- **Бэкенд API:** http://localhost:8000
- **Документация API:** http://localhost:8000/docs

### Публичный доступ (из любой сети)

Для доступа извне используйте Cloudflare Tunnel:

#### Быстрый запуск

```bash
./start-public-access.sh
```

Скрипт создаст публичные URL и обновит конфигурацию автоматически.

#### Ручной запуск

1. Установите cloudflared (если не установлен):
   ```bash
   brew install cloudflared
   ```

2. Запустите туннели:
   ```bash
   # Фронтенд
   cloudflared tunnel --url http://localhost:5173
   
   # Бэкенд (в другом терминале)
   cloudflared tunnel --url http://localhost:8000
   ```

3. Скопируйте URL из вывода (например: `https://xxx.trycloudflare.com`)

4. Обновите конфигурацию:
   ```bash
   echo "VITE_API_URL=<BACKEND_URL>" > frontend/.env
   docker-compose -f docker-compose.production.yml restart frontend
   ```

#### Остановка публичного доступа

```bash
./stop-public-access.sh
```

Или вручную:
```bash
pkill -f "cloudflared tunnel"
```

### Данные для входа

- **Email:** `admin@aristokrat.com`
- **Пароль:** `Wersaderba12x.---.`

---

## 🛑 Остановка проекта

### Остановка контейнеров

```bash
docker-compose -f docker-compose.production.yml down
```

### Остановка с удалением volumes

⚠️ **Внимание:** Это удалит базу данных!

```bash
docker-compose -f docker-compose.production.yml down -v
```

---

## 🔄 Перезапуск проекта

### Перезапуск всех сервисов

```bash
docker-compose -f docker-compose.production.yml restart
```

### Перезапуск конкретного сервиса

```bash
# Бэкенд
docker-compose -f docker-compose.production.yml restart backend

# Фронтенд
docker-compose -f docker-compose.production.yml restart frontend
```

### Пересборка и перезапуск

После изменений в коде:

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🔧 Решение проблем

### Проблема: Контейнеры не запускаются

**Решение:**
1. Проверьте, что порты свободны:
   ```bash
   lsof -i :8000
   lsof -i :5173
   ```

2. Остановите процессы, занимающие порты:
   ```bash
   kill -9 PID
   ```

3. Перезапустите проект:
   ```bash
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d
   ```

### Проблема: База данных не подключается

**Решение:**
1. Проверьте логи бэкенда:
   ```bash
   docker-compose -f docker-compose.production.yml logs backend
   ```

2. Проверьте права доступа к файлу БД:
   ```bash
   ls -la backend/app.db
   ```

3. Пересоздайте контейнер:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --force-recreate backend
   ```

### Проблема: Фронтенд не загружается

**Решение:**
1. Проверьте логи фронтенда:
   ```bash
   docker-compose -f docker-compose.production.yml logs frontend
   ```

2. Проверьте переменную окружения:
   ```bash
   docker-compose -f docker-compose.production.yml exec frontend sh -c "echo \$VITE_API_URL"
   ```

3. Обновите .env файл:
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > frontend/.env
   docker-compose -f docker-compose.production.yml restart frontend
   ```

### Проблема: Ошибки при сборке

**Решение:**
1. Очистите кэш Docker:
   ```bash
   docker system prune -a
   ```

2. Пересоберите образы:
   ```bash
   docker-compose -f docker-compose.production.yml build --no-cache
   docker-compose -f docker-compose.production.yml up -d
   ```

---

## 📋 Быстрые команды

### Полная проверка проекта

```bash
# Статус контейнеров
docker-compose -f docker-compose.production.yml ps

# Проверка БД
docker-compose -f docker-compose.production.yml exec backend python3 -c "from app.database.session import engine; from sqlalchemy import inspect; print('✅ БД:', len(inspect(engine).get_table_names()), 'таблиц')"

# Проверка бэкенда
curl http://localhost:8000/health

# Проверка фронтенда
curl -I http://localhost:5173
```

### Просмотр всех логов

```bash
docker-compose -f docker-compose.production.yml logs --tail=50
```

### Очистка всего

```bash
# Остановка и удаление контейнеров
docker-compose -f docker-compose.production.yml down -v

# Удаление образов
docker-compose -f docker-compose.production.yml down --rmi all
```

---

## ✅ Чеклист запуска

- [ ] Docker запущен
- [ ] Порты 8000 и 5173 свободны
- [ ] Проект запущен: `docker-compose -f docker-compose.production.yml up -d`
- [ ] Контейнеры в статусе `Up`
- [ ] База данных подключена
- [ ] Бэкенд отвечает на `/health`
- [ ] Фронтенд доступен на `http://localhost:5173`
- [ ] Можно войти в систему

---

## 📞 Полезные ссылки

- Docker документация: https://docs.docker.com
- Docker Compose документация: https://docs.docker.com/compose

---

## 🎉 Готово!

Если все проверки пройдены успешно, проект готов к работе!

Откройте http://localhost:5173 в браузере и войдите в систему.

