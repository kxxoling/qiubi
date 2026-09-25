/**
 * Demo-mode seed data constraints — regressions capturing past pitfalls:
 * hashes must be pure hexadecimal (float-to-hex once introduced "." and caused
 * 404s on detail queries); primary keys must be unique (faker short random
 * string collisions silently evicted old entries and lost articles).
 */
import { describe, expect, test } from "vitest";
import { db } from "@/mocks/demo/models";
import { seedAll } from "@/mocks/demo/seed";

describe("demo seed data", () => {
  test("torrent hashes are 40-char lowercase hex", () => {
    seedAll();
    const torrents = db.torrent.getAll();
    expect(torrents.length).toBeGreaterThanOrEqual(14);
    for (const t of torrents) {
      expect(t.hash).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  test("primary keys are unique (articles/feeds/files)", () => {
    seedAll();
    const articleIds = db.article.getAll().map((a) => a.id);
    expect(new Set(articleIds).size).toBe(articleIds.length);
    const fileIds = db.file.getAll().map((f) => f.id);
    expect(new Set(fileIds).size).toBe(fileIds.length);
    expect(db.feed.getAll().length).toBe(3);
  });

  test("files reference existing torrents", () => {
    seedAll();
    const hashes = new Set(db.torrent.getAll().map((t) => t.hash));
    for (const f of db.file.getAll()) expect(hashes.has(f.torrentHash)).toBe(true);
  });

  test("seedAll is idempotent (safe to call twice)", () => {
    seedAll();
    const count = db.torrent.count();
    expect(() => seedAll()).not.toThrow();
    expect(db.torrent.count()).toBe(count);
  });
});
