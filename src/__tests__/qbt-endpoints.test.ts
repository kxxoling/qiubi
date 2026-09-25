import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { QbtClient } from "@/api/qbt";

/**
 * Table-driven tests: covers the URL / HTTP method / form-parameter encoding
 * of every endpoint in qbt.ts. To add an endpoint, just add one case row here.
 */

type Case = {
  name: string;
  call: (c: QbtClient) => Promise<unknown>;
  /** Expected full URL (without the baseUrl prefix) */
  path: string;
  method: "GET" | "POST";
  /** Expected form params (when POST body is URLSearchParams) */
  params?: Record<string, string>;
};

const CASES: Case[] = [
  // --- App / Transfer (GET read endpoints) ---
  { name: "getAppVersion", call: (c) => c.getAppVersion(), path: "/app/version", method: "GET" },
  {
    name: "getApiVersion",
    call: (c) => c.getApiVersion(),
    path: "/app/webapiVersion",
    method: "GET",
  },
  { name: "getBuildInfo", call: (c) => c.getBuildInfo(), path: "/app/buildInfo", method: "GET" },
  {
    name: "getPreferences",
    call: (c) => c.getPreferences(),
    path: "/app/preferences",
    method: "GET",
  },
  {
    name: "getDefaultSavePath",
    call: (c) => c.getDefaultSavePath(),
    path: "/app/defaultSavePath",
    method: "GET",
  },
  {
    name: "getTransferInfo",
    call: (c) => c.getTransferInfo(),
    path: "/transfer/info",
    method: "GET",
  },
  {
    name: "getSpeedLimitsMode",
    call: (c) => c.getSpeedLimitsMode(),
    path: "/transfer/speedLimitsMode",
    method: "GET",
  },
  {
    name: "getGlobalDlLimit",
    call: (c) => c.getGlobalDlLimit(),
    path: "/transfer/globalDlLimit",
    method: "GET",
  },
  {
    name: "setGlobalUpLimit",
    call: (c) => c.setGlobalUpLimit(1024),
    path: "/transfer/setGlobalUpLimit",
    method: "POST",
    params: { limit: "1024" },
  },
  // --- Sync ---
  {
    name: "getSyncMainData",
    call: (c) => c.getSyncMainData(7),
    path: "/sync/maindata?rid=7",
    method: "GET",
  },
  {
    name: "getSyncTorrentPeers",
    call: (c) => c.getSyncTorrentPeers("abc", 3),
    path: "/sync/torrentPeers?hash=abc&rid=3",
    method: "GET",
  },
  // --- Torrents ---
  {
    name: "getTorrentsInfo (no params)",
    call: (c) => c.getTorrentsInfo(),
    path: "/torrents/info",
    method: "GET",
  },
  {
    name: "getTorrentsInfo (filter)",
    call: (c) => c.getTorrentsInfo({ filter: "downloading", limit: 10 }),
    path: "/torrents/info?filter=downloading&limit=10",
    method: "GET",
  },
  {
    name: "getTorrentProperties",
    call: (c) => c.getTorrentProperties("abc"),
    path: "/torrents/properties?hash=abc",
    method: "GET",
  },
  {
    name: "getTorrentTrackers",
    call: (c) => c.getTorrentTrackers("abc"),
    path: "/torrents/trackers?hash=abc",
    method: "GET",
  },
  {
    name: "getTorrentFiles",
    call: (c) => c.getTorrentFiles("abc"),
    path: "/torrents/files?hash=abc",
    method: "GET",
  },
  {
    name: "pauseTorrents",
    call: (c) => c.pauseTorrents(["h1", "h2"]),
    path: "/torrents/stop",
    method: "POST",
    params: { hashes: "h1|h2" },
  },
  {
    name: "resumeTorrents (all)",
    call: (c) => c.resumeTorrents(["all"]),
    path: "/torrents/start",
    method: "POST",
    params: { hashes: "all" },
  },
  {
    name: "deleteTorrents",
    call: (c) => c.deleteTorrents(["h1"], true),
    path: "/torrents/delete",
    method: "POST",
    params: { hashes: "h1", deleteFiles: "true" },
  },
  {
    name: "recheckTorrents",
    call: (c) => c.recheckTorrents(["h1"]),
    path: "/torrents/recheck",
    method: "POST",
    params: { hashes: "h1" },
  },
  {
    name: "setTorrentCategory",
    call: (c) => c.setTorrentCategory(["h1", "h2"], "movies"),
    path: "/torrents/setCategory",
    method: "POST",
    params: { hashes: "h1|h2", category: "movies" },
  },
  {
    name: "addTorrentTags",
    call: (c) => c.addTorrentTags(["h1"], ["a", "b"]),
    path: "/torrents/addTags",
    method: "POST",
    params: { hashes: "h1", tags: "a,b" },
  },
  {
    name: "setForceStart",
    call: (c) => c.setForceStart(["h1"], true),
    path: "/torrents/setForceStart",
    method: "POST",
    params: { hashes: "h1", value: "true" },
  },
  {
    name: "setFilePriority",
    call: (c) => c.setFilePriority("h1", [0, 1], 7),
    path: "/torrents/filePrio",
    method: "POST",
    // qBT requires one repeated id param per file; body.get only returns the
    // first — repetition is asserted separately below
    params: { hash: "h1", id: "0", priority: "7" },
  },
  {
    name: "setTorrentLocation",
    call: (c) => c.setTorrentLocation(["h1"], "/data"),
    path: "/torrents/setLocation",
    method: "POST",
    params: { hashes: "h1", location: "/data" },
  },
  // --- Categories / Tags ---
  {
    name: "addCategory",
    call: (c) => c.addCategory("movies", "/movies"),
    path: "/torrents/createCategory",
    method: "POST",
    params: { category: "movies", savePath: "/movies" },
  },
  {
    name: "removeCategories（\n 分隔）",
    call: (c) => c.removeCategories(["a", "b"]),
    path: "/torrents/removeCategories",
    method: "POST",
    params: { categories: "a\nb" },
  },
  {
    name: "createTags",
    call: (c) => c.createTags(["x", "y"]),
    path: "/torrents/createTags",
    method: "POST",
    params: { tags: "x,y" },
  },
  {
    name: "getTags",
    call: (c) => c.getTags(),
    path: "/torrents/tags",
    method: "GET",
  },
  // --- Log ---
  {
    name: "getLog",
    call: (c) => c.getLog({ last_known_id: 5 }),
    path: "/log/main?last_known_id=5",
    method: "GET",
  },
  // --- RSS ---
  {
    name: "addRssFeed",
    call: (c) => c.addRssFeed("https://example.com/rss", "folder"),
    path: "/rss/addFeed",
    method: "POST",
    params: { url: "https://example.com/rss", path: "folder" },
  },
  {
    name: "removeRssItem",
    call: (c) => c.removeRssItem("TechBlog"),
    path: "/rss/removeItem",
    method: "POST",
    params: { path: "TechBlog" },
  },
  {
    name: "getRssItems (withData)",
    call: (c) => c.getRssItems(true),
    path: "/rss/items?withData=true",
    method: "GET",
  },
  {
    name: "removeRssRule",
    call: (c) => c.removeRssRule("R1"),
    path: "/rss/removeRule",
    method: "POST",
    params: { ruleName: "R1" },
  },
  // --- Search ---
  {
    name: "startSearch",
    call: (c) => c.startSearch("ubuntu", "enabled", "all"),
    path: "/search/start",
    method: "POST",
    params: { pattern: "ubuntu", plugins: "enabled", category: "all" },
  },
  {
    name: "stopSearch",
    call: (c) => c.stopSearch(9),
    path: "/search/stop",
    method: "POST",
    params: { id: "9" },
  },
  {
    name: "getSearchStatus",
    call: (c) => c.getSearchStatus(9),
    path: "/search/status?id=9",
    method: "GET",
  },
  {
    name: "getSearchResults",
    call: (c) => c.getSearchResults(9, 50, 10),
    path: "/search/results?id=9&limit=50&offset=10",
    method: "GET",
  },
  {
    name: "uninstallSearchPlugin（| 分隔）",
    call: (c) => c.uninstallSearchPlugin(["a", "b"]),
    path: "/search/uninstallPlugin",
    method: "POST",
    params: { names: "a|b" },
  },
  {
    name: "enableSearchPlugin",
    call: (c) => c.enableSearchPlugin(["p"], false),
    path: "/search/enablePlugin",
    method: "POST",
    params: { names: "p", enable: "false" },
  },
  {
    name: "getSearchPlugins",
    call: (c) => c.getSearchPlugins(),
    path: "/search/plugins",
    method: "GET",
  },
];

describe("QbtClient endpoint table-driven tests", () => {
  let client: QbtClient;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = new QbtClient({ baseUrl: "http://localhost:8080" });
    fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const { name, call, path, method, params } of CASES) {
    test(name, async () => {
      await call(client);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe(`http://localhost:8080/api/v2${path}`);
      // GET requests don't set method explicitly (fetch defaults to GET)
      expect(opts.method ?? "GET").toBe(method);

      if (params) {
        const body = opts.body as URLSearchParams;
        for (const [key, value] of Object.entries(params)) {
          expect(body.get(key)).toBe(value);
        }
      }
    });
  }

  // qBT filePrio requires repeated id params (id=0&id=1), not comma-joined
  test("setFilePriority emits one id param per file", async () => {
    await client.setFilePriority("h1", [0, 1, 2], 6);
    const [, opts] = fetchSpy.mock.calls[0];
    const body = opts.body as URLSearchParams;
    expect(body.getAll("id")).toEqual(["0", "1", "2"]);
  });
});
