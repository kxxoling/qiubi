import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n, { detectLocale, type Locale } from "@/i18n";

type ConnectionState = "disconnected" | "connecting" | "connected" | "auth_bypass";

/** Color theme (orthogonal to Dark/Light), maps to the [data-theme] variable
 *  groups in globals.css.
 *  Grayscale families are trimmed to zinc+slate; near-duplicate hues were
 *  primary and the softest look; colored families use the official shadcn
 *  palettes with medium saturation. */
export const COLOR_THEMES = [
  "zinc",
  "blue",
  "emerald",
  "orange",
  "rose",
  "yellow",
  "solarized",
  "catppuccin",
  "nord",
  "rosepine",
  "gruvbox",
  "moegi",
  "dracula",
] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

type AppState = {
  baseUrl: string;
  /** UI language (independent of the locale in qBT preferences) */
  locale: Locale;
  /** Light/dark mode */
  theme: "light" | "dark" | "system";
  /** Color theme */
  colorTheme: ColorTheme;
  connectionState: ConnectionState;
  setBaseUrl: (url: string) => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setColorTheme: (theme: ColorTheme) => void;
  setConnectionState: (state: ConnectionState) => void;
};

/** Apply light/dark mode + color theme to <html> (dark class + data-theme attribute) */
/** Pick the initial UI language from the browser language */
function detectInitialLocale(): Locale {
  return detectLocale(typeof navigator === "undefined" ? undefined : navigator.language);
}

function applyDomTheme(theme: "light" | "dark" | "system", colorTheme: ColorTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(system ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }
  root.dataset.theme = colorTheme;
}

/** baseUrl only allows two valid values: an empty string (same-origin/proxy) or a
 *  full http(s):// address. If a username etc. is mistakenly entered into the Server
 *  field, requests hit /admin/api/... and get answered with index.html by the SPA
 *  fallback, silently turning every API response into HTML — so always reset to
 *  empty when restoring persisted state. */
function sanitizeBaseUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(s) ? s : "";
}

/* Fix a dirty baseUrl in persisted state before creating the store (synchronous
 * hydration happens inside create(); referencing useAppStore in the
 * onRehydrateStorage callback would fail due to TDZ, so handle it here) */
if (typeof localStorage !== "undefined") {
  try {
    const raw = localStorage.getItem("qiubi-settings");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { baseUrl?: string } };
      const clean = sanitizeBaseUrl(parsed.state?.baseUrl);
      if (parsed.state && parsed.state.baseUrl !== clean) {
        console.warn(
          "[qiubi] persisted baseUrl is invalid (%o); resetting to same-origin mode",
          parsed.state.baseUrl,
        );
        parsed.state.baseUrl = clean;
        localStorage.setItem("qiubi-settings", JSON.stringify(parsed));
      }
    }
  } catch {
    // Silently pass on corrupted persisted data; zustand persist falls back to defaults
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      baseUrl: "",
      locale: detectInitialLocale(),
      theme: "system",
      colorTheme: "blue",
      connectionState: "disconnected",
      setBaseUrl: (url) => set({ baseUrl: url }),
      setLocale: (locale) => {
        set({ locale });
        // Switch i18n language immediately (dynamic import avoids circular dependency)
        void i18n.changeLanguage(locale);
      },
      setTheme: (theme) => {
        set({ theme });
        applyDomTheme(theme, get().colorTheme);
      },
      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        applyDomTheme(get().theme, colorTheme);
      },
      setConnectionState: (connectionState) => set({ connectionState }),
    }),
    {
      name: "qiubi-settings",
      // Re-apply the theme to the DOM after persisted state is restored
      // (otherwise a refresh loses the dark class / data-theme)
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migration: a persisted theme removed from COLOR_THEMES falls back
          // to the default (prevents a data-theme value with no CSS rules)
          if (!COLOR_THEMES.includes(state.colorTheme)) {
            state.colorTheme = "blue";
          }
          applyDomTheme(state.theme, state.colorTheme);
          if (state.locale) {
            void i18n.changeLanguage(state.locale);
          }
        }
      },
    },
  ),
);

// Follow the OS color scheme live while in "system" mode
// (without this, switching the OS theme only took effect on reload)
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const { theme, colorTheme } = useAppStore.getState();
    if (theme === "system") applyDomTheme("system", colorTheme);
  });
}
