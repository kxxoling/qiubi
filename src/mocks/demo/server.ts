/**
 * GitHub Pages demo mode: a stateful qBittorrent API mock service
 *
 * - MSW intercepts every /api/v2/* request; data never leaves the browser
 * - State lives in @mswjs/data (models.ts); seeds in seed.ts
 * - A 1s tick advances progress/jitters speeds; actions (pause/delete/categorize…) mutate the store
 * - Unmatched /api/v2/* falls through to a catch-all handler — zero real network requests
 *
 * Only enabled in vite --mode demo builds (statically removed from normal builds).
 */

import { faker } from "@faker-js/faker/locale/en";
import { HttpResponse, http } from "msw";
import { setupWorker } from "msw/browser";
import { db, sequences } from "./models";
import { DEMO_TRACKERS, demoRules, seedAll } from "./seed";

type Rec = Record<string, unknown>;
const nowSec = () => Math.floor(Date.now() / 1000);
const MB = 1024 * 1024;

// ---------------------------------------------------------------------------
// Global mutable state (singleton config, not worth modeling)
// ---------------------------------------------------------------------------

let rid = 1;
let altSpeed = false;

const serverState: Rec = {
  dl_info_speed: 0,
  up_info_speed: 0,
  dl_info_data: 48.3 * 1024 ** 3,
  up_info_data: 112.7 * 1024 ** 3,
  dht_nodes: 412,
  connection_status: "connected",
  fresh_session: false,
  free_space_on_disk: 128_849_018_880,
};

const prefs: Rec = {
  locale: "en",
  save_path: "/downloads",
  queueing_enabled: true,
  max_active_downloads: 3,
  max_active_uploads: 5,
  max_active_torrents: 8,
  listen_port: 6881,
  upnp: true,
  dl_limit: 0,
  up_limit: 0,
  alt_dl_limit: 1024 * 1024,
  alt_up_limit: 512 * 1024,
  max_connec: 500,
  max_connec_per_torrent: 80,
  dht: true,
  pex: true,
  lsd: true,
  encryption: 1,
  anonymous_mode: false,
  web_ui_port: 18080,
  web_ui_username: "demo",
  web_ui_csrf_protection_enabled: false,
  web_ui_host_header_validation_enabled: false,
  add_stopped_enabled: false,
  start_paused_enabled: false,
  rss_processing_enabled: true,
  rss_refresh_interval: 30,
  search_enabled: true,
};

const recheckPrev = new Map<string, string>();

// ---------------------------------------------------------------------------
// Projection: torrent entity → full torrents/info record (derived fields computed at read time)
// ---------------------------------------------------------------------------

function toTorrentInfo(t: {
  hash: string;
  name: string;
  size: number;
  state: string;
  progress: number;
  category: string;
  tags: string;
  tracker: string;
  addedOn: number;
  dlspeed: number;
  upspeed: number;
  ratio: number;
  uploaded: number;
  numSeeds: number;
  numLeechs: number;
  numComplete: number;
  numIncomplete: number;
}): Rec {
  const downloaded = Math.floor(t.size * t.progress);
  const up = t.progress >= 1;
  const active = t.dlspeed > 0 || t.upspeed > 0;
  const piecesNum = Math.max(1, Math.ceil(t.size / 262144));
  const savePath = `/downloads${t.category ? `/${t.category}` : ""}`;
  return {
    added_on: t.addedOn,
    amount_left: t.size - downloaded,
    auto_tmm: false,
    availability: up ? 1 : 0.85 + faker.number.float({ min: 0, max: 0.14 }),
    category: t.category,
    comment: "qiubi demo mock torrent",
    completed: downloaded,
    completion_on: up ? t.addedOn + 3600 : -1,
    connections_count: active ? faker.number.int({ min: 4, max: 34 }) : 0,
    connections_limit: 80,
    content_path: `${savePath}/${t.name}`,
    created_by: "qiubi-demo",
    creation_date: t.addedOn - 86400,
    dl_limit: 0,
    dlspeed: t.dlspeed,
    download_path: "",
    downloaded,
    downloaded_session: Math.floor(downloaded * 0.3),
    eta:
      t.state === "downloading" && t.dlspeed > 0
        ? Math.floor((t.size - downloaded) / t.dlspeed)
        : 8640000,
    f_l_piece_prio: false,
    force_start: false,
    has_metadata: t.state !== "metaDL",
    hash: t.hash,
    inactive_seeding_time_limit: -2,
    infohash_v1: t.hash,
    infohash_v2: "",
    last_activity: nowSec() - faker.number.int({ min: 0, max: 600 }),
    magnet_uri: `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(t.name)}${DEMO_TRACKERS.slice(
      0,
      3,
    )
      .map((tr) => `&tr=${encodeURIComponent(tr)}`)
      .join("")}`,
    max_inactive_seeding_time: -1,
    max_ratio: -1,
    max_seeding_time: -1,
    name: t.name,
    num_complete: t.numComplete,
    num_incomplete: t.numIncomplete,
    num_leechs: t.numLeechs,
    num_seeds: t.numSeeds,
    piece_size: 262144,
    pieces_have: Math.floor(piecesNum * t.progress),
    pieces_num: piecesNum,
    popularity: faker.number.float({ min: 0, max: 4 }),
    priority: t.state === "downloading" ? 1 : faker.number.int({ min: 5, max: 8 }),
    private: false,
    progress: t.progress,
    ratio: t.ratio,
    ratio_limit: -2,
    reannounce: faker.number.int({ min: 300, max: 1800 }),
    root_path: `${savePath}/${t.name}`,
    save_path: savePath,
    seeding_time: up ? Math.floor((nowSec() - t.addedOn) * 0.7) : 0,
    seeding_time_limit: -2,
    seen_complete: up ? t.addedOn + 3600 : -1,
    seq_dl: false,
    share_limit_action: "Default",
    size: t.size,
    state: t.state,
    super_seeding: false,
    tags: t.tags,
    time_active: Math.floor((nowSec() - t.addedOn) * 0.85),
    total_size: t.size,
    total_wasted: Math.floor(t.size * 0.001),
    tracker: t.tracker,
    trackers_count: t.tracker ? 3 : 0,
    up_limit: 0,
    uploaded: t.uploaded || Math.floor(downloaded * 0.8),
    uploaded_session: Math.floor((t.uploaded || downloaded) * 0.25),
    upspeed: t.upspeed,
  };
}

