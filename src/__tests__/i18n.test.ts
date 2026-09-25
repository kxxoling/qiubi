/**
 * Unit tests for i18n: placeholder interpolation across all locales, plus
 * structural invariants of the dictionary layout.
 *
 * The dictionaries use single-brace placeholders ({name}/{count}) while
 * i18next defaults to {{double braces}} — the custom prefix/suffix in
 * src/i18n/index.ts bridges that. These tests pin it down: without the
 * config, the placeholders render literally ("确认删除分类「{name}」？").
 *
 * The structural tests keep the per-locale module split (src/i18n/<locale>/)
 * healthy: every locale must cover the exact en key set, no key may live in
 * two modules (object spread would silently drop one), keys are always
 * English (a Chinese source key once leaked in and broke zh-TW), and
 * placeholder names must match across translations.
 */
import { beforeAll, describe, expect, test } from "vitest";
import i18n, { type Locale } from "@/i18n";
import en from "@/i18n/en";
import es from "@/i18n/es";
import ja from "@/i18n/ja";
import ko from "@/i18n/ko";
import pt from "@/i18n/pt";
import ru from "@/i18n/ru";
import zh from "@/i18n/zh";
import zhTW from "@/i18n/zh-TW";

const LOCALES: Locale[] = ["en", "zh", "zh-TW", "ru", "ja", "ko", "es", "pt"];
const DICTS: Record<Locale, Record<string, string>> = {
  en,
  zh,
  "zh-TW": zhTW,
  ru,
  ja,
  ko,
  es,
  pt,
};

describe("i18n placeholder interpolation", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  for (const lng of LOCALES) {
    test(`${lng}: {name} and {count} are interpolated, never literal`, async () => {
      await i18n.changeLanguage(lng);
      const category = i18n.t("Delete category confirm", { name: "movies" });
      expect(category).toContain("movies");
      expect(category).not.toContain("{name}");

      const count = i18n.t("Delete confirm", { count: 3 });
      expect(count).toContain("3");
      expect(count).not.toContain("{count}");
    });
  }
});

describe("i18n dictionary structure", () => {
  test("every locale covers the exact en key set (no missing, no extra)", () => {
    const enKeys = new Set(Object.keys(en));
    for (const lng of LOCALES) {
      const keys = Object.keys(DICTS[lng]);
      const missing = [...enKeys].filter((k) => !(k in DICTS[lng]));
      const extra = keys.filter((k) => !enKeys.has(k));
      expect(missing, `${lng} misses keys (add them to src/i18n/${lng}/)`).toEqual([]);
      expect(extra, `${lng} has keys unknown to en.ts`).toEqual([]);
    }
  });

  test("keys are always English — no CJK/Cyrillic script may leak into a key", () => {
    // matches Han, Kana, Hangul and Cyrillic ranges (… / → etc. stay allowed)
    const nonKeyScript = /[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/;
    for (const lng of LOCALES) {
      const bad = Object.keys(DICTS[lng]).filter((k) => nonKeyScript.test(k));
      expect(bad, `${lng} has non-English keys: ${bad.join(", ")}`).toEqual([]);
    }
  });

  test("no key is defined in two modules of the same locale (spread would drop one)", () => {
    // glob-imports every src/i18n/<locale>/<module>.ts (the merging index.ts
    // is excluded), so new modules are covered automatically
    const modules = import.meta.glob("../i18n/*/*.ts", { eager: true }) as Record<
      string,
      { default: Record<string, string> }
    >;
    expect(Object.keys(modules).length).toBeGreaterThan(0);

    const byLocale = new Map<string, Map<string, string[]>>();
    for (const [path, mod] of Object.entries(modules)) {
      if (path.endsWith("/index.ts")) continue;
      const locale = path.split("/")[2];
      const owners = byLocale.get(locale) ?? new Map<string, string[]>();
      byLocale.set(locale, owners);
      for (const key of Object.keys(mod.default)) {
        owners.set(key, [...(owners.get(key) ?? []), path]);
      }
    }
    for (const [locale, owners] of byLocale) {
      const dupes = [...owners.entries()].filter(([, paths]) => paths.length > 1);
      expect(dupes, `${locale} has duplicate keys across modules`).toEqual([]);
    }
  });

  test("translations keep the en placeholder names ({name}/{count}/...)", () => {
    const placeholders = (s: string) => (s.match(/\{[^}]+\}/g) ?? []).sort();
    for (const [key, enValue] of Object.entries(en)) {
      const expected = placeholders(enValue);
      if (expected.length === 0) continue;
      for (const lng of LOCALES) {
        expect(placeholders(DICTS[lng][key]), `${lng} "${key}"`).toEqual(expected);
      }
    }
  });
});
