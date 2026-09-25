// Login page — sign-in form, connection errors, session expiry.
import type { Dictionary } from "@/i18n/types";

export default {
  Login: "로그인",
  Username: "사용자 이름",
  Password: "비밀번호",
  "Remember password (auto sign-in)": "비밀번호 기억 (자동 로그인)",
  Connect: "연결",
  Server: "서버",
  "Leave empty for current origin": "비워 두면 현재 주소를 사용",
  "Server address must start with http:// or https://":
    "서버 주소는 http:// 또는 https://로 시작해야 합니다(비워 두면 현재 주소 사용)",
  "Login failed": "로그인에 실패했습니다",
  "IP banned": "로그인 실패가 너무 많아 IP가 차단되었습니다",
  "Connecting...": "연결 중...",
  "Connection failed": "연결 실패",
  "LAN mode (no auth)": "LAN 모드(인증 없음)",
  "Session expired, please sign in again": "세션이 만료되었습니다. 다시 로그인해 주세요",
  "Automatically signed in again": "자동으로 다시 로그인되었습니다",
} satisfies Dictionary;