function propertiesFor(t: Parameters<typeof toTorrentInfo>[0]): Rec {
  const info = toTorrentInfo(t);
  return {
    addition_date: info.added_on,
    comment: "qiubi demo mock torrent — 数据为浏览器内模拟",
    completion_date: info.completion_on,
    created_by: info.created_by,
    creation_date: info.creation_date,
    dl_limit: -1,
    download_path: "",
    hash: t.hash,
    infohash_v1: t.hash,
    infohash_v2: "",
    last_seen: info.last_activity,
    name: t.name,
    nb_connections: info.connections_count,
    nb_connections_limit: info.connections_limit,
    peers: t.numLeechs,
    peers_total: t.numIncomplete,
    piece_size: info.piece_size,
    pieces_have: info.pieces_have,
    pieces_num: info.pieces_num,
    reannounce: info.reannounce,
    save_path: info.save_path,
    seeding_time: info.seeding_time,
    seeds: t.numSeeds,
    seeds_total: t.numComplete,
    share_ratio: t.ratio,
    time_elapsed: info.time_active,
    total_downloaded: info.downloaded,
    total_downloaded_session: info.downloaded_session,
    total_size: t.size,
    total_uploaded: info.uploaded,
    total_uploaded_session: info.uploaded_session,
    up_limit: -1,
    upload_payload: info.uploaded,
    up_speed: t.upspeed,
  };
}

function trackersFor(t: {
  tracker: string;
  numLeechs: number;
  numComplete: number;
  numIncomplete: number;
}) {
  if (!t.tracker) return [];
  const special = (url: string, num_peers: number) => ({
    url,
    status: 0,
    tier: 0,
    num_peers,
    num_seeds: 0,
    num_leeches: 0,
    num_downloaded: 0,
    num_downloaded_session: 0,
    msg: "",
  });
  return [
    special("** [DHT] **", 40),
    special("** [PeX] **", 2),
    special("** [LSD] **", 0),
    ...DEMO_TRACKERS.slice(0, 3).map((url, i) => ({
      url,
      status: 2,
      tier: i,
      num_peers: t.numLeechs,
      num_seeds: t.numComplete,
      num_leeches: t.numIncomplete,
      num_downloaded: 100 + i * 37,
      num_downloaded_session: 3 + i,
      msg: "",
    })),
  ];
}

function peersFor(t: { hash: string; name: string; state: string }) {
  const clients = [
    "qBittorrent 5.2.3",
    "qBittorrent 4.6.7",
    "Deluge 2.1.1",
    "Transmission 4.0.6",
    "libtorrent 2.0.11",
    "rtorrent 0.15.2",
    "BiglyBT 3.6",
  ];
  const peers: Rec = {};
  const count = faker.number.int({ min: 6, max: 14 });
  for (let i = 0; i < count; i++) {
    const ip = faker.internet.ip();
    const down = t.state === "downloading" ? faker.number.int({ max: 900 * 1024 }) : 0;
    peers[ip] = {
      client: clients[faker.number.int({ min: 0, max: clients.length - 1 })],
      connection: "BT-PWP",
      country: faker.location.countryCode(),
      country_code: "",
      dl_speed: down,
      downloaded: down * faker.number.int({ min: 30, max: 60 }),
      files: t.name,
      flags: i % 4 === 0 ? "D" : "d",
      flag_data: 0,
      up_speed: faker.number.int({ max: 300 * 1024 }),
      uploaded: faker.number.int({ max: 500 * 1024 * 1024 }),
      relevance: 1 - i * 0.05,
      peer_id_client: "-qB5230-",
      progress: faker.number.float({ min: 0.1, max: 1 }),
      downloaded_session: down * 10,
      uploaded_session: faker.number.int({ max: 100 * 1024 * 1024 }),
      waiting_for_handshake: false,
      from: "DHT",
    };
  }
  return { full_update: true, rid, peers };
}

// ---------------------------------------------------------------------------
// tick: bring the demo to life
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function pushLog(message: string, type = 1) {
  db.logEntry.create({ id: ++sequences.log, message, timestamp: nowSec(), type });
}

