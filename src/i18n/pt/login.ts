// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "Entrar",
  Username: "Usuário",
  Password: "Senha",
  "Remember password (auto sign-in)": "Lembrar senha (login automático)",
  Connect: "Conectar",
  Server: "Servidor",
  "Leave empty for current origin": "Vazio para usar a origem atual",
  "Server address must start with http:// or https://":
    "O endereço do servidor deve começar com http:// ou https:// (vazio para usar a origem atual)",
  "Login failed": "Falha no login",
  "IP banned": "IP bloqueado por muitas tentativas de login",
  "Connecting...": "Conectando...",
  "Connection failed": "Falha de conexão",
  "LAN mode (no auth)": "Modo LAN (sem autenticação)",
  "Session expired, please sign in again": "A sessão expirou; entre novamente",
  "Automatically signed in again": "Conectado novamente automaticamente",
} satisfies Dictionary;
