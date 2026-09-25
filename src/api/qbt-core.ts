/**
 * qBittorrent API client
 *
 * Wraps all qBT Web API v2 endpoints with full type safety.
 * Supports cookie SID authentication and LAN password-free mode.
 *
 * ## Debug logging
 *
 * When troubleshooting against a real backend, run this in the browser console:
 *   localStorage.setItem("qbt-debug", "1")
 * Then reload the page to see each request's method/URL/status/duration,
 * plus key events such as login, 403, and LAN bypass. To disable:
 *   localStorage.removeItem("qbt-debug")
 */

import { appendErrorLog } from "@/lib/errorLog";
import type { AuthLoginParams } from "@/types/qbt";

type QbtConfig = {
  baseUrl: string;
};

/** Auth expiry triggered by 403 (SID expired or IP banned); used for unified redirect to the login page */
export class QbtAuthExpiredError extends Error {
  constructor(message = "Authentication required or IP banned") {
    super(message);
    this.name = "QbtAuthExpiredError";
  }
}

export class QbtCore {
  private baseUrl: string;
  private sid: string | null = null;
  private isAuthenticated = false;
  private isLocalAuthBypass = false;

  /** SID persistence key: restores the session after page refresh to avoid repeated logins (cleared on logout) */
  private static readonly SID_STORAGE_KEY = "qiubi-sid";

  /** Whether a session was ever held during this page lifecycle (logged in or restored from storage).
   *  Distinguishes "session expired" (prompt to re-login) from "never logged in" (silent redirect to login page). */
  private everAuthenticated = false;

  /** Debug logging switch (enabled when localStorage["qbt-debug"] === "1") */
  private debug = false;

  /** Callback fired on 403 auth expiry (registered by the App layer for unified redirect to the login page) */
  onAuthExpired: (() => void) | null = null;

  /**
   * Server major version (4 or 5), populated by detectVersion after login.
   * Affects: pause endpoints (4.x pause/resume vs 5.x stop/start), preference key names, etc.
   * When unknown, try as 5.x and fall back automatically.
   */
  private serverMajor = 0;

  /** Probed pause endpoint form: "stop" | "pause" | null (not probed yet) */
  private stopEndpoint: "stop" | "pause" | null = null;

  constructor(config?: Partial<QbtConfig>) {
    this.baseUrl = config?.baseUrl ?? "";
    // Read the localStorage switch in jsdom / browser environments; skip in Node
    try {
      if (globalThis.localStorage?.getItem("qbt-debug") === "1") {
        this.debug = true;
      }
      // Restore the previous session: if the SID is still valid, no login needed; if expired,
      // the first request returns 403 and the App layer's auto re-login / login page handles it
      const savedSid = globalThis.localStorage?.getItem(QbtCore.SID_STORAGE_KEY);
      if (savedSid) {
        this.sid = savedSid;
        this.isAuthenticated = true;
        this.everAuthenticated = true;
      }
    } catch {
      // Ignore when localStorage is unavailable (e.g. non-browser environment)
    }
    if (this.debug) {
      console.info(
        "%c[QBT]%c debug logging enabled (localStorage['qbt-debug']='1')",
        "color:#22c55e;font-weight:bold",
        "",
      );
    }
  }

  /** Manually toggle debug logging */
  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  protected log(...args: unknown[]) {
    if (this.debug) console.info("%c[QBT]", "color:#22c55e;font-weight:bold", ...args);
  }

  protected logError(...args: unknown[]) {
    // Error logs are always emitted so failures are directly visible in the console when integrating with a real backend
    console.error("%c[QBT]", "color:#ef4444;font-weight:bold", ...args);
    // Also persist (localStorage ring buffer) so failures survive a page reload
    appendErrorLog("api", args);
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    this.sid = null;
    this.isAuthenticated = false;
    this.isLocalAuthBypass = false;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated || this.isLocalAuthBypass;
  }

