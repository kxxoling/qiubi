// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "Iniciar sesión",
  Username: "Usuario",
  Password: "Contraseña",
  "Remember password (auto sign-in)": "Recordar contraseña (inicio de sesión automático)",
  Connect: "Conectar",
  Server: "Servidor",
  "Leave empty for current origin": "Vacío para usar el origen actual",
  "Server address must start with http:// or https://":
    "La dirección del servidor debe empezar por http:// o https:// (vacío para usar el origen actual)",
  "Login failed": "Error de inicio de sesión",
  "IP banned": "IP bloqueada por demasiados intentos fallidos",
  "Connecting...": "Conectando...",
  "Connection failed": "Error de conexión",
  "LAN mode (no auth)": "Modo LAN (sin autenticación)",
  "Session expired, please sign in again": "La sesión ha caducado; inicia sesión de nuevo",
  "Automatically signed in again": "Sesión reiniciada automáticamente",
} satisfies Dictionary;
