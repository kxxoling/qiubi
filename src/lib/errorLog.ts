/**
 * Persistent client-side error log.
 *
 * Failures used to vanish with a page reload (console cleared), making
 * "it worked after refreshing" bugs impossible to diagnose afterwards.
 * This module keeps a small ring buffer of recent errors in localStorage
 * so they survive reloads, and mirrors everything to the console.
 *
 * Inspect from the console anytime: window.__qiubiErrors()
 */

const STORAGE_KEY = "qiubi-error-log";
const MAX_ENTRIES = 100;
const MAX_TEXT = 600;

export type ErrorLogEntry = {
  time: string;
  scope: string;
  message: string;
  detail?: string;
};

function toText(v: unknown): string {
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function clip(s: string): string {
  return s.length > MAX_TEXT ? `${s.slice(0, MAX_TEXT)}…` : s;
}

function readStorage(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: ErrorLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Quota exceeded / private mode: console mirror below still happened
  }
}

/** Record an error (also mirrors to console.error with a colored prefix) */
export function logError(scope: string, error: unknown, detail?: unknown): void {
  const entry: ErrorLogEntry = {
    time: new Date().toISOString(),
    scope,
    message: clip(toText(error)),
    detail: detail === undefined ? undefined : clip(toText(detail)),
  };
  console.error(
    "%c[qiubi]",
    "color:#ef4444;font-weight:bold",
    `[${entry.scope}] ${entry.message}`,
    detail ?? "",
  );
  writeStorage([...readStorage(), entry]);
}

/** Persist without console output — for layers that already print their own logs */
export function appendErrorLog(scope: string, parts: unknown[]): void {
  const [first, ...rest] = parts;
  const entry: ErrorLogEntry = {
    time: new Date().toISOString(),
    scope,
    message: clip(toText(first)),
    detail: rest.length ? clip(rest.map(toText).join(" ")) : undefined,
  };
  writeStorage([...readStorage(), entry]);
}

/** Recent errors, oldest first (survives page reloads) */
export function getErrorLog(): ErrorLogEntry[] {
  return readStorage();
}

export function clearErrorLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Capture crash-level errors (render crashes, unhandled async rejections —
 * e.g. a button handler whose awaited API call failed silently).
 * Call once at app bootstrap, before rendering.
 */
export function installGlobalErrorLog(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => {
    logError("window", e.error ?? e.message, e.filename ? `${e.filename}:${e.lineno}` : undefined);
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError("unhandled", e.reason);
  });
  (window as unknown as { __qiubiErrors: () => ErrorLogEntry[] }).__qiubiErrors = getErrorLog;
}
