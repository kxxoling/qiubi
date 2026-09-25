/**
 * Unit tests for the pure helpers extracted during the module splits:
 * torrent filtering (URL-driven filters + sentinel values), command-palette
 * mode parsing, local torrent filtering, and log level mapping.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { filterLocalTorrents } from "@/components/command-palette/localTorrents";
import { buildCommandItems } from "@/components/command-palette/pageActions";
import { parseMode } from "@/components/command-palette/searchMode";
import type { Locale } from "@/i18n";
import { getLevelLabel, levelConfig } from "@/pages/log/utils";
import { useFilteredTorrents } from "@/pages/torrents/useFilteredTorrents";
import type { TorrentInfo } from "@/types/qbt";

// ─── useFilteredTorrents (URL-driven filters + sentinel values) ───

const t = (over: Partial<TorrentInfo>): TorrentInfo =>
  ({
    hash: over.name ?? Math.random().toString(36).slice(2),
    name: "t",
    state: "downloading",
    category: "",
    tags: "",
    tracker: "",
    ...over,
  }) as TorrentInfo;

const TORRENTS = [
  t({
    name: "ubuntu",
    state: "downloading",
    category: "iso",
    tags: "linux",
    tracker: "https://tracker.a.org/ann",
  }),
  t({
    name: "sintel",
    state: "uploading",
    category: "movie",
    tags: "anime, hd",
    tracker: "https://tracker.b.org/ann",
  }),
  t({ name: "orphan", state: "stalledDL", category: "", tags: "", tracker: "" }),
];

const filter = (filters: Partial<Parameters<typeof useFilteredTorrents>[1]>) =>
  renderHook(() =>
    useFilteredTorrents(TORRENTS, {
      search: "",
      status: "all",
      category: "",
      tag: "",
      tracker: "",
      ...filters,
    }),
  ).result.current;

describe("useFilteredTorrents", () => {
  test("empty filters return everything", () => {
    expect(filter({})).toHaveLength(3);
  });

  test("keyword is case-insensitive substring", () => {
    expect(filter({ search: "UBU" }).map((x) => x.name)).toEqual(["ubuntu"]);
  });

  test("category filter + __uncategorized__ sentinel", () => {
    expect(filter({ category: "iso" }).map((x) => x.name)).toEqual(["ubuntu"]);
    expect(filter({ category: "__uncategorized__" }).map((x) => x.name)).toEqual(["orphan"]);
  });

  test("tag filter matches any tag; __untagged__ sentinel", () => {
    expect(filter({ tag: "hd" }).map((x) => x.name)).toEqual(["sintel"]);
    expect(filter({ tag: "__untagged__" }).map((x) => x.name)).toEqual(["orphan"]);
  });

  test("tracker filter matches hostname; __none__ sentinel covers trackerless", () => {
    expect(filter({ tracker: "tracker.b.org" }).map((x) => x.name)).toEqual(["sintel"]);
    expect(filter({ tracker: "__none__" }).map((x) => x.name)).toEqual(["orphan"]);
  });
});

// ─── command palette: parseMode prefix dispatch ───

describe("parseMode", () => {
  test.each([
    ["/pause", "command", "pause"],

    ["@sintel", "local", "sintel"],
    [">settings", "nav", "settings"],
    ["ubuntu iso", "mixed", "ubuntu iso"],
  ])("%s → %s(%s)", (input, mode, query) => {
    expect(parseMode(input)).toEqual({ mode, query });
  });

  test("# is temporarily disabled — falls through to mixed", () => {
    expect(parseMode("#ubuntu")).toEqual({ mode: "mixed", query: "#ubuntu" });
  });
});

// ─── command palette: local torrent filter ───

describe("filterLocalTorrents", () => {
  test("empty query returns all; query is case-insensitive", () => {
    expect(filterLocalTorrents(TORRENTS, "")).toHaveLength(3);
    expect(filterLocalTorrents(TORRENTS, "UBU")).toHaveLength(1);
    expect(filterLocalTorrents(TORRENTS, "zzz")).toHaveLength(0);
  });
});

// ─── command palette: language switch commands ───

describe("buildCommandItems language commands", () => {
  const opts = (locale: Locale) =>
    ({
      t: ((k: string) => k) as Parameters<typeof buildCommandItems>[0]["t"],
      theme: "light" as const,
      locale,
      sidebarVisible: true,
      statusBarVisible: true,
      setLocale: () => {},
      toggleSidebar: () => {},
      toggleStatusBar: () => {},
      toggleTheme: () => {},
      toggleAltSpeed: async () => {},
      navigate: () => {},
      close: () => {},
    }) as Parameters<typeof buildCommandItems>[0];

  test("one command per language except the current one", () => {
    const ids = buildCommandItems(opts("zh"))
      .map((c) => c.id)
      .filter((id) => id.startsWith("language-"));
    expect(ids).toEqual([
      "language-en",
      "language-zh-TW",
      "language-ru",
      "language-ja",
      "language-ko",
      "language-es",
      "language-pt",
    ]);
  });

  test("each new language covers english/native/chinese keyword aliases", () => {
    const byId = new Map(buildCommandItems(opts("en")).map((c) => [c.id, c]));
    const expectations: Record<string, string[]> = {
      "language-ru": ["russian", "русский", "俄语"],
      "language-ja": ["japanese", "日本語", "日语"],
      "language-ko": ["korean", "한국어", "韩语"],
      "language-es": ["spanish", "español", "西班牙语"],
      "language-pt": ["portuguese", "português", "葡萄牙语"],
    };
    for (const [id, kws] of Object.entries(expectations)) {
      expect(byId.get(id)?.keywords).toEqual(expect.arrayContaining(["language", ...kws]));
    }
  });

  test("every language keyword matches the '/'-mode keyword filter", () => {
    // mirrors CommandSection's filter: k.toLowerCase().includes(query)
    const en = buildCommandItems(opts("zh")).find((c) => c.id === "language-en");
    for (const q of ["english", "英文", "English"]) {
      expect(en?.keywords.some((k) => k.toLowerCase().includes(q.toLowerCase()))).toBe(true);
    }
  });
});

// ─── log utils: qBT type bitmask → level label ───

describe("getLevelLabel", () => {
  test("maps the qBT type bitmask (1/2/4/8)", () => {
    expect(getLevelLabel(1)).toBe("normal");
    expect(getLevelLabel(2)).toBe("info");
    expect(getLevelLabel(4)).toBe("warning");
    expect(getLevelLabel(8)).toBe("critical");
    expect(getLevelLabel(0)).toBe("normal"); // unknown falls back
  });

  test("levelConfig values are distinct powers of two", () => {
    const vals = Object.values(levelConfig).map((v) => v.value);
    expect(new Set(vals).size).toBe(4);
    expect(vals).toEqual(expect.arrayContaining([1, 2, 4, 8]));
  });
});
