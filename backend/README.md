# Insight Sorcerer Backend

Backend API для проекта Insight Sorcerer на Fastify + TypeScript.

## Установка

```bash
npm install
```

## Запуск

### Development режим (с hot reload)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Структура проекта

```
backend/
├── src/
│   └── server.ts          # Главный файл сервера
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

### Health Check
- `GET /health` - Проверка статуса сервера

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

- `PORT` - Порт сервера (по умолчанию: 3001)
- `HOST` - Хост сервера (по умолчанию: 0.0.0.0)
- `NODE_ENV` - Окружение (development/production)

