FROM node:20-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование кода приложения
COPY . .

# Открытие порта
EXPOSE 5173

# Запуск dev сервера с переменными окружения
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0"]

