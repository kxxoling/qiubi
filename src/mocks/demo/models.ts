/**
 * Demo-mode data models (@mswjs/data)
 *
 * MSW's companion stateful mock database: model definitions + CRUD + relational queries,
 * replacing hand-rolled Maps and bookkeeping. Seeds live in seed.ts, HTTP handlers in server.ts.
 */
import { factory, primaryKey } from "@mswjs/data";

/**
 * Mutable core of a torrent: the full 66-field torrents/info record is projected at read time by server.ts's
 * toTorrentInfo() (derived fields always reflect current state).
 */
export const db = factory({
  torrent: {
    hash: primaryKey(String),
    name: String,
    size: Number,
    state: String,
    progress: Number,
    category: String,
    tags: String,
    tracker: String,
    addedOn: Number,
    dlspeed: Number,
    upspeed: Number,
    ratio: Number,
    uploaded: Number,
    numSeeds: Number,
    numLeechs: Number,
    numComplete: Number,
    numIncomplete: Number,
  },
  file: {
    id: primaryKey(Number),
    torrentHash: String,
    name: String,
    size: Number,
    progress: Number,
    priority: Number,
  },
  category: {
    name: primaryKey(String),
    savePath: String,
  },
  tag: {
    name: primaryKey(String),
  },
  feed: {
    name: primaryKey(String),
    uid: String,
    url: String,
    lastBuildDate: String,
    isLoading: Boolean,
    hasError: Boolean,
  },
  article: {
    id: primaryKey(String),
    feedName: String,
    title: String,
    date: String,
    link: String,
    description: String,
    isRead: Boolean,
    torrentURL: String,
  },
  searchPlugin: {
    name: primaryKey(String),
    fullName: String,
    enabled: Boolean,
    url: String,
    version: String,
    supportedCategories: () => ["all" as string],
  },
  searchJob: {
    id: primaryKey(Number),
    status: String,
    pattern: String,
    startedAt: Number,
  },
  logEntry: {
    id: primaryKey(Number),
    message: String,
    timestamp: Number,
    type: Number,
  },
  peerLogEntry: {
    id: primaryKey(Number),
    timestamp: Number,
    blocked: Boolean,
    ip: String,
    reason: String,
  },
});

export type TorrentEntity = ReturnType<typeof db.torrent.create>;
export type FileEntity = ReturnType<typeof db.file.create>;
export type FeedEntity = ReturnType<typeof db.feed.create>;
export type ArticleEntity = ReturnType<typeof db.article.create>;

/** Auto-increment ids (file / log / searchJob / runtime-created articles) */
export const sequences = {
  file: 0,
  log: 1000,
  peerLog: 5000,
  searchJob: 100,
  torrent: 0,
  article: 0,
};
