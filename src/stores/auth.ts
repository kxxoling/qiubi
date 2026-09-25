/**
 * Local storage of login credentials ("remember password")
 *
 * Purpose: automatic re-login on session expiry + autofill on the login page.
 * Only base64-encoded to avoid being plainly readable — this is not encryption,
 * matching the credential-storage security model of the qBT desktop client.
 * Suitable for personal deployments / intranets; do not enable on shared devices.
 */
const STORAGE_KEY = "qiubi-auth";

export type SavedAuth = {
  username: string;
  password: string;
  /** Backend address saved with the login, so LAN-bypass connections
   *  (no password) can be restored automatically on the next visit */
  baseUrl?: string;
};

export function getSavedAuth(): SavedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(atob(raw)) as SavedAuth;
    if (typeof parsed?.username !== "string" || typeof parsed?.password !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSavedAuth(auth: SavedAuth): void {
  try {
    localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(auth)));
  } catch {
    // Silently skip when localStorage is unavailable
  }
}

export function clearSavedAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