function tick() {
  let dlTotal = 0;
  let upTotal = 0;
  for (const t of db.torrent.getAll()) {
    const patch: Partial<typeof t> = {};
    switch (t.state) {
      case "downloading": {
        const next = Math.max(
          256 * 1024,
          Math.floor(t.dlspeed * faker.number.float({ min: 0.85, max: 1.15 })),
        );
        patch.dlspeed = altSpeed ? Math.min(next, prefs.alt_dl_limit as number) : next;
        patch.progress = clamp01(t.progress + (patch.dlspeed ?? t.dlspeed) / t.size);
        if (patch.progress >= 1) {
          Object.assign(patch, {
            state: "uploading",
            upspeed: 512 * 1024,
            ratio: 1,
            uploaded: t.size,
          });
          pushLog(`'${t.name}' downloaded successfully`);
        }
        break;
      }
      case "metaDL":
        if (faker.number.float({ min: 0, max: 1 }) < 0.06) {
          patch.state = "downloading";
          patch.dlspeed = 1_500_000;
          pushLog(`Metadata received for '${t.name}'`);
        }
        break;
      case "checkingResumeData":
      case "checkingDL":
      case "checkingUP": {
        patch.progress = clamp01(t.progress + 0.04);
        if (patch.progress >= 1) {
          patch.state = recheckPrev.get(t.hash) ?? "uploading";
          recheckPrev.delete(t.hash);
        }
        break;
      }
      case "uploading":
        patch.upspeed = Math.max(
          64 * 1024,
          Math.floor(t.upspeed * faker.number.float({ min: 0.85, max: 1.2 })),
        );
        if (faker.number.float({ min: 0, max: 1 }) < 0.04) patch.state = "stalledUP";
        break;
      case "stalledUP":
        if (faker.number.float({ min: 0, max: 1 }) < 0.05)
          Object.assign(patch, { state: "uploading", upspeed: 400 * 1024 });
        else patch.upspeed = 0;
        break;
      case "stalledDL":
        if (faker.number.float({ min: 0, max: 1 }) < 0.06)
          Object.assign(patch, { state: "downloading", dlspeed: 2_000_000 });
        break;
    }
    db.torrent.update({ where: { hash: { equals: t.hash } }, data: patch as Rec });
    dlTotal += patch.dlspeed ?? t.dlspeed;
    upTotal += patch.upspeed ?? t.upspeed;
  }
  // Queue advance: with no active download, start the queued head
  if (!db.torrent.findMany({ where: { state: { equals: "downloading" } } }).length) {
    const queued = db.torrent.findFirst({ where: { state: { equals: "queuedDL" } } });
    if (queued) {
      db.torrent.update({
        where: { hash: { equals: queued.hash } },
        data: { state: "downloading", dlspeed: 2_500_000 },
      });
      pushLog(`'${queued.name}' started (queue)`);
      dlTotal += 2_500_000;
    }
  }
  serverState.dl_info_speed = dlTotal;
  serverState.up_info_speed = upTotal;
  serverState.dl_info_data = (serverState.dl_info_data as number) + dlTotal;
  serverState.up_info_data = (serverState.up_info_data as number) + upTotal;
  serverState.dht_nodes = 390 + faker.number.int({ min: 0, max: 60 });
  rid++;

  if (faker.number.float({ min: 0, max: 1 }) < 0.15) {
    const all = db.torrent.getAll();
    const t = all[faker.number.int({ min: 0, max: all.length - 1 })];
    if (t)
      pushLog(
        faker.helpers.arrayElement([
          `Successfully announced to ${t.tracker || "tracker"} (peers: ${t.numLeechs})`,
          `Peer connection established: ${faker.internet.ip()}`,
          `Piece ${faker.number.int({ max: 40000 })} downloaded from peer`,
        ]),
      );
  }
}

// ---------------------------------------------------------------------------
// Handler utilities
// ---------------------------------------------------------------------------

const json = (data: unknown) => HttpResponse.json(data as Parameters<typeof HttpResponse.json>[0]);
const ok = () => new HttpResponse("Ok.", { headers: { "Content-Type": "text/plain" } });
const notFound = () =>
  new HttpResponse("Fails.", { status: 404, headers: { "Content-Type": "text/plain" } });

/** Merge GET query params with urlencoded/FormData POST body params */
async function params(request: Request): Promise<URLSearchParams> {
  const merged = new URLSearchParams(new URL(request.url).searchParams);
  const ct = request.headers.get("content-type") ?? "";
  if (request.method === "POST" && ct.includes("urlencoded")) {
    for (const [k, v] of new URLSearchParams(await request.clone().text())) merged.append(k, v);
  } else if (request.method === "POST" && ct.includes("form")) {
    for (const [k, v] of await request.clone().formData())
      if (typeof v === "string") merged.append(k, v);
  }
  return merged;
}

function pickTorrents(p: URLSearchParams) {
  const hashes = (p.get("hashes") ?? p.get("hash") ?? "all").split(/[|,]/).filter(Boolean);
  if (hashes.includes("all")) return db.torrent.getAll();
  return hashes
    .map((h) => db.torrent.findFirst({ where: { hash: { equals: h } } }))
    .filter((t): t is NonNullable<typeof t> => !!t);
}

/** Search results: enabled engines × result pool */
function searchResultsFor(pattern: string) {
  const pool = [
    {
      fileName: "ubuntu-25.04-desktop-amd64.iso",
      fileSize: 6_100_000_000,
      nbSeeders: 412,
      nbLeechers: 38,
    },
    {
      fileName: "ubuntu-25.04-live-server-amd64.iso",
      fileSize: 2_700_000_000,
      nbSeeders: 298,
      nbLeechers: 21,
    },
    {
      fileName: "debian-13.1.0-amd64-netinst.iso",
      fileSize: 670_000_000,
      nbSeeders: 190,
      nbLeechers: 12,
    },
    {
      fileName: "Big.Buck.Bunny.4K.60fps.BBB",
      fileSize: 14_800_000_000,
      nbSeeders: 87,
      nbLeechers: 15,
    },
    {
      fileName: "Sintel.2010.1080p.OpenMovie",
      fileSize: 985_000_000,
      nbSeeders: 64,
      nbLeechers: 9,
    },
    { fileName: "Tears.of.Steel.2012.2K", fileSize: 1_260_000_000, nbSeeders: 41, nbLeechers: 6 },
    { fileName: "Cosmos.Laundromat.1080p", fileSize: 761_000_000, nbSeeders: 33, nbLeechers: 4 },
    {
      fileName: "Gutenberg.Top.100.epub.bundle",
      fileSize: 517_000_000,
      nbSeeders: 22,
      nbLeechers: 3,
    },
    {
      fileName: "Free.Music.Sampler.CC-BY.Vol.7.FLAC",
      fileSize: 2_770_000_000,
      nbSeeders: 17,
      nbLeechers: 2,
    },
  ].filter(
    (r) =>
      !pattern || r.fileName.toLowerCase().includes(pattern.toLowerCase().split(/\s+/)[0] ?? ""),
  );
  return pool.flatMap((r) =>
    db.searchPlugin
      .findMany({ where: { enabled: { equals: true } } })
      .filter((e) => e.name !== "gutenberg" || r.fileName.includes("Gutenberg"))
      .slice(0, 2)
      .map((e) => ({
        descrLink: `${e.url}/${encodeURIComponent(r.fileName)}`,
        engineName: e.fullName,
        fileName: r.fileName,
        fileSize: r.fileSize,
        fileUrl: `magnet:?xt=urn:btih:demo${faker.string.numeric(9)}&dn=${encodeURIComponent(r.fileName)}`,
        nbLeechers: r.nbLeechers,
        nbSeeders: r.nbSeeders,
        pubDate: nowSec() - 86400 * faker.number.int({ min: 1, max: 30 }),
        siteUrl: e.url,
      })),
  );
}

