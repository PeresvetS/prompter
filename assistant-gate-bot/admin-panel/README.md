# Admin Panel

Административная панель для управления пользователями Assistant Gate Bot.

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Скопируйте файл примера и настройте переменные:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:

```bash
# Для локальной разработки
VITE_API_BASE_URL=http://localhost:3000/admin

# Для production на Railway
# VITE_API_BASE_URL=https://your-app-name.railway.app/admin
```

### 3. Запуск в режиме разработки

```bash
npm run dev
```

### 4. Сборка для production

```bash
npm run build
```

## Переменные окружения

| Переменная          | Описание                    | Пример                        |
| ------------------- | --------------------------- | ----------------------------- |
| `VITE_API_BASE_URL` | Базовый URL для API бэкенда | `http://localhost:3000/admin` |

**Важно:** Все переменные для клиентской части должны начинаться с `VITE_` чтобы быть доступными в браузере.

## Деплой на Railway

1. Установите переменную окружения `VITE_API_BASE_URL` в настройках Railway
2. Укажите URL вашего бэкенда: `https://your-backend-app.railway.app/admin`
3. Выполните деплой

## Функциональность

- ✅ Аутентификация администратора
- ✅ Просмотр списка пользователей
- ✅ Поиск пользователей
- ✅ Бан/разбан пользователей
- ✅ Просмотр статистики запросов
- ✅ Пагинация

## Технологии

- React 18
- TypeScript
- Vite
- Axios
- CSS Modules
