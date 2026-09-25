/**
 * Demo-mode seed data
 *
 * Regular torrents are all freely distributable content (Linux distros /
 * Blender open movies / Creative Commons music / public-domain books), declared
 * as tuples with generator-expanded files; plus 3 synthetic edge-case torrents
 * (deep nesting / hundred files / overflow names, file trees from src/mocks/fixtures).
 * faker is seeded so every visit to the demo sees identical data.
 */
import { faker } from "@faker-js/faker/locale/en";
import datasetFiles from "../fixtures/dataset-files.json" with { type: "json" };
import flatManyFiles from "../fixtures/flat-many-files.json" with { type: "json" };
import overflowFiles from "../fixtures/overflow-files.json" with { type: "json" };
import { db, sequences, type TorrentEntity } from "./models";

faker.seed(20260917);

/** qBT files endpoint shape (synthetic fixture, demo-relevant fields only) */
type CapturedFile = { name: string; size: number; priority?: number };

export const DEMO_TRACKERS = [
  "https://tracker.opentrackr.org:443/announce",
  "http://tracker.openbittorrent.com:80/announce",
  "https://exodus.desync.com:6969/announce",
  "https://tracker.torrent.eu.org:451/announce",
];

/** [name, total size MB, state, progress, category, tags] */
type SeedTuple = [string, number, string, number, string, string];

const seeds: SeedTuple[] = [
  ["ubuntu-25.04.1-desktop-amd64.iso", 5889, "downloading", 0.42, "distro", "desktop,lts"],
  ["debian-13.1.0-amd64-DVD-1.iso", 3725, "downloading", 0.78, "distro", "dvd"],
  ["fedora-workstation-live-x86_64-43.iso", 2254, "downloading", 0.13, "distro", ""],
  [
    "Blender.Open.Movie.Big.Buck.Bunny.4K.60fps",
    14531,
    "downloading",
    0.31,
    "movies",
    "animation,4k",
  ],
  ["Blender.Open.Movie.Sintel.1080p.x264", 982, "uploading", 1, "movies", "animation,1080p"],
  ["Tears.of.Steel.2K.Open.Movie", 1200, "stalledUP", 1, "movies", "sci-fi"],
  ["Cosmos.Laundromat.Open.Movie.1080p", 726, "uploading", 1, "movies", "animation"],
  ["Free.Music.Sampler.Vol.7.CC-BY-FLAC", 2646, "stalledDL", 0.66, "music", "flac,cc"],
  [
    "Internet.Archive.Soldering.Electronics.Course.1080p",
    5424,
    "stoppedDL",
    0.54,
    "courses",
    "electronics,archive",
  ],
  ["linuxmint-23.2-cinnamon-64bit.iso", 2930, "stoppedUP", 1, "distro", "desktop"],
  ["LibreOffice_26.2_Linux_x86-64_deb", 356, "queuedDL", 0, "software", "office"],
  ["GIMP.3.0.manuals.multi-language.PDF", 1229, "error", 0.92, "ebooks", "gimp,docs"],
  ["NixOS.25.05.minimal.x86_64-linux.iso", 1010, "metaDL", 0, "distro", ""],
  [
    "Project.Gutenberg.Top.100.Books.2026.epub",
    493,
    "checkingResumeData",
    0.87,
    "ebooks",
    "gutenberg,public-domain",
  ],
];

