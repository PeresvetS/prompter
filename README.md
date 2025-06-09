# 🤖 Prompter - Assistant Gate Bot

Telegram бот с интеграцией OpenAI Assistant для создания промптов по методике PJ Ace с системой проверки подписки на каналы и админ панелью.

## 📁 Структура проекта

```
prompter/
├── assistant-gate-bot/        # Основное приложение - Telegram бот
│   ├── src/                  # NestJS backend
│   ├── admin-panel/          # React админ панель
│   ├── prisma/              # База данных
│   ├── public/              # Статические файлы
│   ├── README.md            # Подробная документация
│   └── .env.example         # Шаблон переменных окружения
├── prd.txt                  # Product Requirements Document
└── README.md               # Этот файл
```

## 🚀 Быстрый старт

Перейдите в директорию `assistant-gate-bot` для полной документации:

```bash
cd assistant-gate-bot
cat README.md
```

## 🎯 Основные возможности

### ✅ Telegram Bot

- **Проверка подписки** на обязательные каналы
- **OpenAI Assistant** интеграция для умных ответов
- **Голосовые сообщения** с расшифровкой через Whisper API
- **Лимиты запросов** (50 запросов в день на пользователя)
- **Система банов** пользователей

### ✅ Admin Panel

- **JWT аутентификация** для безопасного доступа
- **Статистика пользователей** и управление
- **Бан/разбан пользователей** одним кликом
- **Responsive дизайн** для мобильных устройств

### ✅ Production Ready

- **Rate Limiting** и security headers
- **Structured Logging** с ротацией файлов
- **Health Checks** для мониторинга
- **Railway deployment** готов к использованию

## 🚀 Деплой на Railway

1. Перейдите в `assistant-gate-bot/`
2. Следуйте инструкциям в `README.md`
3. Настройте переменные окружения из `.env.example`
4. Деплойте на Railway

## 📊 Статус проекта

**✅ 100% ЗАВЕРШЕН** - Готов к production деплою!

- ✅ Telegram Bot с OpenAI интеграцией
- ✅ Проверка подписки на каналы (настраивается через ENV)
- ✅ Admin Panel с JWT аутентификацией
- ✅ Система банов и лимитов
- ✅ Production security и логирование
- ✅ Railway deployment конфигурация
- ✅ Полная документация

## 🔧 Технологии

**Backend:**

- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Telegram Bot API
- OpenAI API + Whisper

**Frontend:**

- React 18 + TypeScript
- Vite + CSS Modules
- JWT Authentication

**Infrastructure:**

- Railway (hosting)
- PostgreSQL (database)
- Winston (logging)
- Helmet.js (security)

---

**🎯 Проект готов к production деплою на Railway! 🚀**

Подробная документация находится в `assistant-gate-bot/README.md`
