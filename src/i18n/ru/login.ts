// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "Вход",
  Username: "Имя пользователя",
  Password: "Пароль",
  "Remember password (auto sign-in)": "Запомнить пароль (автовход)",
  Connect: "Подключиться",
  Server: "Сервер",
  "Leave empty for current origin": "Оставьте пустым для текущего адреса",
  "Server address must start with http:// or https://":
    "Адрес должен начинаться с http:// или https:// (пусто = текущий адрес)",
  "Login failed": "Не удалось войти",
  "IP banned": "IP заблокирован из-за слишком многих неудачных попыток входа",
  "Connecting...": "Подключение...",
  "Connection failed": "Сбой подключения",
  "LAN mode (no auth)": "Режим локальной сети (без авторизации)",
  "Session expired, please sign in again": "Сессия истекла, войдите снова",
  "Automatically signed in again": "Автоматический повторный вход выполнен",
} satisfies Dictionary;