/** Generate the file tree per category: [fileName, sizeMB][] (sizes scale to the seed's total) */
function filesFor(name: string, sizeMB: number, category: string): [string, number][] {
  switch (category) {
    case "distro":
    case "software":
      return [[name, sizeMB]];
    case "movies":
      return [
        [`${name}/movie.mkv`, sizeMB * 0.92],
        [`${name}/trailer.mkv`, sizeMB * 0.04],
        [`${name}/poster.jpg`, 9],
        [`${name}/subtitles_en.srt`, 1],
        [`${name}/README.txt`, 0],
      ];
    case "music": {
      const tracks = [
        "Aurora",
        "Nightdrive",
        "Paper Planes",
        "Signal Lost",
        "Ghost Radio",
        "Monsoon",
        "City Lights",
        "Slow Tide",
      ];
      return tracks.map(
        (t, i) =>
          [`${name}/disc1_${String(i + 1).padStart(2, "0")}-${t}.flac`, sizeMB / tracks.length] as [
            string,
            number,
          ],
      );
    }
    case "courses":
      return Array.from(
        { length: 24 },
        (_, i) =>
          [`${name}/lesson${String(i + 1).padStart(2, "0")}.mkv`, sizeMB / 24] as [string, number],
      );
    default:
      return Array.from(
        { length: 20 },
        (_, i) =>
          [`${name}/book_${String(i + 1).padStart(2, "0")}.epub`, sizeMB / 20] as [string, number],
      );
  }
}

const MB = 1024 * 1024;
const nowSec = () => Math.floor(Date.now() / 1000);

/** Deterministic pseudo-random (0..1) for derived display fields, separate from faker's runtime jitter */
const det = (s: string) =>
  (Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % 10000) / 10000;

/** Idempotent: called once at demo module load; repeated calls (tests/HMR) are no-ops */
let seeded = false;

