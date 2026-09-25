import { beforeEach, describe, expect, test, vi } from "vitest";
import { matchStatus, STATUS_OPTIONS } from "@/lib/torrentStatus";
import { clearSavedAuth, getSavedAuth, saveSavedAuth } from "@/stores/auth";
import type { TorrentState } from "@/types/qbt";

/**
 * Core module unit tests — status matching / credential storage / normalizeLink
 */

// ─── matchStatus: 12 filters × key torrent states ───

describe("matchStatus", () => {
  const cases: { filter: string; state: TorrentState; expected: boolean }[] = [
    // all
    { filter: "all", state: "downloading", expected: true },
    { filter: "all", state: "error", expected: true },
    // downloading
    { filter: "downloading", state: "downloading", expected: true },
    { filter: "downloading", state: "stalledDL", expected: true },
    { filter: "downloading", state: "metaDL", expected: true },
    { filter: "downloading", state: "forcedDL", expected: true },
    { filter: "downloading", state: "queuedDL", expected: true },
    { filter: "downloading", state: "uploading", expected: false },
    { filter: "downloading", state: "pausedDL", expected: false },
    // seeding
    { filter: "seeding", state: "uploading", expected: true },
    { filter: "seeding", state: "stalledUP", expected: true },
    { filter: "seeding", state: "forcedUP", expected: true },
    { filter: "seeding", state: "downloading", expected: false },
    // completed
    { filter: "completed", state: "uploading", expected: true },
    { filter: "completed", state: "stalledUP", expected: true },
    { filter: "completed", state: "pausedUP", expected: true },
    { filter: "completed", state: "stoppedUP", expected: true },
    { filter: "completed", state: "downloading", expected: false },
    // resumed
    { filter: "resumed", state: "downloading", expected: true },
    { filter: "resumed", state: "uploading", expected: true },
    { filter: "resumed", state: "pausedDL", expected: false },
    { filter: "resumed", state: "stoppedUP", expected: false },
    // paused
    { filter: "paused", state: "pausedDL", expected: true },
    { filter: "paused", state: "stoppedDL", expected: true },
    { filter: "paused", state: "pausedUP", expected: true },
    { filter: "paused", state: "downloading", expected: false },
    // active
    { filter: "active", state: "downloading", expected: true },
    { filter: "active", state: "uploading", expected: true },
    { filter: "active", state: "metaDL", expected: true },
    { filter: "active", state: "stalledDL", expected: false },
    { filter: "active", state: "pausedDL", expected: false },
    // inactive
    { filter: "inactive", state: "stalledDL", expected: true },
    { filter: "stalled", state: "stalledDL", expected: true },
    { filter: "stalled", state: "stalledUP", expected: true },
    { filter: "stalled", state: "downloading", expected: false },
    { filter: "inactive", state: "pausedDL", expected: true },
    { filter: "inactive", state: "downloading", expected: false },
    // pausedUP
    { filter: "pausedUP", state: "pausedUP", expected: true },
    { filter: "pausedUP", state: "stoppedUP", expected: true },
    { filter: "pausedUP", state: "pausedDL", expected: false },
    // pausedDL
    { filter: "pausedDL", state: "pausedDL", expected: true },
    { filter: "pausedDL", state: "stoppedDL", expected: true },
    { filter: "pausedDL", state: "pausedUP", expected: false },
    // checking
    { filter: "checking", state: "checkingDL", expected: true },
    { filter: "checking", state: "checkingUP", expected: true },
    { filter: "checking", state: "checkingResumeData", expected: true },
    { filter: "checking", state: "downloading", expected: false },
    // error
    { filter: "error", state: "error", expected: true },
    { filter: "error", state: "missingFiles", expected: true },
    { filter: "error", state: "downloading", expected: false },
  ];

  test.each(cases)("$filter ↔ $state → $expected", ({ filter, state, expected }) => {
    expect(matchStatus(state, filter)).toBe(expected);
  });

  test("unknown filter returns true (acts as all)", () => {
    expect(matchStatus("downloading", "nonexistent")).toBe(true);
  });

  test("STATUS_OPTIONS has 13 entries matching qBT", () => {
    expect(STATUS_OPTIONS).toHaveLength(13);
  });
});

// ─── normalizeLink (AddTorrentDialog internal function, extracted for isolated testing) ───

describe("normalizeLink", () => {
  // Implementation copied from AddTorrentDialog (pure-function test)
  function normalizeLink(line: string): string | null {
    const s = line.trim();
    if (!s) return null;
    if (/^(magnet:|https?:\/\/)/i.test(s)) return s;
    if (/^[a-f0-9]{40}$/i.test(s) || /^[a-z2-7]{32}$/i.test(s)) {
      return `magnet:?xt=urn:btih:${s}`;
    }
    return s;
  }

  test("empty line returns null", () => {
    expect(normalizeLink("")).toBeNull();
    expect(normalizeLink("   ")).toBeNull();
  });

  test("magnet passes through unchanged", () => {
    const magnet = "magnet:?xt=urn:btih:abcdef1234567890abcdef1234567890abcdef12";
    expect(normalizeLink(magnet)).toBe(magnet);
  });

  test("http URL passes through unchanged", () => {
    expect(normalizeLink("https://example.com/file.torrent")).toBe(
      "https://example.com/file.torrent",
    );
  });

  test("40-char hex infohash wraps in magnet", () => {
    const hash = "abcdef1234567890abcdef1234567890abcdef12";
    expect(normalizeLink(hash)).toBe(`magnet:?xt=urn:btih:${hash}`);
  });

  test("32-char base32 infohash wraps in magnet", () => {
    const hash = "abcdefghijklmnopqrstuvwxyz234567";
    expect(normalizeLink(hash)).toBe(`magnet:?xt=urn:btih:${hash}`);
  });

  test("invalid hash (39 chars) passes through as-is", () => {
    expect(normalizeLink("abc123")).toBe("abc123");
  });
});

// ─── auth store (credential persistence, mocked localStorage) ───

// localStorage may be unavailable in jsdom; use an in-memory mock
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
};
vi.stubGlobal("localStorage", localStorageMock);

describe("auth store", () => {
  beforeEach(() => {
    localStorage.removeItem("qiubi-auth");
  });

  test("saveSavedAuth → getSavedAuth round-trip", () => {
    const creds = { username: "admin", password: "secret123" };
    saveSavedAuth(creds);
    expect(getSavedAuth()).toEqual(creds);
    clearSavedAuth();
  });

  test("clearSavedAuth removes stored data", () => {
    saveSavedAuth({ username: "test", password: "pw" });
    clearSavedAuth();
    expect(getSavedAuth()).toBeNull();
  });

  test("getSavedAuth returns null when nothing stored", () => {
    expect(getSavedAuth()).toBeNull();
  });

  test("getSavedAuth handles corrupted data gracefully", () => {
    localStorage.setItem("qiubi-auth", "!!!not-base64!!!");
    expect(getSavedAuth()).toBeNull();
    localStorage.removeItem("qiubi-auth");
  });

  test("getSavedAuth rejects non-string fields", () => {
    localStorage.setItem("qiubi-auth", btoa(JSON.stringify({ username: 123, password: true })));
    expect(getSavedAuth()).toBeNull();
    localStorage.removeItem("qiubi-auth");
  });
});
