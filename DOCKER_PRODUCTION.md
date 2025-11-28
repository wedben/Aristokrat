# 🐳 Развертывание проекта через Docker (без ngrok)

## 🎯 Варианты развертывания

### Вариант 1: Локальный сервер с Port Forwarding (рекомендуется для начала)

#### Шаг 1: Узнайте ваш внешний IP

```bash
curl ifconfig.me
```

Или найдите в настройках роутера.

#### Шаг 2: Настройте Port Forwarding на роутере

1. Откройте настройки роутера (обычно `192.168.1.1` или `192.168.0.1`)
2. Найдите раздел "Port Forwarding" или "Виртуальные серверы"
3. Добавьте правила:
   - **Порт 8000** → ваш компьютер:8000 (бэкенд)
   - **Порт 5173** → ваш компьютер:5173 (фронтенд)
   - Или используйте порт 80 для фронтенда (стандартный HTTP)

#### Шаг 3: Обновите конфигурацию

Отредактируйте `docker-compose.production.yml`:

```yaml
environment:
  - VITE_API_URL=http://YOUR_EXTERNAL_IP:8000
```

Замените `YOUR_EXTERNAL_IP` на ваш внешний IP адрес.

#### Шаг 4: Запустите проект

```bash
docker-compose -f docker-compose.production.yml up -d
```

#### Шаг 5: Откройте файрвол

**macOS:**
```bash
# Разрешить входящие подключения на порты
sudo pfctl -f /etc/pf.conf
```

**Linux:**
```bash
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp
```

**Windows:**
Через настройки Windows Firewall разрешите порты 8000 и 5173.

#### Доступ к сайту

- **Фронтенд:** `http://YOUR_EXTERNAL_IP:5173`
- **Бэкенд API:** `http://YOUR_EXTERNAL_IP:8000`

---

### Вариант 2: VPS сервер (DigitalOcean, AWS, Hetzner и т.д.)

#### Шаг 1: Подключитесь к серверу

```bash
ssh user@your-server-ip
```

#### Шаг 2: Установите Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Или через пакетный менеджер
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

#### Шаг 3: Скопируйте проект на сервер

```bash
# С вашего компьютера
scp -r /Users/wedben/Aristokrat user@server:/home/user/
```

Или используйте Git:
```bash
git clone your-repo-url
cd Aristokrat
```

#### Шаг 4: Обновите конфигурацию

Отредактируйте `docker-compose.production.yml`:

```yaml
environment:
  - VITE_API_URL=http://YOUR_SERVER_IP:8000
  # Или если настроен домен:
  # - VITE_API_URL=https://api.yourdomain.com
```

#### Шаг 5: Запустите проект

```bash
docker-compose -f docker-compose.production.yml up -d
```

#### Шаг 6: Настройте файрвол

```bash
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp
# Или если используете Nginx на порту 80:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Доступ к сайту

- **Фронтенд:** `http://YOUR_SERVER_IP:5173`
- **Бэкенд API:** `http://YOUR_SERVER_IP:8000`

---

### Вариант 3: Nginx Reverse Proxy (для production)

Для production рекомендуется использовать Nginx как reverse proxy.

#### Создайте `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Фронтенд
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Бэкенд API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Обновите `docker-compose.production.yml`:

```yaml
environment:
  - VITE_API_URL=http://yourdomain.com/api
```

---

### Вариант 4: Облачные сервисы

#### Railway.app

1. Зарегистрируйтесь на https://railway.app
2. Подключите GitHub репозиторий
3. Railway автоматически развернёт проект
4. Получите публичный URL

#### Render.com

1. Зарегистрируйтесь на https://render.com
2. Создайте новый Web Service
3. Подключите репозиторий
4. Настройте переменные окружения
5. Разверните проект

#### Heroku

1. Установите Heroku CLI
2. Создайте приложение:
   ```bash
   heroku create your-app-name
   ```
3. Разверните:
   ```bash
   git push heroku main
   ```

---

## 🔧 Настройка для production

### 1. Используйте переменные окружения

Создайте `.env` файлы:

**`backend/.env`:**
```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key-here
```

**`frontend/.env`:**
```env
VITE_API_URL=http://your-server-ip:8000
```

### 2. Обновите Dockerfile для production

**`frontend/Dockerfile.production`:**
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Используйте HTTPS

Для production обязательно используйте HTTPS:

1. Получите SSL сертификат (Let's Encrypt бесплатный)
2. Настройте Nginx для HTTPS
3. Обновите `VITE_API_URL` на `https://`

---

## 📋 Чеклист для production

- [ ] Docker установлен на сервере
- [ ] Порты открыты в файрволе
- [ ] Port Forwarding настроен (если локальный сервер)
- [ ] `VITE_API_URL` обновлён в конфигурации
- [ ] Проект запущен через `docker-compose.production.yml`
- [ ] База данных работает
- [ ] Файлы загружаются корректно
- [ ] HTTPS настроен (для production)
- [ ] Домен настроен (опционально)

---

## 🚀 Быстрый старт

```bash
# 1. Обновите VITE_API_URL в docker-compose.production.yml
# 2. Запустите проект
docker-compose -f docker-compose.production.yml up -d

# 3. Проверьте статус
docker-compose -f docker-compose.production.yml ps

# 4. Просмотр логов
docker-compose -f docker-compose.production.yml logs -f
```

---

## 🔒 Безопасность

1. **Используйте сильные пароли** для админ-панели
2. **Настройте HTTPS** для production
3. **Ограничьте доступ** к админ-панели по IP (опционально)
4. **Регулярно обновляйте** зависимости
5. **Делайте резервные копии** базы данных

---

## 📞 Решение проблем

### Порт занят

```bash
# Проверьте, что порт свободен
lsof -i :8000
lsof -i :5173

# Остановите процесс, занимающий порт
kill -9 PID
```

### Docker не запускается

```bash
# Проверьте логи
docker-compose -f docker-compose.production.yml logs

# Пересоберите контейнеры
docker-compose -f docker-compose.production.yml up -d --build
```

### База данных не работает

```bash
# Проверьте права доступа
ls -la backend/app.db

# Проверьте логи бэкенда
docker-compose -f docker-compose.production.yml logs backend
```

