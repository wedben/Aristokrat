# Деплой Aristokrat: PostgreSQL + Docker на удаленный сервер

## 1) Подготовка локально и отправка в GitHub

1. Проверьте изменения:
```bash
git status
```

2. Убедитесь, что в `docker-compose.production.yml` задан надежный пароль:
- `POSTGRES_PASSWORD`
- пароль в `DATABASE_URL`

3. Закоммитьте:
```bash
git add .
git commit -m "Migrate database to PostgreSQL and prepare Docker deployment"
```

4. Создайте репозиторий на GitHub и привяжите remote (если еще не сделано):
```bash
git remote add origin <GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

Если remote уже есть:
```bash
git push
```

## 2) Подготовка сервера

Подключитесь к серверу:
```bash
ssh <user>@<server_ip>
```

Установите Docker + Compose plugin:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3) Клонирование и запуск

```bash
git clone <GITHUB_REPO_URL>
cd Aristokrat
```

Проверьте/обновите `docker-compose.production.yml`:
- `POSTGRES_PASSWORD=...`
- `DATABASE_URL=postgresql+psycopg2://aristokrat:<PASSWORD>@db:5432/aristokrat`

Запуск:
```bash
docker compose -f docker-compose.production.yml up -d --build
```

Проверка:
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f backend
curl http://localhost:8000/health
```

## 4) Обновления после новых коммитов

```bash
cd Aristokrat
git pull
docker compose -f docker-compose.production.yml up -d --build
```

## 5) Важные замечания

- Порт фронтенда в production: `80`.
- Порт backend API: `8000`.
- Данные PostgreSQL хранятся в volume `postgres-data`.
- Для публичного доступа откройте порты в firewall/security group:
  - `80/tcp`
  - `8000/tcp` (если нужен прямой доступ к API)
