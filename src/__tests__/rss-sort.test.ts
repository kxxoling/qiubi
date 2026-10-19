/**
 * sortArticles — the display order shared by the RSS article table and the
 * j/k keyboard nav. Covers the three sortable columns and both date formats
 * qBT returns (5.x formatted strings, 4.x epoch-second numbers).
 */
import { describe, expect, test } from "vitest";
import { buildArticle } from "@/__tests__/factories";
import { sortArticles } from "@/pages/rss/ArticleList";

describe("sortArticles", () => {
  test("date desc: newest first", () => {
    const out = sortArticles(
      [
        buildArticle({ id: "old", date: "17 May 2026 08:00:00 +0000" }),
        buildArticle({ id: "new", date: "18 May 2026 10:00:00 +0000" }),
      ],
      { key: "date", dir: "desc" },
    );
    expect(out.map((a) => a.id)).toEqual(["new", "old"]);
  });

  test("epoch-second numbers (qBT 4.x) sort as seconds, not milliseconds", () => {
    const out = sortArticles(
      [
        buildArticle({ id: "old", date: 1_764_000_000 }),
        buildArticle({ id: "new", date: 1_765_000_000 }),
      ],
      { key: "date", dir: "desc" },
    );
    expect(out.map((a) => a.id)).toEqual(["new", "old"]);
  });

  test("status asc: unread first", () => {
    const out = sortArticles(
      [buildArticle({ id: "read", isRead: true }), buildArticle({ id: "unread", isRead: false })],
      { key: "isRead", dir: "asc" },
    );
    expect(out.map((a) => a.id)).toEqual(["unread", "read"]);
  });

  test("title asc: alphabetical, read state ignored", () => {
    const out = sortArticles(
      [
        buildArticle({ id: "b", title: "Beta" }),
        buildArticle({ id: "a", title: "Alpha", isRead: true }),
      ],
      { key: "title", dir: "asc" },
    );
    expect(out.map((a) => a.id)).toEqual(["a", "b"]);
  });

  test("unparseable dates sort as 0 instead of NaN-scrambling the order", () => {
    const out = sortArticles(
      [
        buildArticle({ id: "bad", date: "not a date" }),
        buildArticle({ id: "ok", date: "18 May 2026 10:00:00 +0000" }),
      ],
      { key: "date", dir: "desc" },
    );
    expect(out.map((a) => a.id)).toEqual(["ok", "bad"]);
  });
});
