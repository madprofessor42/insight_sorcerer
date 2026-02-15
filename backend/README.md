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
│   ├── server.ts          # Главный файл сервера
│   └── routes/
│       └── ai.ts          # AI/LLM роуты
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints

### Health Check
- `GET /health` - Проверка статуса сервера

### AI Assistant (универсальный роут для работы с LLM)
- `POST /api/ai/query` - Отправка вопроса AI (помощь в построении схемы, дебаг, формулы и т.д.)
- `POST /api/ai/stream` - Стриминг ответов AI для длинных ответов
- `GET /api/ai/capabilities` - Получить список доступных AI возможностей
- `WS /api/ai/chat` - WebSocket соединение для real-time чата с AI

#### Пример запроса к `/api/ai/query`:
```json
{
  "message": "Как мне создать модель роста населения?",
  "context": {
    "action": "build",
    "diagram": {
      "nodeDataArray": [],
      "linkDataArray": []
    }
  },
  "history": []
}
```

#### WebSocket чат (`/api/ai/chat`):
Поддерживает автоматическое переподключение, heartbeat (ping/pong) и real-time обмен сообщениями.

**Типы сообщений:**
- `ping/pong` - проверка соединения (каждые 30 сек)
- `message` - сообщение пользователя/ответ AI
- `welcome` - приветственное сообщение при подключении
- `context_update` - обновление контекста диаграммы
- `error` - сообщение об ошибке

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

- `PORT` - Порт сервера (по умолчанию: 3001)
- `HOST` - Хост сервера (по умолчанию: 0.0.0.0)
- `NODE_ENV` - Окружение (development/production)

