# 🤖 Assistant Gate Bot

Telegram бот с интеграцией OpenAI Assistant для создания промптов по методике PJ Ace с системой проверки подписки на каналы и админ панелью.

## 🎯 Основные возможности

### ✅ Telegram Bot

- **Проверка подписки** на обязательные каналы
- **OpenAI Assistant** интеграция для умных ответов
- **Голосовые сообщения** с расшифровкой через Whisper API
- **Лимиты запросов** (50 запросов в день на пользователя)
- **Система банов** пользователей
- **Webhook безопасность** с проверкой подписи

### ✅ Admin Panel

- **JWT аутентификация** для безопасного доступа
- **Статистика пользователей** (общее количество, активные, забаненные)
- **Управление пользователями** с пагинацией и поиском
- **Бан/разбан пользователей** одним кликом
- **Сброс лимитов** запросов
- **Responsive дизайн** для мобильных устройств

### ✅ Безопасность и Production

- **Rate Limiting** для всех API endpoints
- **Security Headers** (Helmet.js, CSP, HSTS)
- **Input Validation** и защита от XSS
- **Structured Logging** с ротацией файлов
- **Health Checks** для мониторинга
- **Graceful Shutdown** для корректного завершения

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- PostgreSQL
- Telegram Bot Token
- OpenAI API Key

### Установка

```bash
# Клонируем репозиторий
git clone <repository-url>
cd assistant-gate-bot

# Устанавливаем зависимости
npm install

# Создаем .env файл
cp .env.example .env
# Отредактируйте .env файл с вашими настройками

# Настраиваем базу данных
npx prisma db push
npx prisma generate

# Собираем проект
npm run build

# Запускаем в development режиме
npm run start:dev
```

## ⚙️ Конфигурация

### Переменные окружения

Скопируйте `.env.example` в `.env` и заполните следующие переменные:

#### 🔑 Обязательные переменные

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_SECRET_TOKEN=your_webhook_secret_token_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ASSISTANT_ID=your_openai_assistant_id_here

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/telegram_bot?schema=public"

# Admin & Security Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here
```

#### 📢 Конфигурация каналов

```bash
# Main Channel (первый обязательный канал)
CHANNEL_MAIN_USERNAME=oh_my_zen
CHANNEL_MAIN_URL=https://t.me/oh_my_zen
CHANNEL_MAIN_EMOJI=📢

# Second Channel (второй обязательный канал)
CHANNEL_SECOND_USERNAME=avato_ai
CHANNEL_SECOND_URL=https://t.me/avato_ai
CHANNEL_SECOND_EMOJI=🎨

# Channel Subscription Configuration
PRIMARY_CHANNEL_ID=@oh_my_zen
INITIAL_CHANNEL_IDS=@oh_my_zen,@avato_ai
```

#### 🌐 Production настройки

```bash
# Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Railway Webhook URL (для production)
WEBHOOK_URL=https://your-app-name.railway.app/telegram/webhook
```

### Получение токенов

1. **Telegram Bot Token**:

   - Идите к [@BotFather](https://t.me/botfather)
   - Создайте бота: `/newbot`
   - Скопируйте токен

2. **OpenAI API Key**:

   - Зайдите на [OpenAI Platform](https://platform.openai.com/api-keys)
   - Создайте новый API ключ

3. **OpenAI Assistant ID**:

   - В [OpenAI Playground](https://platform.openai.com/playground) создайте Assistant
   - Скопируйте ID ассистента

4. **JWT Secret**:
   ```bash
   # Генерируем безопасный ключ
   openssl rand -hex 32
   ```

## 🏗️ Архитектура проекта

```
assistant-gate-bot/
├── admin-panel/              # React админ панель
│   ├── src/
│   │   ├── components/       # Login, Dashboard компоненты
│   │   ├── api.ts           # API клиент с JWT
│   │   └── App.tsx          # Главный компонент
│   └── package.json         # Vite + React зависимости
├── public/admin/            # Собранные статические файлы
├── src/                     # NestJS backend
│   ├── admin/              # Admin API endpoints
│   ├── common/             # Общие сервисы (логирование, безопасность)
│   ├── openai/             # OpenAI интеграция
│   ├── subscription/       # Проверка подписки на каналы
│   ├── telegram/           # Telegram bot логика
│   └── user/               # Управление пользователями
├── prisma/                 # Схема базы данных
├── logs/                   # Файлы логов (production)
├── .env.example           # Шаблон переменных окружения
└── README.md              # Этот файл
```

## 🛠️ Команды разработки

```bash
# Development
npm run start:dev          # Запуск в dev режиме с hot reload

# Building
npm run build             # Сборка всего проекта
npm run build:admin       # Сборка только админ панели
npm run build:backend     # Сборка только backend

# Production
npm run start:prod        # Запуск production сборки
npm run deploy           # Команда для Railway деплоя

# Database
npx prisma db push       # Применить схему к БД
npx prisma generate      # Генерация Prisma клиента
npx prisma studio        # Открыть Prisma Studio

