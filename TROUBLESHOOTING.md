# 🔧 Решение проблем с публичным доступом

## Ошибка 1033 Cloudflare Tunnel

Если вы видите ошибку **"Ошибка 1033: Cloudflare не может разрешить туннель"**, это означает, что туннель не может подключиться к Cloudflare.

### Решения:

#### 1. Подождите 1-2 минуты
Туннели могут требовать времени для установления соединения. Подождите и обновите страницу.

#### 2. Перезапустите туннели
```bash
./stop-public-access.sh
./start-public-access.sh
```

#### 3. Проверьте интернет-соединение
```bash
ping -c 3 1.1.1.1
curl -I https://cloudflare.com
```

#### 4. Проверьте логи
```bash
tail -f /tmp/cloudflared-frontend.log
tail -f /tmp/cloudflared-backend.log
```

Если видите постоянные ошибки `Failed to dial`, возможно:
- Файрвол блокирует соединение
- Провайдер блокирует Cloudflare
- Временные проблемы с Cloudflare

### Альтернативные решения:

#### Вариант 1: Port Forwarding (постоянный доступ)

1. Узнайте ваш внешний IP:
   ```bash
   curl ifconfig.me
   ```

2. Настройте Port Forwarding на роутере:
   - Порт 8000 → ваш_локальный_IP:8000
   - Порт 5173 → ваш_локальный_IP:5173

3. Обновите конфигурацию:
   ```bash
   EXTERNAL_IP=$(curl ifconfig.me)
   echo "VITE_API_URL=http://$EXTERNAL_IP:8000" > frontend/.env
   docker-compose -f docker-compose.production.yml restart frontend
   ```

4. Откройте порты в файрволе:
   ```bash
   # macOS
   sudo pfctl -f /etc/pf.conf
   ```

#### Вариант 2: Локальный доступ (только в вашей сети)

Если нужен доступ только в локальной сети:

1. Узнайте ваш локальный IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Обновите конфигурацию:
   ```bash
   LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
   echo "VITE_API_URL=http://$LOCAL_IP:8000" > frontend/.env
   docker-compose -f docker-compose.production.yml restart frontend
   ```

3. Откройте в браузере: `http://$LOCAL_IP:5173`

#### Вариант 3: Облачное развертывание

Для стабильного публичного доступа рассмотрите:
- **Railway.app** - автоматическое развертывание с HTTPS
- **Render.com** - бесплатный хостинг с автоматическим SSL
- **VPS** (DigitalOcean, AWS, etc.) - полный контроль

---

## Другие проблемы

### Туннели не запускаются

```bash
# Проверьте, установлен ли cloudflared
cloudflared --version

# Если нет, установите:
brew install cloudflared
```

### URL меняются при каждом перезапуске

Это нормально для бесплатного Cloudflare Tunnel. Для постоянного URL:
- Используйте Port Forwarding
- Или разверните на облачном сервисе

### Медленное подключение

Cloudflare Tunnel может быть медленным из-за:
- Географического расположения
- Загрузки серверов Cloudflare
- Проблем с интернет-соединением

Решение: используйте Port Forwarding для прямого доступа.

---

## Быстрая диагностика

```bash
# 1. Проверка Docker
docker ps

# 2. Проверка локальных сервисов
curl http://localhost:8000/health
curl -I http://localhost:5173

# 3. Проверка туннелей
ps aux | grep cloudflared

# 4. Проверка логов
tail -20 /tmp/cloudflared-frontend.log
tail -20 /tmp/cloudflared-backend.log
```

---

## Контакты и поддержка

Если проблема не решается:
1. Проверьте логи: `/tmp/cloudflared-*.log`
2. Проверьте статус Docker: `docker-compose -f docker-compose.production.yml ps`
3. Попробуйте альтернативные решения выше

