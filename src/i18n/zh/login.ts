// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "登录",
  Username: "用户名",
  Password: "密码",
  "Remember password (auto sign-in)": "记住密码（自动登录）",
  Connect: "连接",
  Server: "服务器",
  "Leave empty for current origin": "留空则使用当前地址",
  "Server address must start with http:// or https://":
    "服务器地址需要以 http:// 或 https:// 开头（留空则使用当前地址）",
  "Login failed": "登录失败",
  "IP banned": "IP 因多次失败被禁",
  "Connecting...": "连接中...",
  "Connection failed": "连接失败",
  "LAN mode (no auth)": "局域网模式（无需认证）",
  "Session expired, please sign in again": "登录已过期，请重新登录",
  "Automatically signed in again": "已自动重新登录",
} satisfies Dictionary;