# Testing
npm run test             # Запуск тестов
npm run test:e2e         # End-to-end тесты
```

## 🌐 API Endpoints

### Публичные endpoints

- `GET /health` - Health check системы
- `POST /telegram/webhook` - Telegram webhook (защищен)

### Admin endpoints (требуют JWT)

- `POST /admin/login` - Аутентификация админа
- `GET /admin/stats` - Статистика пользователей
- `GET /admin/users` - Список пользователей (с пагинацией)
- `PUT /admin/users/:id/ban` - Бан пользователя
- `PUT /admin/users/:id/unban` - Разбан пользователя
- `PATCH /admin/users/:id/ban` - Бан пользователя (альтернативный endpoint)
- `PATCH /admin/users/:id/unban` - Разбан пользователя (альтернативный endpoint)
- `PATCH /admin/users/:id/reset-requests` - Сброс лимита запросов

### Статические файлы

- `GET /admin/*` - Админ панель (React SPA)

## 🚀 Деплой на Railway

### 1. Подготовка

```bash
# Убедитесь что проект собирается
npm run build

# Проверьте что все тесты проходят
npm test
```

### 2. Создание проекта на Railway

1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Выберите папку `assistant-gate-bot`

### 3. Добавление PostgreSQL

1. В Railway dashboard: "Add Service" → "PostgreSQL"
2. Скопируйте `DATABASE_URL` из настроек PostgreSQL

### 4. Настройка переменных окружения

В Railway Variables добавьте все переменные из `.env.example`:

**Критически важные:**

- `TELEGRAM_BOT_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NODE_ENV=production`

**Каналы:**

- `CHANNEL_MAIN_USERNAME`
- `CHANNEL_MAIN_URL`
- `CHANNEL_MAIN_EMOJI`
- `CHANNEL_SECOND_USERNAME`
- `CHANNEL_SECOND_URL`
- `CHANNEL_SECOND_EMOJI`
- `PRIMARY_CHANNEL_ID`
- `INITIAL_CHANNEL_IDS`

### 5. Настройка Webhook

После деплоя добавьте:

```bash
WEBHOOK_URL=https://your-app.railway.app/telegram/webhook
```

### 6. Проверка деплоя

- ✅ Health check: `https://your-app.railway.app/health`
- ✅ Admin panel: `https://your-app.railway.app/admin/`
- ✅ Telegram bot отвечает на `/start`

## 🔒 Безопасность

### Реализованные меры

- **Rate Limiting**: 1000 req/15min глобально, 100 req/15min для админ API
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **Input Validation**: Глобальные validation pipes
- **Webhook Verification**: Проверка подписи Telegram
- **JWT Authentication**: Безопасная аутентификация админ панели
- **Error Sanitization**: Никаких чувствительных данных в ошибках

### Рекомендации

- Используйте сильные пароли для `ADMIN_PASSWORD`
- Регулярно обновляйте `JWT_SECRET`
- Мониторьте логи на подозрительную активность
- Обновляйте зависимости для устранения уязвимостей

## 📊 Мониторинг и логирование

### Логирование

- **Console**: Цветные логи для development
- **Files**: Структурированные JSON логи для production
- **Rotation**: Автоматическая ротация файлов логов
- **Levels**: Error, Warn, Info, Debug

### Health Check

```bash
curl https://your-app.railway.app/health
```

Возвращает:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0",
  "environment": "production"
}
```

## 🐛 Troubleshooting

### Частые проблемы

1. **Бот не отвечает**

   - Проверьте `TELEGRAM_BOT_TOKEN`
   - Убедитесь что webhook настроен
   - Проверьте логи Railway

2. **OpenAI не работает**

   - Проверьте `OPENAI_API_KEY`
   - Убедитесь в наличии средств на счету
   - Проверьте `OPENAI_ASSISTANT_ID`

3. **Админ панель не загружается**

   - Проверьте что статические файлы собраны: `npm run build:admin`
   - Убедитесь в правильности `JWT_SECRET`
   - Проверьте `ADMIN_USERNAME` и `ADMIN_PASSWORD`

4. **База данных недоступна**
   - Проверьте `DATABASE_URL`
   - Убедитесь что PostgreSQL сервис запущен в Railway
   - Проверьте что схема применена: `npx prisma db push`

### Логи

```bash
# Railway логи
railway logs --follow

# Локальные логи
tail -f logs/error.log
tail -f logs/combined.log
```

## 🤝 Разработка

### Добавление новых каналов

1. Добавьте переменные в `.env`:

   ```bash
   CHANNEL_THIRD_USERNAME=new_channel
   CHANNEL_THIRD_URL=https://t.me/new_channel
   CHANNEL_THIRD_EMOJI=🎉
   ```

2. Обновите `INITIAL_CHANNEL_IDS`:

   ```bash
   INITIAL_CHANNEL_IDS=@oh_my_zen,@avato_ai,@new_channel
   ```

3. Добавьте метод в `TelegramService`:
   ```typescript
   private getThirdChannelConfig() {
     return {
       username: this.configService.get<string>('CHANNEL_THIRD_USERNAME') || 'new_channel',
       url: this.configService.get<string>('CHANNEL_THIRD_URL') || 'https://t.me/new_channel',
       emoji: this.configService.get<string>('CHANNEL_THIRD_EMOJI') || '🎉',
       text: `${this.configService.get<string>('CHANNEL_THIRD_EMOJI') || '🎉'} ${this.configService.get<string>('CHANNEL_THIRD_USERNAME') || 'new_channel'}`,
     };
   }
   ```

### Структура коммитов

```bash
git commit -m "feat(telegram): добавить поддержку голосовых сообщений"
git commit -m "fix(admin): исправить пагинацию пользователей"
git commit -m "docs(readme): обновить инструкции по деплою"
```

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте [Troubleshooting](#-troubleshooting) секцию
2. Посмотрите логи в Railway dashboard
3. Убедитесь что все переменные окружения настроены правильно
4. Проверьте health endpoint: `/health`

---

**🎯 Проект готов к production деплою на Railway! 🚀**
