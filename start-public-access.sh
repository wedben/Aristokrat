#!/bin/bash

# Скрипт для запуска публичного доступа через Cloudflare Tunnel

echo "🚀 Запуск публичного доступа через Cloudflare Tunnel..."
echo ""

# Проверка cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared не установлен!"
    echo "Установите: brew install cloudflared"
    exit 1
fi

# Остановка старых туннелей
echo "🛑 Остановка старых туннелей..."
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 2

# Запуск Docker контейнеров (если не запущены)
echo "🐳 Проверка Docker контейнеров..."
if ! docker ps | grep -q "aristokrat-backend"; then
    echo "Запуск Docker контейнеров..."
    docker-compose -f docker-compose.production.yml up -d
    sleep 5
fi

# Проверка локальных сервисов
echo "🔍 Проверка локальных сервисов..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Бэкенд не отвечает на localhost:8000"
    echo "Убедитесь, что Docker контейнеры запущены:"
    echo "  docker-compose -f docker-compose.production.yml up -d"
    exit 1
fi

if ! curl -s -I http://localhost:5173 > /dev/null 2>&1; then
    echo "❌ Фронтенд не отвечает на localhost:5173"
    echo "Убедитесь, что Docker контейнеры запущены:"
    echo "  docker-compose -f docker-compose.production.yml up -d"
    exit 1
fi

echo "✅ Локальные сервисы работают"
echo ""

# Запуск туннеля для фронтенда
echo "🌐 Запуск туннеля для фронтенда..."
nohup cloudflared tunnel --url http://localhost:5173 > /tmp/cloudflared-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Запуск туннеля для бэкенда
echo "🌐 Запуск туннеля для бэкенда..."
nohup cloudflared tunnel --url http://localhost:8000 > /tmp/cloudflared-backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Получение URL
FRONTEND_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/cloudflared-frontend.log 2>/dev/null | head -1)
BACKEND_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/cloudflared-backend.log 2>/dev/null | head -1)

# Ожидание если URL ещё не созданы
if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "⏳ Ожидание создания URL (может занять до 30 секунд)..."
    for i in {1..10}; do
        sleep 3
        FRONTEND_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/cloudflared-frontend.log 2>/dev/null | head -1)
        BACKEND_URL=$(grep -o 'https://[^ ]*\.trycloudflare\.com' /tmp/cloudflared-backend.log 2>/dev/null | head -1)
        if [ -n "$FRONTEND_URL" ] && [ -n "$BACKEND_URL" ]; then
            break
        fi
        if [ $((i % 3)) -eq 0 ]; then
            echo "   Попытка $i/10..."
        fi
    done
fi

# Дополнительная проверка подключения туннелей
if [ -n "$BACKEND_URL" ]; then
    echo "🧪 Проверка подключения туннелей..."
    for i in {1..5}; do
        sleep 2
        if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
            echo "✅ Туннели подключены и работают!"
            break
        fi
        if [ $i -eq 5 ]; then
            echo "⚠️  Туннели созданы, но ещё подключаются..."
            echo "   Подождите 30-60 секунд и попробуйте открыть URL"
        fi
    done
fi

if [ -n "$FRONTEND_URL" ] && [ -n "$BACKEND_URL" ]; then
    echo ""
    echo "✅ Публичные URL созданы!"
    echo ""
    echo "🌐 Доступ к сайту из любой сети:"
    echo "   Фронтенд: $FRONTEND_URL"
    echo "   Бэкенд: $BACKEND_URL"
    echo ""
    
    # Обновление конфигурации
    echo "🔧 Обновление конфигурации..."
    echo "VITE_API_URL=$BACKEND_URL" > frontend/.env
    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$BACKEND_URL|" docker-compose.production.yml 2>/dev/null
    
    # Пересоздание фронтенда с новой переменной окружения
    echo "🔄 Пересоздание фронтенда с новой конфигурацией..."
    docker-compose -f docker-compose.production.yml up -d --force-recreate frontend
    sleep 5
    
    echo ""
    echo "✅ Готово!"
    echo ""
    echo "📋 Сохраните эти URL - они будут работать пока запущены туннели"
    echo ""
    echo "🛑 Для остановки выполните: ./stop-public-access.sh"
    echo ""
    echo "💡 Или нажмите Ctrl+C в этом терминале"
    
    # Сохранение PID для последующей остановки
    echo "$FRONTEND_PID" > .cloudflared-frontend.pid
    echo "$BACKEND_PID" > .cloudflared-backend.pid
else
    echo "❌ Не удалось получить URL"
    echo "Проверьте логи:"
    echo "  tail -f /tmp/cloudflared-frontend.log"
    echo "  tail -f /tmp/cloudflared-backend.log"
fi