// ---------------------------------------------------------------------------
// handlers
// ---------------------------------------------------------------------------

const feedToJson = (f: ReturnType<typeof db.feed.create>) => ({
  uid: f.uid,
  url: f.url,
  title: f.name,
  lastBuildDate: f.lastBuildDate,
  isLoading: f.isLoading,
  hasError: f.hasError,
  articles: db.article.findMany({ where: { feedName: { equals: f.name } } }).map((a) => ({
    id: a.id,
    date: a.date,
    title: a.title,
    link: a.link,
    description: a.description,
    isRead: a.isRead,
    torrentURL: a.torrentURL,
  })),
});

type RouteFn = (request: Request) => Promise<Response> | Response;
type Route = { method: "GET" | "POST" | "*"; path: string; fn: RouteFn };
const route = (method: Route["method"], path: string, fn: RouteFn): Route => ({ method, path, fn });

const routes: Route[] = [
  // --- app ---
  route(
    "GET",
    "/api/v2/app/version",
    () => new HttpResponse("v5.2.3", { headers: { "Content-Type": "text/plain" } }),
  ),
  route(
    "GET",
    "/api/v2/app/webapiVersion",
    () => new HttpResponse("2.12.0", { headers: { "Content-Type": "text/plain" } }),
  ),
  route("GET", "/api/v2/app/buildInfo", () =>
    json({
      qt: "6.8.2",
      libtorrent: "2.0.11.0",
      boost: "1.86.0",
      openssl: "3.4.0",
      bitness: 64,
      platform: "qiubi-demo",
    }),
  ),
  route("GET", "/api/v2/app/preferences", () => json(prefs)),
  route("POST", "/api/v2/app/setPreferences", async (request) => {
    const p = await params(request);
    try {
      Object.assign(prefs, JSON.parse(p.get("json") ?? "{}"));
    } catch {
      /* ignore invalid json */
    }
    return ok();
  }),
  route(
    "GET",
    "/api/v2/app/defaultSavePath",
    () => new HttpResponse("/downloads", { headers: { "Content-Type": "text/plain" } }),
  ),
  route("POST", "/api/v2/app/shutdown", () => ok()),

  // --- auth (demo always succeeds) ---
  route("POST", "/api/v2/auth/login", () => ok()),
  route("POST", "/api/v2/auth/logout", () => ok()),

  // --- transfer ---
  route("GET", "/api/v2/transfer/info", () =>
    json({ ...serverState, dl_rate_limit: prefs.dl_limit, up_rate_limit: prefs.up_limit }),
  ),
  route(
    "GET",
    "/api/v2/transfer/speedLimitsMode",
    () => new HttpResponse(altSpeed ? "1" : "0", { headers: { "Content-Type": "text/plain" } }),
  ),
  route("POST", "/api/v2/transfer/toggleSpeedLimitsMode", () => {
    altSpeed = !altSpeed;
    return ok();
  }),
  route(
    "GET",
    "/api/v2/transfer/globalDlLimit",
    () => new HttpResponse(String(prefs.dl_limit), { headers: { "Content-Type": "text/plain" } }),
  ),
  route(
    "GET",
    "/api/v2/transfer/globalUpLimit",
    () => new HttpResponse(String(prefs.up_limit), { headers: { "Content-Type": "text/plain" } }),
  ),
  route("POST", "/api/v2/transfer/setGlobalDlLimit", async (request) => {
    prefs.dl_limit = Number((await params(request)).get("limit") ?? 0);
    return ok();
  }),
  route("POST", "/api/v2/transfer/setGlobalUpLimit", async (request) => {
    prefs.up_limit = Number((await params(request)).get("limit") ?? 0);
    return ok();
  }),

  // --- sync ---
  route("GET", "/api/v2/sync/maindata", () => {
    const torrentsObj: Rec = {};
    for (const t of db.torrent.getAll()) torrentsObj[t.hash] = toTorrentInfo(t);
    const categories: Rec = {};
    for (const c of db.category.getAll())
      categories[c.name] = { name: c.name, savePath: c.savePath };
    // qBT's real shape: tracker URL → member torrent hashes (rotate the pool
    // so every tracker domain shows up in the sidebar)
    const trackersMap: Rec = {};
    db.torrent.getAll().forEach((t, idx) => {
      const picked = Array.from(
        { length: 2 + (idx % 3) },
        (_, k) => DEMO_TRACKERS[(idx + k) % DEMO_TRACKERS.length],
      );
      const urls = t.tracker ? [t.tracker, ...picked] : picked;
      for (const u of urls) {
        trackersMap[u] = [...((trackersMap[u] as string[]) ?? []), t.hash];
      }
    });
    return json({
      rid,
      full_update: true,
      torrents: torrentsObj,
      trackers: trackersMap,
      torrents_removed: [],
      categories,
      categories_removed: [],
      tags: db.tag.getAll().map((t) => t.name),
      tags_removed: [],
      server_state: { ...serverState },
    });
  }),
  route("GET", "/api/v2/sync/torrentPeers", (request) => {
    const t = db.torrent.findFirst({
      where: { hash: { equals: new URL(request.url).searchParams.get("hash") ?? "" } },
    });
    return t ? json(peersFor(t)) : json({ full_update: true, rid, peers: {} });
  }),

  // --- torrents: reads ---
  route("GET", "/api/v2/torrents/info", () => json(db.torrent.getAll().map(toTorrentInfo))),
  route("GET", "/api/v2/torrents/properties", (request) => {
    const t = db.torrent.findFirst({
      where: { hash: { equals: new URL(request.url).searchParams.get("hash") ?? "" } },
    });
    return t ? json(propertiesFor(t)) : notFound();
  }),
  route("GET", "/api/v2/torrents/files", (request) => {
    const t = db.torrent.findFirst({
      where: { hash: { equals: new URL(request.url).searchParams.get("hash") ?? "" } },
    });
    if (!t) return notFound();
    return json(
      db.file
        .findMany({ where: { torrentHash: { equals: t.hash } } })
        .sort((a, b) => a.id - b.id)
        .map((f) => ({
          index: f.id - 1,
          name: f.name,
          size: f.size,
          progress: t.progress >= 1 ? 1 : f.progress,
          priority: f.priority,
          is_seed: t.progress >= 1,
          piece_range: [0, 1],
          availability: Math.min(1, 0.6 + f.progress * 0.4),
        })),
    );
  }),
  route("GET", "/api/v2/torrents/trackers", (request) => {
    const t = db.torrent.findFirst({
      where: { hash: { equals: new URL(request.url).searchParams.get("hash") ?? "" } },
    });
    return t ? json(trackersFor(t)) : notFound();
  }),
  route("GET", "/api/v2/torrents/webseeds", () => json([])),
  route("GET", "/api/v2/torrents/magnetLink", (request) => {
    const t = db.torrent.findFirst({
      where: { hash: { equals: new URL(request.url).searchParams.get("hash") ?? "" } },
    });
    return t
      ? new HttpResponse(toTorrentInfo(t).magnet_uri as string, {
          headers: { "Content-Type": "text/plain" },
        })
      : notFound();
  }),
  route("GET", "/api/v2/torrents/categories", () => {
    const out: Rec = {};
    for (const c of db.category.getAll()) out[c.name] = { name: c.name, savePath: c.savePath };
    return json(out);
  }),
  route("GET", "/api/v2/torrents/tags", () => json(db.tag.getAll().map((t) => t.name))),

  // --- torrents: actions ---
  ...(["stop", "pause"] as const).map((ep) =>
    route("POST", `/api/v2/torrents/${ep}`, async (request) => {
      const list = pickTorrents(await params(request));
      const isDlSide = (s: string) => /dl$/i.test(s) || s === "downloading" || s === "metaDL";
      for (const t of list)
        db.torrent.update({
          where: { hash: { equals: t.hash } },
          data: { state: isDlSide(t.state) ? "stoppedDL" : "stoppedUP", dlspeed: 0, upspeed: 0 },
        });
      return ok();
    }),
  ),
  ...(["start", "resume"] as const).map((ep) =>
    route("POST", `/api/v2/torrents/${ep}`, async (request) => {
      for (const t of pickTorrents(await params(request))) {
        const done = t.progress >= 1;
        db.torrent.update({
          where: { hash: { equals: t.hash } },
          data: done
            ? { state: "uploading", upspeed: faker.number.int({ min: 300_000, max: 1_100_000 }) }
            : t.state === "metaDL"
              ? { state: "metaDL" }
              : {
                  state: "downloading",
                  dlspeed: faker.number.int({ min: 1_500_000, max: 4_500_000 }),
                },
        });
      }
      return ok();
    }),
  ),
  route("POST", "/api/v2/torrents/delete", async (request) => {
    for (const t of pickTorrents(await params(request))) {
      db.torrent.delete({ where: { hash: { equals: t.hash } } });
      db.file.deleteMany({ where: { torrentHash: { equals: t.hash } } });
      pushLog(`'${t.name}' removed from session`);
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/recheck", async (request) => {
    for (const t of pickTorrents(await params(request))) {
      recheckPrev.set(t.hash, t.state);
      db.torrent.update({
        where: { hash: { equals: t.hash } },
        data: { state: t.progress >= 1 ? "checkingUP" : "checkingDL" },
      });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/reannounce", () => ok()),
  route("POST", "/api/v2/torrents/increasePrio", () => ok()),
  route("POST", "/api/v2/torrents/decreasePrio", () => ok()),
  route("POST", "/api/v2/torrents/topPrio", () => ok()),
  route("POST", "/api/v2/torrents/bottomPrio", () => ok()),
  route("POST", "/api/v2/torrents/setShareLimits", () => ok()),
  route("POST", "/api/v2/torrents/setDownloadLimit", () => ok()),
  route("POST", "/api/v2/torrents/setUploadLimit", () => ok()),
  route("POST", "/api/v2/torrents/toggleSequentialDownload", () => ok()),
  route("POST", "/api/v2/torrents/toggleFirstLastPiecePrio", () => ok()),
  route("POST", "/api/v2/torrents/setForceStart", () => ok()),
  route("POST", "/api/v2/torrents/setSuperSeeding", () => ok()),
  route("POST", "/api/v2/torrents/setAutoManagement", () => ok()),
  route("POST", "/api/v2/torrents/rename", async (request) => {
    const p = await params(request);
    const t = db.torrent.findFirst({ where: { hash: { equals: p.get("hash") ?? "" } } });
    if (!t) return notFound();
    db.torrent.update({
      where: { hash: { equals: t.hash } },
      data: { name: p.get("name") ?? t.name },
    });
    return ok();
  }),
  route("POST", "/api/v2/torrents/renameFile", async (request) => {
    const p = await params(request);
    const f = db.file.findFirst({ where: { id: { equals: Number(p.get("id") ?? -1) } } });
    const newName = p.get("newPath") ?? "";
    if (f && newName) {
      const parts = f.name.split("/");
      parts[parts.length - 1] = newName.split("/").pop() ?? newName;
      db.file.update({ where: { id: { equals: f.id } }, data: { name: parts.join("/") } });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/filePrio", async (request) => {
    const p = await params(request);
    const priority = Number(p.get("priority") ?? 1);
    for (const id of p.getAll("id")) {
      const f = db.file.findFirst({ where: { id: { equals: Number(id) } } });
      if (f && f.torrentHash === p.get("hash"))
        db.file.update({ where: { id: { equals: f.id } }, data: { priority } });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/addTrackers", () => ok()),
  route("POST", "/api/v2/torrents/editTracker", () => ok()),
  route("POST", "/api/v2/torrents/removeTrackers", () => ok()),

  // --- torrents: add (appears in the list immediately) ---
  route("POST", "/api/v2/torrents/add", async (request) => {
    const p = await params(request);
    const paused = ["true", "1"].includes(p.get("paused") ?? p.get("stopped") ?? "false");
    const urls = (p.get("urls") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const names = [
      ...urls.map((u) => {
        try {
          if (u.startsWith("magnet:"))
            return new URLSearchParams(u.split("?")[1]).get("dn") ?? "magnet-torrent";
          return decodeURIComponent(u.split("/").pop() || "new-torrent").replace(/\.torrent$/, "");
        } catch {
          return "new-torrent";
        }
      }),
      ...p.getAll("torrents"),
    ];
    for (const name of names) {
      const size = faker.number.int({ min: 500 * MB, max: 4_500 * MB });
      const t = db.torrent.create({
        hash: faker.string.hexadecimal({ length: 40, prefix: "" }),
        name,
        size,
        state: paused ? "stoppedDL" : "downloading",
        progress: 0,
        category: p.get("category") ?? "",
        tags: p.get("tags") ?? "",
        tracker: DEMO_TRACKERS[0],
        addedOn: nowSec(),
        dlspeed: paused ? 0 : faker.number.int({ min: 2_000_000, max: 5_000_000 }),
        upspeed: 0,
        ratio: 0,
        uploaded: 0,
        numSeeds: faker.number.int({ min: 3, max: 50 }),
        numLeechs: faker.number.int({ min: 2, max: 30 }),
        numComplete: faker.number.int({ min: 5, max: 400 }),
        numIncomplete: faker.number.int({ min: 1, max: 60 }),
      });
      db.file.create({
        id: ++sequences.file,
        torrentHash: t.hash,
        name: `${name}/${name}.bin`,
        size,
        progress: 0,
        priority: 1,
      });
      pushLog(`'${name}' added to session`);
    }
    return ok();
  }),

  // --- categories ---
  route("POST", "/api/v2/torrents/setCategory", async (request) => {
    const p = await params(request);
    const cat = p.get("category") ?? "";
    if (cat && !db.category.findFirst({ where: { name: { equals: cat } } }))
      db.category.create({ name: cat, savePath: `/downloads/${cat}` });
    for (const t of pickTorrents(p))
      db.torrent.update({ where: { hash: { equals: t.hash } }, data: { category: cat } });
    return ok();
  }),
  route("POST", "/api/v2/torrents/createCategory", async (request) => {
    const p = await params(request);
    const name = p.get("category") ?? "";
    if (name) db.category.create({ name, savePath: p.get("savePath") || `/downloads/${name}` });
    return ok();
  }),
  route("POST", "/api/v2/torrents/editCategory", async (request) => {
    const p = await params(request);
    const c = db.category.findFirst({ where: { name: { equals: p.get("category") ?? "" } } });
    if (c)
      db.category.update({
        where: { name: { equals: c.name } },
        data: { savePath: p.get("savePath") ?? c.savePath },
      });
    return ok();
  }),
  route("POST", "/api/v2/torrents/deleteCategory", async (request) => {
    const p = await params(request);
    for (const name of (p.get("categories") ?? "").split(",").filter(Boolean)) {
      db.category.delete({ where: { name: { equals: name } } });
      for (const t of db.torrent.findMany({ where: { category: { equals: name } } }))
        db.torrent.update({ where: { hash: { equals: t.hash } }, data: { category: "" } });
    }
    return ok();
  }),

  // --- tags ---
  route("POST", "/api/v2/torrents/createTags", async (request) => {
    for (const tag of ((await params(request)).get("tags") ?? "").split(",").filter(Boolean))
      if (!db.tag.findFirst({ where: { name: { equals: tag } } })) db.tag.create({ name: tag });
    return ok();
  }),
  route("POST", "/api/v2/torrents/deleteTags", async (request) => {
    const removed = ((await params(request)).get("tags") ?? "").split(",").filter(Boolean);
    for (const tag of removed) db.tag.delete({ where: { name: { equals: tag } } });
    for (const t of db.torrent.getAll()) {
      const next = t.tags
        .split(",")
        .filter((x) => x && !removed.includes(x))
        .join(",");
      if (next !== t.tags)
        db.torrent.update({ where: { hash: { equals: t.hash } }, data: { tags: next } });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/addTags", async (request) => {
    const p = await params(request);
    const add = (p.get("tags") ?? "").split(",").filter(Boolean);
    for (const tag of add)
      if (!db.tag.findFirst({ where: { name: { equals: tag } } })) db.tag.create({ name: tag });
    for (const t of pickTorrents(p)) {
      const next = [...new Set([...t.tags.split(",").filter(Boolean), ...add])].join(",");
      db.torrent.update({ where: { hash: { equals: t.hash } }, data: { tags: next } });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/removeTags", async (request) => {
    const p = await params(request);
    const rm = (p.get("tags") ?? "").split(",").filter(Boolean);
    for (const t of pickTorrents(p)) {
      const next = t.tags
        .split(",")
        .filter((x) => x && !rm.includes(x))
        .join(",");
      db.torrent.update({ where: { hash: { equals: t.hash } }, data: { tags: next } });
    }
    return ok();
  }),
  route("POST", "/api/v2/torrents/setTags", async (request) => {
    const p = await params(request);
    const set = (p.get("tags") ?? "").split(",").filter(Boolean);
    for (const tag of set)
      if (!db.tag.findFirst({ where: { name: { equals: tag } } })) db.tag.create({ name: tag });
    for (const t of pickTorrents(p))
      db.torrent.update({ where: { hash: { equals: t.hash } }, data: { tags: set.join(",") } });
    return ok();
  }),

  // --- RSS ---
  route("GET", "/api/v2/rss/items", () => {
    const out: Rec = {};
    for (const f of db.feed.getAll()) out[f.name] = feedToJson(f);
    return json(out);
  }),
  route("POST", "/api/v2/rss/refreshItem", async (request) => {
    const f = db.feed.findFirst({
      where: { name: { equals: (await params(request)).get("itemPath") ?? "" } },
    });
    if (f) {
      db.feed.update({ where: { name: { equals: f.name } }, data: { isLoading: true } });
      setTimeout(
        () =>
          db.feed.update({
            where: { name: { equals: f.name } },
            data: { isLoading: false, lastBuildDate: new Date().toUTCString() },
          }),
        1500,
      );
    }
    return ok();
  }),
  route("POST", "/api/v2/rss/markAsRead", async (request) => {
    const p = await params(request);
    const articleId = p.get("articleId");
    const where = articleId
      ? { id: { equals: articleId } }
      : { feedName: { equals: p.get("itemPath") ?? "" } };
    db.article.updateMany({ where: where as never, data: { isRead: true } });
    return ok();
  }),
  route("POST", "/api/v2/rss/markAsUnread", async (request) => {
    const p = await params(request);
    db.article.updateMany({
      where: { feedName: { equals: p.get("itemPath") ?? "" } } as never,
      data: { isRead: false },
    });
    return ok();
  }),
  route("POST", "/api/v2/rss/addFeed", async (request) => {
    const p = await params(request);
    const url = p.get("url") ?? "";
    const name =
      p.get("path") ??
      (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return "new-feed";
        }
      })();
    if (url && !db.feed.findFirst({ where: { name: { equals: name } } })) {
      db.feed.create({
        name,
        uid: `f${db.feed.count() + 1}`,
        url,
        lastBuildDate: "",
        isLoading: true,
        hasError: false,
      });
      setTimeout(() => {
        const f = db.feed.findFirst({ where: { name: { equals: name } } });
        if (!f) return;
        db.feed.update({ where: { name: { equals: name } }, data: { isLoading: false } });
        db.article.create({
          id: `live${++sequences.article}`,
          feedName: name,
          title: `示例文章 — ${name}`,
          date: new Date().toUTCString(),
          link: url,
          description: "新订阅的首个条目(demo)",
          isRead: false,
          torrentURL: url,
        });
      }, 2000);
    }
    return ok();
  }),
  route("POST", "/api/v2/rss/removeItem", async (request) => {
    const name = (await params(request)).get("path") ?? "";
    db.feed.delete({ where: { name: { equals: name } } });
    db.article.deleteMany({ where: { feedName: { equals: name } } });
    return ok();
  }),
  route("POST", "/api/v2/rss/moveItem", () => ok()),
  route("GET", "/api/v2/rss/rules", () => json(demoRules)),
  route("POST", "/api/v2/rss/setRule", async (request) => {
    const p = await params(request);
    const name = p.get("ruleName") ?? "";
    if (name) {
      try {
        demoRules[name] = p.get("ruleDef")
          ? JSON.parse(p.get("ruleDef") ?? "{}")
          : {
              enabled: true,
              mustContain: "",
              mustNotContain: "",
              useRegex: false,
              episodeFilter: "",
              smartFilter: false,
              previouslyMatchedEpisodes: [],
              affectedFeeds: [],
              ignoreDays: 0,
              lastMatch: "",
              addPaused: false,
              assignedCategory: "",
              savePath: "",
            };
      } catch {
        /* ignore invalid json */
      }
    }
    return ok();
  }),
  route("POST", "/api/v2/rss/renameRule", () => ok()),
  route("POST", "/api/v2/rss/removeRule", async (request) => {
    delete demoRules[(await params(request)).get("ruleName") ?? ""];
    return ok();
  }),
  route("GET", "/api/v2/rss/matchingArticles", () => json({})),

  // --- search ---
  route("GET", "/api/v2/search/plugins", () =>
    json(
      db.searchPlugin.getAll().map((p) => ({
        enabled: p.enabled,
        fullName: p.fullName,
        name: p.name,
        supportedCategories: p.supportedCategories,
        url: p.url,
        version: p.version,
      })),
    ),
  ),
  route("POST", "/api/v2/search/enablePlugin", async (request) => {
    const p = await params(request);
    const names = (p.get("names") ?? "").split("|").filter(Boolean);
    const enable = p.get("enable") === "true";
    for (const plugin of db.searchPlugin.getAll())
      if (names.includes(plugin.name) || names.includes("all"))
        db.searchPlugin.update({
          where: { name: { equals: plugin.name } },
          data: { enabled: enable },
        });
    return ok();
  }),
  route("POST", "/api/v2/search/installPlugin", () => ok()),
  route("POST", "/api/v2/search/uninstallPlugin", async (request) => {
    const names = ((await params(request)).get("names") ?? "").split("|").filter(Boolean);
    for (const name of names) db.searchPlugin.delete({ where: { name: { equals: name } } });
    return ok();
  }),
  route("POST", "/api/v2/search/start", async (request) => {
    const id = ++sequences.searchJob;
    db.searchJob.create({
      id,
      status: "Running",
      pattern: (await params(request)).get("pattern") ?? "",
      startedAt: Date.now(),
    });
    return json({ id });
  }),
  route("GET", "/api/v2/search/status", () => {
    for (const job of db.searchJob.getAll())
      if (job.status === "Running" && Date.now() - job.startedAt > 6000)
        db.searchJob.update({ where: { id: { equals: job.id } }, data: { status: "Stopped" } });
    return json(
      db.searchJob.getAll().map((j) => ({
        id: j.id,
        status: j.status,
        total: j.status === "Stopped" ? searchResultsFor(j.pattern).length : -1,
      })),
    );
  }),
  route("GET", "/api/v2/search/results", (request) => {
    const sp = new URL(request.url).searchParams;
    const job = db.searchJob.findFirst({ where: { id: { equals: Number(sp.get("id") ?? 0) } } });
    // Real engines stream results while Running: delivered progressively over the first 4s, Stopped at 6s
    // (the page only polls results while Running and stops after Stopped)
    const all = job ? searchResultsFor(job.pattern) : [];
    const progress =
      !job || job.status === "Stopped" ? 1 : Math.min(1, (Date.now() - job.startedAt) / 4000);
    const visible = all.slice(0, Math.ceil(all.length * progress));
    const offset = Number(sp.get("offset") ?? 0);
    const limit = Number(sp.get("limit") ?? 500);
    return json({
      results: visible.slice(offset, offset + limit),
      status: job?.status ?? "Stopped",
      total: visible.length,
      offset,
      limit,
    });
  }),
  route("POST", "/api/v2/search/stop", async (request) => {
    const job = db.searchJob.findFirst({
      where: { id: { equals: Number((await params(request)).get("id") ?? 0) } },
    });
    if (job)
      db.searchJob.update({ where: { id: { equals: job.id } }, data: { status: "Stopped" } });
    return ok();
  }),
  route("POST", "/api/v2/search/delete", async (request) => {
    db.searchJob.delete({
      where: { id: { equals: Number((await params(request)).get("id") ?? 0) } },
    });
    return ok();
  }),

  // --- Logs ---
  route("GET", "/api/v2/log/main", (request) => {
    const lastId = Number(new URL(request.url).searchParams.get("last_known_id") ?? -1);
    return json(db.logEntry.findMany({ where: { id: { gte: lastId + 1 } } }).slice(-500));
  }),
  route("GET", "/api/v2/log/peers", () => json(db.peerLogEntry.getAll().slice(-500))),

  // --- Catch-all: remaining /api/v2/* never reach the real network ---
  route("*", "/api/v2/*", (request) =>
    request.method === "GET"
      ? new HttpResponse("Ok.", { headers: { "Content-Type": "text/plain" } })
      : ok(),
  ),
];

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

seedAll();

// MSW handlers derived from the route table (SW mode: HTTPS / localhost)
const handlers = routes.map(({ method, path, fn }) =>
  method === "*"
    ? http.all(path, ({ request }) => fn(request))
    : http[method === "GET" ? "get" : "post"](path, ({ request }) => fn(request)),
);

const worker = setupWorker(...handlers);
let started: Promise<void> | null = null;

/**
 * Plain-HTTP fallback: service workers need a secure context (HTTPS/localhost);
 * navigator.serviceWorker is undefined over plain http on LAN IPs — so we patch
 * window.fetch and route /api/v2/* through the same route table; identical data flow.
 */
function installFetchFallback() {
  const exact = new Map<string, RouteFn>();
  let catchAll: RouteFn | null = null;
  for (const { method, path, fn } of routes) {
    if (path === "/api/v2/*") catchAll = fn;
    else exact.set(`${method} ${path}`, fn);
  }
  const realFetch = window.fetch.bind(window);
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req =
      input instanceof Request
        ? input
        : new Request(new URL(String(input), window.location.href), init);
    const pathname = new URL(req.url).pathname;
    const hit =
      exact.get(`${req.method} ${pathname}`) ??
      (pathname.startsWith("/api/v2/") ? catchAll : undefined);
    if (hit) return hit(req);
    return realFetch(input as Parameters<typeof fetch>[0], init);
  }) as typeof fetch;
}

/** Called by main.tsx in demo mode; the tick loop starts once interception is ready */
export function startDemo(): Promise<void> {
  if (!started) {
    const boot = () => {
      setInterval(tick, 1000);
      tick();
    };
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      started = worker
        .start({
          serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
          quiet: true,
          onUnhandledRequest: "bypass",
        })
        .then(boot)
        .catch(() => {
          installFetchFallback();
          boot();
        });
    } else {
      installFetchFallback();
      boot();
      started = Promise.resolve();
    }
  }
  return started;
}
