// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "登入",
  Username: "使用者名稱",
  Password: "密碼",
  "Remember password (auto sign-in)": "記住密碼（自動登入）",
  Connect: "連線",
  Server: "伺服器",
  "Leave empty for current origin": "留空則使用當前位址",
  "Server address must start with http:// or https://":
    "伺服器地址需要以 http:// 或 https:// 開頭（留空則使用當前地址）",
  "Login failed": "登入失敗",
  "IP banned": "IP 因多次失敗被禁",
  "Connecting...": "連線中...",
  "Connection failed": "連線失敗",
  "LAN mode (no auth)": "區域網模式（無需認證）",
  "Session expired, please sign in again": "登入已過期，請重新登入",
  "Automatically signed in again": "已自動重新登入",
} satisfies Dictionary;
