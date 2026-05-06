#!/bin/bash

# Скрипт для остановки публичного доступа

echo "🛑 Остановка Cloudflare туннелей..."

# Остановка по PID
if [ -f .cloudflared-frontend.pid ]; then
    PID=$(cat .cloudflared-frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID 2>/dev/null
        echo "✅ Фронтенд туннель остановлен"
    fi
    rm .cloudflared-frontend.pid
fi

if [ -f .cloudflared-backend.pid ]; then
    PID=$(cat .cloudflared-backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID 2>/dev/null
        echo "✅ Бэкенд туннель остановлен"
    fi
    rm .cloudflared-backend.pid
fi

# Остановка всех cloudflared процессов
pkill -f "cloudflared tunnel" 2>/dev/null

echo "✅ Все туннели остановлены"

