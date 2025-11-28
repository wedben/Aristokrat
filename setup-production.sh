#!/bin/bash

# Скрипт для настройки production развертывания

echo "🚀 Настройка production развертывания"
echo ""

# Получение внешнего IP
echo "🔍 Определение внешнего IP..."
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null)

if [ -z "$EXTERNAL_IP" ]; then
    echo "⚠️  Не удалось определить внешний IP автоматически"
    read -p "Введите ваш внешний IP адрес: " EXTERNAL_IP
else
    echo "✅ Найден внешний IP: $EXTERNAL_IP"
    read -p "Использовать этот IP? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        read -p "Введите ваш внешний IP адрес: " EXTERNAL_IP
    fi
fi

echo ""
echo "📝 Обновление конфигурации..."

# Обновление docker-compose.production.yml
sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=http://$EXTERNAL_IP:8000|" docker-compose.production.yml

# Обновление frontend/.env
echo "VITE_API_URL=http://$EXTERNAL_IP:8000" > frontend/.env

echo "✅ Конфигурация обновлена!"
echo ""
echo "🌐 Настройки:"
echo "   Внешний IP: $EXTERNAL_IP"
echo "   Фронтенд: http://$EXTERNAL_IP:5173"
echo "   Бэкенд: http://$EXTERNAL_IP:8000"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Настройте Port Forwarding на роутере:"
echo "      - Порт 8000 → $EXTERNAL_IP:8000 (бэкенд)"
echo "      - Порт 5173 → $EXTERNAL_IP:5173 (фронтенд)"
echo ""
echo "   2. Откройте порты в файрволе:"
echo "      macOS: sudo pfctl -f /etc/pf.conf"
echo "      Linux: sudo ufw allow 8000/tcp && sudo ufw allow 5173/tcp"
echo ""
echo "   3. Запустите проект:"
echo "      docker-compose -f docker-compose.production.yml up -d"
echo ""

