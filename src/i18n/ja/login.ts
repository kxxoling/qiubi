// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "ログイン",
  Username: "ユーザー名",
  Password: "パスワード",
  "Remember password (auto sign-in)": "パスワードを記憶（自動ログイン）",
  Connect: "接続",
  Server: "サーバー",
  "Leave empty for current origin": "空欄で現在のアドレスを使用",
  "Server address must start with http:// or https://":
    "サーバーアドレスは http:// または https:// で始める必要があります(空欄で現在のアドレスを使用)",
  "Login failed": "ログインに失敗しました",
  "IP banned": "ログイン失敗が多すぎるため IP が一時的に禁止されました",
  "Connecting...": "接続中...",
  "Connection failed": "接続に失敗しました",
  "LAN mode (no auth)": "LAN モード(認証なし)",
  "Session expired, please sign in again": "セッションが期限切れです。再度サインインしてください",
  "Automatically signed in again": "自動的に再サインインされました",
} satisfies Dictionary;
