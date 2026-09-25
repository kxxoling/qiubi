import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/en";
import es from "@/i18n/es";
import ja from "@/i18n/ja";
import ko from "@/i18n/ko";
import pt from "@/i18n/pt";
import ru from "@/i18n/ru";
import zh from "@/i18n/zh";
import zhTW from "@/i18n/zh-TW";

/** All supported UI languages */
export type Locale = "en" | "zh" | "zh-TW" | "ru" | "ja" | "ko" | "es" | "pt";

/** Pick the UI language from a BCP-47 tag (navigator.language) */
export function detectLocale(lang: string | undefined): Locale {
  if (!lang) return "en";
  if (lang.startsWith("zh")) {
    // Traditional Chinese regions (TW/HK/MO) get zh-TW
    return /TW|HK|MO|Hant/i.test(lang) ? "zh-TW" : "zh";
  }
  for (const l of ["ru", "ja", "ko", "es", "pt"] as const) {
    if (lang.startsWith(l)) return l;
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    "zh-TW": { translation: zhTW },
    ru: { translation: ru },
    ja: { translation: ja },
    ko: { translation: ko },
    es: { translation: es },
    pt: { translation: pt },
  },
  lng: detectLocale(typeof navigator === "undefined" ? undefined : navigator.language),
  fallbackLng: "en",
  // All keys are flat (including natural text with separators like
  // "Encryption: Disable" and "help.dht"); disable separator parsing, otherwise
  // they'd be split into namespaces/nested keys and lookups would fail.
  // Each locale is a directory of per-feature modules (see src/i18n/<locale>/)
  // merged by its index.ts — the merged shape stays a flat dictionary
  keySeparator: false,
  nsSeparator: false,
  // Dictionaries use single-brace placeholders ({name}/{count}), not i18next's
  // default {{name}} — without these the placeholders render literally
  interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
});

export default i18n;