export function seedAll() {
  if (seeded) return;
  seeded = true;
  for (const [name, sizeMB, state, progress, category, tags] of seeds) {
    const dl = state === "downloading";
    const up = ["uploading", "stalledUP", "stoppedUP"].includes(state);
    // hash must be pure hex (float→hex introduces illegal chars like ".")
    const detHash = Array.from({ length: 8 }, (_, i) =>
      Math.floor(det(`${name}#${i}`) * 0xfffff)
        .toString(16)
        .padStart(5, "0"),
    ).join("");
    const torrent: TorrentEntity = db.torrent.create({
      hash: detHash,
      name,
      size: sizeMB * MB,
      state,
      progress,
      category,
      tags,
      tracker:
        state === "error"
          ? ""
          : DEMO_TRACKERS[Math.floor(det(name) * DEMO_TRACKERS.length) % DEMO_TRACKERS.length],
      addedOn: nowSec() - Math.floor(det(`a${name}`) * 20160) * 60,
      dlspeed: dl ? Math.floor((1.2 + det(name) * 5.8) * MB) : 0,
      upspeed: up && state !== "stoppedUP" ? Math.floor((0.2 + det(`${name}u`) * 2.3) * MB) : 0,
      ratio: up ? +(1.5 + det(`${name}r`) * 8).toFixed(2) : 0,
      uploaded: up ? Math.floor(sizeMB * MB * (2 + det(`${name}r`) * 6)) : 0,
      numSeeds: dl || up ? 3 + Math.floor(det(name) * 50) : 0,
      numLeechs: dl || up ? 2 + Math.floor(det(name) * 30) : 0,
      numComplete: 5 + Math.floor(det(name) * 400),
      numIncomplete: 1 + Math.floor(det(name) * 60),
    });
    for (const [fileName, fileMB] of filesFor(name, sizeMB, category)) {
      db.file.create({
        id: ++sequences.file,
        torrentHash: torrent.hash,
        name: fileName,
        size: Math.max(Math.floor(fileMB * MB), 1024),
        progress: Math.min(1, Math.max(0, progress + (det(fileName) - 0.4) * 0.2)),
        priority: 1,
      });
    }
  }

  // --- Edge-case showcase torrents: file trees taken verbatim from the synthetic
  // fixtures (67-file 6-level tree / 100 flat files / overflow names) ---
  for (const [name, filesJson, state, progress] of [
    ["qiubi-test-dataset", datasetFiles, "stalledDL", 0.31],
    ["qiubi-test-flat-many", flatManyFiles, "stalledDL", 0.08],
    [
      "qiubi-test-overflow-超长种子名称测试超长种子名称测试超长种子名称测试超长种子名称测试超长种子名称测试超长种子",
      overflowFiles,
      "queuedDL",
      0,
    ],
  ] as [string, CapturedFile[], string, number][]) {
    const size = filesJson.reduce((sum, f) => sum + f.size, 0);
    const t = db.torrent.create({
      hash: Array.from({ length: 8 }, (_, i) =>
        Math.floor(det(`${name}#${i}`) * 0xfffff)
          .toString(16)
          .padStart(5, "0"),
      ).join(""),
      name,
      size,
      state,
      progress,
      category: "",
      tags: "synthetic",
      tracker: "http://192.0.2.1:6969/announce", // RFC 5737 TEST-NET, dead address reserved for synthetic torrents
      addedOn: nowSec() - Math.floor(det(name) * 20160) * 60,
      dlspeed: 0,
      upspeed: 0,
      ratio: 0,
      uploaded: 0,
      numSeeds: 0,
      numLeechs: 0,
      numComplete: 0,
      numIncomplete: 1,
    });
    for (const f of filesJson) {
      db.file.create({
        id: ++sequences.file,
        torrentHash: t.hash,
        name: f.name,
        size: Math.max(f.size, 1),
        progress: Math.min(1, Math.max(0, progress + (det(f.name) - 0.4) * 0.2)),
        priority: f.priority ?? 1,
      });
    }
  }

  for (const [name, path] of [
    ["distro", "/downloads/distro"],
    ["movies", "/downloads/movies"],
    ["music", "/downloads/music"],
    ["courses", "/downloads/courses"],
    ["software", "/downloads/software"],
    ["ebooks", "/downloads/ebooks"],
  ])
    db.category.create({ name, savePath: path });

  for (const tag of [
    "desktop",
    "animation",
    "4k",
    "1080p",
    "flac",
    "cc",
    "archive",
    "office",
    "docs",
    "lts",
    "dvd",
    "sci-fi",
    "gutenberg",
    "public-domain",
    "electronics",
    "gimp",
  ])
    db.tag.create({ name: tag });

  // --- RSS: feeds + articles (foreign-key relation) ---
  const feeds: [string, string, [string, number][]][] = [
    [
      "Distro releases",
      "https://example.com/rss/distro",
      [
        ["Ubuntu 25.10 beta (Oracular) live amd64", 3],
        ["Debian 13.2 point release", 6],
        ["Fedora Workstation 44 alpha", 8],
        ["NixOS 25.11 minimal", 12],
        ["Arch Linux monthly snapshot", 16],
        ["Linux Mint 23.3 edge", 22],
        ["openSUSE Tumbleweed snapshot", 26],
      ],
    ],
    [
      "Blender Studio",
      "https://example.com/rss/blender",
      [
        ["Coffee Run — new open movie short", 5],
        ["Spring open movie 4K remaster", 30],
        ["Charge (open movie) 1440p", 54],
        ["Agent 327: Operation Barbershop", 78],
        ["Caminandes 3: Llamigos", 102],
      ],
    ],
    [
      "Project Gutenberg",
      "https://example.com/rss/gutenberg",
      [
        ["New: Complete works of Shakespeare (epub)", 11],
        ["A Tale of Two Cities — Dickens", 28],
        ["Frankenstein — Mary Shelley", 46],
        ["The Picture of Dorian Gray", 70],
        ["Moby Dick — Melville", 96],
        ["Pride and Prejudice — Austen", 120],
      ],
    ],
  ];
  // ids must be unique: short random strings collide as primary keys (observed data loss); use a sequence
  let articleSeq = 0;
  for (const [fi, [name, url, articles]] of feeds.entries()) {
    db.feed.create({
      name,
      uid: `f${fi + 1}`,
      url,
      lastBuildDate: faker.date.recent({ days: 1 }).toUTCString(),
      isLoading: false,
      hasError: false,
    });
    for (const [title, hoursAgo] of articles) {
      const file = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.torrent`;
      db.article.create({
        id: `a${++articleSeq}`,
        feedName: name,
        title,
        date: faker.date.recent({ days: hoursAgo / 24 }).toUTCString(),
        link: `${url}/${file}`,
        description: `Torrent: ${file}`,
        isRead: det(title) > 0.55,
        torrentURL: `${url}/${file}`,
      });
    }
  }

  for (const plugin of [
    ["solid", "Solid Torrents", true, ["all", "movies", "music", "software"]],
    ["limetorrents", "limetorrents", true, ["all", "movies", "music"]],
    ["eztv", "eztv", false, ["all", "tv"]],
    ["gutenberg", "gutenberg", true, ["all", "books"]],
  ])
    db.searchPlugin.create({
      name: plugin[0] as string,
      fullName: plugin[1] as string,
      enabled: plugin[2] as boolean,
      url: `https://example.com/${plugin[0]}`,
      version: "1.0",
      supportedCategories: plugin[3] as string[],
    });

  for (const [message, type, secondsAgo] of [
    ["qBittorrent v5.2.3 started", 1, 7200],
    ["Web UI: listening on port 18080", 1, 7199],
    ["DHT support: ON, port: 6881", 1, 7198],
    ["PeX support: ON", 1, 7198],
    ["Local peer discovery support: ON", 1, 7198],
    ["Tracker: Successfully announced to tracker.opentrackr.org", 1, 7100],
    ["'ubuntu-25.04.1-desktop-amd64.iso' restored from resume data", 1, 7000],
    ["Scheduled RSS refresh completed (3 feeds)", 1, 6600],
    ["RSS rule 'distro-auto' matched: Ubuntu 25.10 beta", 1, 6500],
    ["Detected port(s) forwarding success via UPnP", 1, 6000],
    ["I/O warning: disk almost full on /downloads (92%)", 2, 5400],
    ["'GIMP.3.0.manuals' errored: torrent file missing or renamed", 4, 3600],
    ["External IP detected: 203.0.113.42", 1, 1200],
  ] as [string, number, number][])
    db.logEntry.create({ id: ++sequences.log, message, timestamp: nowSec() - secondsAgo, type });

  for (let i = 0; i < 20; i++)
    db.peerLogEntry.create({
      id: ++sequences.peerLog,
      timestamp: nowSec() - i * 137,
      blocked: i % 3 === 0,
      ip: `198.51.100.${20 + i}`,
      reason: i % 3 === 0 ? "banned by peer" : "",
    });
}

// RSS download rules: stored as plain values (no key semantics, not worth modeling)
export const demoRules: Record<string, unknown> = {
  "distro-auto": {
    enabled: true,
    mustContain: "(ubuntu|debian|fedora).*iso",
    mustNotContain: "beta|alpha",
    useRegex: true,
    episodeFilter: "",
    smartFilter: false,
    previouslyMatchedEpisodes: [],
    affectedFeeds: ["Distro releases"],
    ignoreDays: 0,
    lastMatch: faker.date.recent({ days: 0.25 }).toUTCString(),
    addPaused: false,
    assignedCategory: "distro",
    savePath: "/downloads/distro",
    torrentContentLayout: null,
    stopCondition: null,
  },
  "blender-4k": {
    enabled: true,
    mustContain: "4k",
    mustNotContain: "",
    useRegex: false,
    episodeFilter: "",
    smartFilter: false,
    previouslyMatchedEpisodes: [],
    affectedFeeds: ["Blender Studio"],
    ignoreDays: 3,
    lastMatch: "",
    addPaused: true,
    assignedCategory: "movies",
    savePath: "/downloads/movies",
    torrentContentLayout: null,
    stopCondition: null,
  },
};
