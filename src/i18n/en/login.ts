// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "Login",
  Username: "Username",
  Password: "Password",
  "Remember password (auto sign-in)": "Remember password (auto sign-in)",
  Connect: "Connect",
  Server: "Server",
  "Leave empty for current origin": "Leave empty for current origin",
  "Server address must start with http:// or https://":
    "Server address must start with http:// or https:// (leave empty to use the current origin)",
  "Login failed": "Login failed",
  "IP banned": "IP banned for too many failed login attempts",
  "Connecting...": "Connecting...",
  "Connection failed": "Connection failed",
  "LAN mode (no auth)": "LAN mode (no auth)",
  "Session expired, please sign in again": "Session expired, please sign in again",
  "Automatically signed in again": "Automatically signed in again",
} satisfies Dictionary;
