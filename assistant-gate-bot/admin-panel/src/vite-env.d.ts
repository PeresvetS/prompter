/// <reference types="vite/client" />

/**
 * Интерфейс для переменных окружения в Vite приложении
 * Все переменные должны начинаться с VITE_ чтобы быть доступными в браузере
 */
interface ImportMetaEnv {
  /**
   * Базовый URL для API админ панели
   * @example "http://localhost:3000/admin" для разработки
   * @example "https://your-app.railway.app/admin" для production
   */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
