# Insight Sorcerer Backend

Backend API для Insight Sorcerer - платформы для создания Stock & Flow моделей.

## 🚀 Технологии

- **Fastify** - быстрый веб-фреймворк
- **TypeScript** - типизированный JavaScript
- **WebSocket** - real-time коммуникация
- **LangChain + LangGraph** - AI агент для помощи с моделями
- **OpenRouter** - доступ к различным LLM моделям

## 📦 Установка

```bash
npm install
```

## ⚙️ Настройка

1. Скопируйте `env.example` в `.env`:
```bash
cp env.example .env
```

2. Добавьте ваш OpenRouter API ключ и выберите модель в `.env`:
```env
OPENROUTER_API_KEY=your_key_here
LLM_MODEL=anthropic/claude-3.5-sonnet
```

Получить ключ можно на: https://openrouter.ai/keys
Посмотреть доступные модели: https://openrouter.ai/models

## 🏃 Запуск

### Development режим (с hot reload)
```bash
npm run dev
```

### Production build
```bash
npm run build
npm start
```

## 🤖 AI Agent

Backend использует LangGraph для создания интеллектуального агента, который помогает с:

- **Построением схем** - объяснение элементов Stock, Flow, Variable, Converter
- **Дебагом моделей** - поиск ошибок в логике и связях
- **Созданием формул** - помощь с математическими формулами
- **Анализом структуры** - советы по улучшению модели

### Доступные модели

Модель настраивается через переменную `LLM_MODEL` в `.env` файле. Популярные варианты:

- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet (рекомендуется, сбалансированный)
- `deepseek/deepseek-v3.2` - DeepSeek V3.2 (быстрый, доступный)
- `openai/gpt-4-turbo` - GPT-4 Turbo (мощный)
- `google/gemini-pro` - Gemini Pro (быстрый)
- `meta-llama/llama-3.1-70b-instruct` - Llama 3.1 70B (open source)

Полный список моделей и цены: https://openrouter.ai/models

## 📡 API Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/ai/query` - Универсальный запрос к AI
- `POST /api/ai/stream` - Стриминг ответов AI
- `GET /api/ai/capabilities` - Список возможностей AI

### WebSocket

- `WS /api/ai/chat` - Real-time чат с AI агентом

#### WebSocket Protocol

**Отправка сообщения:**
```json
{
  "type": "message",
  "message": "Как создать Stock элемент?"
}
```

**Получение токенов (streaming):**
```json
{
  "type": "token",
  "content": "Для",
  "timestamp": "2026-02-15T..."
}
```

**Завершение ответа:**
```json
{
  "type": "message_complete",
  "timestamp": "2026-02-15T..."
}
```

**Обновление контекста:**
```json
{
  "type": "context_update",
  "context": {
    "diagram": {...},
    "selectedNode": {...}
  }
}
```

## 🔍 LangSmith Tracing (опционально)

Для отладки и мониторинга AI агента можно включить LangSmith:

1. Зарегистрируйтесь на https://smith.langchain.com/
2. Добавьте в `.env`:
```env
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_API_KEY="your_langsmith_key"
LANGSMITH_PROJECT="insight-sorcerer"
```

После этого все запросы к AI агенту будут автоматически логироваться в LangSmith для анализа и отладки.

## 📝 Структура проекта

```
backend/
├── src/
│   ├── routes/
│   │   └── ai.ts           # AI API endpoints + WebSocket
│   ├── services/
│   │   └── ai-agent.ts     # LangGraph агент
│   ├── types/
│   │   └── ai.ts           # TypeScript типы
│   └── server.ts           # Fastify сервер
├── .env                    # Переменные окружения (не в git)
├── env.example             # Пример .env файла
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Отладка

### Проверка подключения
```bash
curl http://localhost:3001/health
```

### Проверка AI capabilities
```bash
curl http://localhost:3001/api/ai/capabilities
```

### Логи
Сервер использует `pino-pretty` для красивых логов. Все WebSocket события и AI запросы логируются.

## 📄 Лицензия

MIT