  protected async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v2${path}`;
    const method = options.method ?? "GET";
    const headers = new Headers(options.headers as Record<string, string>);

    if (this.sid) {
      // sid stores the full cookie pair (e.g. "QBT_SID_18080=xxx");
      // qBT 5.x appends a port suffix to the cookie name when deployed on a non-default port
      headers.set("Cookie", this.sid);
    }

    // Log the request method and full URL (including query). Never log the body to avoid leaking credentials.
    this.log(`→ ${method} ${url}`);

    const startedAt = performance.now();
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch (e) {
      // Network-level failure: backend not running / proxy unreachable / DNS resolution failed, etc.
      this.logError(
        `✗ ${method} ${url} network error (backend unreachable or proxy misconfigured):`,
        e,
      );
      throw e;
    }
    const elapsed = Math.round(performance.now() - startedAt);

    this.log(`← ${method} ${path} ${response.status} (${elapsed}ms)`);

    if (response.status === 403) {
      this.isAuthenticated = false;
      this.sid = null;
      this.persistSid();
      this.logError(
        `403 ${path}: auth expired (SID too old) or IP temporarily banned (qBT brute-force protection, 1h by default). ` +
          "Sign in again; if 403 persists, restart qBittorrent to clear the ban.",
      );
      this.onAuthExpired?.();
      throw new QbtAuthExpiredError();
    }

    if (!response.ok) {
      // Non-2xx and not 403: read the response body to help diagnose (qBT often puts the reason in the body)
      let detail = "";
      try {
        detail = (await response.text()).slice(0, 200);
      } catch {
        // Ignore read failure
      }
      this.logError(`✗ ${method} ${url} ${response.status} ${response.statusText}`, detail);
      throw new Error(`qBT API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/html")) {
      // 200 but received HTML: the request hit the SPA fallback / reverse proxy page instead of the qBT API.
      // Typical cause: the login page's Server field was misfilled (e.g. with a username), making baseUrl an invalid path.
      this.logError(
        `✗ ${method} ${url} returned HTML instead of an API response (baseUrl=${this.baseUrl || "same-origin"})`,
      );
      throw new Error(
        "qBT API returned HTML instead of data: check the server address on the login page (empty = current origin)",
      );
    }
    if (contentType?.includes("application/json")) {
      return response.json() as Promise<T>;
    }
    return response.text() as unknown as T;
  }

  // --- Auth ---
  async login(params: AuthLoginParams): Promise<void> {
    const body = new URLSearchParams();
    body.set("username", params.username);
    body.set("password", params.password);

    this.log(`→ POST ${this.baseUrl}/api/v2/auth/login (user: ${params.username})`);
    const response = await fetch(`${this.baseUrl}/api/v2/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      credentials: "include",
    });

    if (response.status === 403) {
      this.logError(
        "Login returned 403: too many failed attempts, IP temporarily banned by qBittorrent (1h by default). " +
          "Restart qBittorrent to lift the ban immediately.",
      );
      throw new Error("IP banned for too many failed login attempts");
    }

    if (!response.ok) {
      this.logError(
        `Login failed: HTTP ${response.status}. Common cause: wrong username/password (defaults to admin/adminadmin).`,
      );
      throw new Error("Login failed");
    }

    // On successful login qBT sends the session cookie via Set-Cookie. The cookie name is SID on the default port
    // and QBT_SID_<port> on a non-default port (e.g. :18080). In browsers Set-Cookie is not readable by JS —
    // that is normal; credentials:"include" lets the browser attach the cookie automatically.
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = /((?:QBT_SID[^=]*|SID)=[^;]+)/.exec(setCookie);
      if (match) {
        this.sid = match[1];
        this.log(`extracted session cookie from Set-Cookie (${match[1].split("=")[0]})`);
      }
    } else {
      this.log(
        "No Set-Cookie header exposed (normal in browsers); relying on credentials:include to send the cookie",
      );
    }

    this.isAuthenticated = true;
    this.everAuthenticated = true;
    this.persistSid();
    this.log("login successful");
  }

  /** Whether the user has logged in / held a session during this page lifecycle (distinguishes "expired" from "never logged in") */
  hasEverAuthenticated(): boolean {
    return this.everAuthenticated;
  }

  /** Write/clear the SID in localStorage (browser environment); pass null on logout */
  private persistSid() {
    try {
      if (this.sid) {
        globalThis.localStorage?.setItem(QbtCore.SID_STORAGE_KEY, this.sid);
      } else {
        globalThis.localStorage?.removeItem(QbtCore.SID_STORAGE_KEY);
      }
    } catch {
      // Ignore in environments without localStorage
    }
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout");
    this.sid = null;
    this.isAuthenticated = false;
    this.isLocalAuthBypass = false;
    this.persistSid();
  }

  /** Server major version (4/5); returns 0 when detection fails (treated as 5.x with automatic fallback) */
  getServerMajor(): number {
    return this.serverMajor;
  }

  /** Call after successful login: reads the version number to adapt to 4.x/5.x differences */
  async detectVersion(): Promise<number> {
    try {
      const v = await this.request<string>("/app/version");
      const match = /v?(\d+)\./.exec(v ?? "");
      this.serverMajor = match ? Number(match[1]) : 0;
      this.log(`server version: ${v} (major=${this.serverMajor})`);
    } catch {
      this.serverMajor = 0;
    }
    return this.serverMajor;
  }

  /**
   * Pause/resume endpoint auto-adaptation:
   * qBT 5.x removed /torrents/pause and /resume in favor of /torrents/stop and /start;
   * 4.x (≤4.6.7) only has pause/resume. Request per the known version first; on 404, automatically
   * switch to the other set and cache the result.
   */
  protected async postStopOrStart(hashes: string[], action: "stop" | "start"): Promise<void> {
    const prefers5 = this.stopEndpoint ? this.stopEndpoint === "stop" : this.serverMajor !== 4;
    const primary = prefers5 ? action : action === "stop" ? "pause" : "resume";
    const fallback = prefers5 ? (action === "stop" ? "pause" : "resume") : action;

    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    const send = (endpoint: string) =>
      this.request(`/torrents/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

    try {
      await send(primary);
      this.stopEndpoint = prefers5 ? "stop" : "pause";
    } catch (e) {
      if (fallback !== primary && e instanceof Error && e.message.includes("404")) {
        this.log(
          `/${primary} 404, falling back to /${fallback} (qBT 4.x and 5.x endpoints differ)`,
        );
        await send(fallback);
        this.stopEndpoint = prefers5 ? "pause" : "stop";
      } else {
        throw e;
      }
    }
  }

  /** Detect LAN password-free mode (login is skipped when qBT enables "bypass authentication for clients on localhost") */
  async checkLocalAuthBypass(): Promise<boolean> {
    // On the extension origin there is no same-origin qBT to probe — trying
    // only produces a "Failed to fetch" error; the login page (with its
    // Server field) is the right next step
    if (typeof location !== "undefined" && location.protocol === "chrome-extension:") {
      return false;
    }
    // A failed probe (403) only means "normal login required", not "session expired".
    // Temporarily detach the global callback so an anonymous first visit isn't misreported as "login expired".
    const prev = this.onAuthExpired;
    this.onAuthExpired = null;
    try {
      await this.request<string>("/app/version");
      this.isLocalAuthBypass = true;
      this.log("LAN no-auth mode: /app/version accessible without login");
      return true;
    } catch (e) {
      this.log(
        "LAN no-auth probe failed (normal login required):",
        e instanceof Error ? e.message : e,
      );
      return false;
    } finally {
      this.onAuthExpired = prev;
    }
  }
}
