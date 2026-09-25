/** qBittorrent API type definitions */

// --- Authentication ---
export type AuthLoginParams = {
  username: string;
  password: string;
};

// --- Application ---
export type AppBuildInfo = {
  qt: string;
  libtorrent: string;
  boost: string;
  openssl: string;
  bitness: number;
};

/**
 * qBT preferences. qBT has hundreds of preference keys; only the fields used
 * by this project are typed here — the rest stay loosely typed via the index
 * signature (setPreferences accepts any valid preference key).
 */
export type AppPreferences = {
  /** Listen port */
  listen_port?: number;
  /** UPnP/NAT-PMP port mapping */
  upnp?: boolean;
  /** Global download speed limit (KiB/s, 0 = unlimited) */
  dl_limit?: number;
  /** Global upload speed limit (KiB/s, 0 = unlimited) */
  up_limit?: number;
  /** Alternative speed limits: download (KiB/s) */
  alt_dl_limit?: number;
  /** Alternative speed limits: upload (KiB/s) */
  alt_up_limit?: number;
  /** Enable alternative speed schedule */
  scheduler_enabled?: boolean;
  schedule_from_hour?: number;
  schedule_from_min?: number;
  schedule_to_hour?: number;
  schedule_to_min?: number;
  /** Schedule days: 0=every day 1=weekdays 2=weekend (official key scheduler_days) */
  scheduler_days?: number;
  /** Global max connections (-1 = unlimited) */
  max_connec?: number;
  /** Max connections per torrent (-1 = unlimited) */
  max_connec_per_torrent?: number;
  /** DHT network */
  dht?: boolean;
  /** PeX */
  pex?: boolean;
  /** Local Service Discovery LSD (official qBT key name) */
  lsd?: boolean;
  /** Encryption: 0=disabled 1=preferred 2=required */
  encryption?: number;
  /** Anonymous mode */
  anonymous_mode?: boolean;
  /** Enable torrent queueing */
  queueing_enabled?: boolean;
  max_active_downloads?: number;
  max_active_torrents?: number;
  max_active_uploads?: number;
  /** Seeding limits: enable share-ratio limit */
  max_ratio_enabled?: boolean;
  /** Share-ratio limit */
  max_ratio?: number;
  /** Seeding limits: enable seeding-time limit */
  max_seeding_time_enabled?: boolean;
  /** Seeding time limit (minutes) */
  max_seeding_time?: number;
  /** Pre-allocate disk space */
  preallocate_all?: boolean;
  /** WebUI port */
  web_ui_port?: number;
  /** WebUI username */
  web_ui_username?: string;
  /** WebUI new password (empty on submit = unchanged) */
  web_ui_password?: string;
  /** WebUI session timeout (seconds) */
  web_ui_session_timeout?: number;
  /** Max login failures */
  web_ui_max_auth_fail_count?: number;
  /** Ban duration (seconds) */
  web_ui_ban_duration?: number;
  /** CSRF protection (must be disabled when debugging behind a reverse proxy) */
  web_ui_csrf_protection_enabled?: boolean;
  /** Host header validation */
  web_ui_host_header_validation_enabled?: boolean;
  /** Default save path */
  save_path?: string;
  /** Add paused (qBT 5.x key; 4.x uses start_paused_enabled) */
  add_stopped_enabled?: boolean;
  start_paused_enabled?: boolean;
  [key: string]: unknown;
};

// --- Transfer ---
export type TransferInfo = {
  dl_info_speed: number;
  dl_info_data: number;
  up_info_speed: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  dht_nodes: number;
  connection_status: "connected" | "firewalled" | "disconnected";
  fresh_session: boolean;
  /** Free space in the save directory (qBT sync/maindata; may return -1 in containers) */
  free_space_on_disk?: number;
};

// --- Torrent ---
export type TorrentState =
  | "error"
  | "missingFiles"
  | "uploading"
  /** qBT 5.x: pausedUP renamed to stoppedUP (old value kept for 4.x compat) */
  | "pausedUP"
  | "stoppedUP"
  | "queuedUP"
  | "stalledUP"
  | "checkingUP"
  | "forcedUP"
  | "allocating"
  | "downloading"
  | "metaDL"
  /** qBT 5.x: pausedDL renamed to stoppedDL (old value kept for 4.x compat) */
  | "pausedDL"
  | "stoppedDL"
  | "queuedDL"
  | "stalledDL"
  | "checkingDL"
  | "forcedDL"
  | "checkingResumeData"
  | "moving"
  | "unknown";

export type TorrentInfo = {
  added_on: number;
  amount_left: number;
  auto_tmm: boolean;
  availability: number;
  category: string;
  completed: number;
  completion_on: number;
  content_path: string;
  dl_limit: number;
  dlspeed: number;
  download_path: string;
  downloaded: number;
  downloaded_session: number;
  eta: number;
  f_l_piece_prio: boolean;
  force_start: boolean;
  hash: string;
  infohash_v1: string;
  infohash_v2: string;
  last_activity: number;
  magnet_uri: string;
  max_ratio: number;
  max_seeding_time: number;
  name: string;
  num_complete: number;
  num_incomplete: number;
  num_leechs: number;
  num_seeds: number;
  priority: number;
  progress: number;
  ratio: number;
  ratio_limit: number;
  save_path: string;
  seeding_time: number;
  seeding_time_limit: number;
  seen_complete: number;
  seq_dl: boolean;
  size: number;
  state: TorrentState;
  super_seeding: boolean;
  tags: string;
  time_elapsed: number;
  total_size: number;
  tracker: string;
  trackers_count: number;
  up_limit: number;
  uploaded: number;
  uploaded_session: number;
  upspeed: number;
};

export type TorrentFiles = {
  index: number;
  name: string;
  size: number;
  progress: number;
  priority: number;
  is_seed: boolean;
  piece_range: [number, number];
  availability: number;
};

export type TorrentTracker = {
  url: string;
  status: number;
  tier: number;
  num_peers: number;
  num_seeds: number;
  num_leeches: number;
  num_downloaded: number;
  num_downloaded_session: number;
  msg: string;
};

export type TorrentPeer = {
  client: string;
  connection: string;
  country: string;
  country_code: string;
  dl_speed: number;
  downloaded: number;
  files: string;
  flags: string;
  flags_desc: string;
  ip: string;
  port: number;
  progress: number;
  relevance: number;
  up_speed: number;
  uploaded: number;
};

export type TorrentProperties = {
  addition_date: number;
  comment: string;
  completion_date: number;
  created_by: string;
  creation_date: number;
  dl_limit: number;
  download_path: string;
  hash: string;
  infohash_v1: string;
  infohash_v2: string;
  last_seen: number;
  name: string;
  nb_connections: number;
  nb_connections_limit: number;
  peers: number;
  peers_total: number;
  piece_size: number;
  pieces_have: number;
  pieces_num: number;
  reannounce: number;
  save_path: string;
  seeding_time: number;
  seeds: number;
  seeds_total: number;
  share_ratio: number;
  time_elapsed: number;
  total_downloaded: number;
  total_downloaded_session: number;
  total_size: number;
  total_uploaded: number;
  total_uploaded_session: number;
  up_limit: number;
  upload_payload: number;
  up_speed: number;
};

// --- Sync ---
export type SyncMainData = {
  rid: number;
  full_update?: boolean;
  torrents?: Record<string, Partial<TorrentInfo>>;
  torrents_removed?: string[];
  categories?: Record<string, { name: string; savePath: string }>;
  categories_removed?: string[];
  tags?: string[];
  tags_removed?: string[];
  server_state?: Partial<TransferInfo>;
  /** tracker URL → member torrent hashes (qBT's actual sync/maindata shape) */
  trackers?: Record<string, string[]>;
  trackers_removed?: string[];
};

// --- RSS ---
export type RssFeed = {
  uid: string;
  url: string;
  title: string;
  isLoading?: boolean;
  /** true when the last server-side fetch of this feed failed */
  hasError?: boolean;
  articles?: RssArticle[];
  /** qBT folder: nested structure of the same shape */
  children?: Record<string, RssFeed>;
};

export type RssArticle = {
  id: string;
  title: string;
  /** qBT 5.x returns a formatted string (e.g. "25 Aug 2026 20:02:53 +0000");
   *  older versions return a Unix timestamp in seconds */
  date: string | number;
  link: string;
  description?: string;
  isRead?: boolean;
  torrentURL: string;
};

export type RssAutoDownloadingRule = {
  enabled: boolean;
  mustContain: string;
  mustNotContain: string;
  useRegex: boolean;
  episodeFilter: string;
  smartFilter: boolean;
  previouslyMatchedEpisodes: string[];
  affectedFeeds: string[];
  ignoreDays: number;
  lastMatch: string;
  addPaused: boolean;
  assignedCategory: string;
  savePath: string;
  /** Added in qBT 5.x */
  priority?: number;
  torrentContentLayout?: string | null;
  torrentParams?: Record<string, unknown>;
};

// --- Search ---
export type SearchResult = {
  descrLink: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  nbLeechers: number;
  nbSeeders: number;
  siteUrl: string;
};

export type SearchStatus = {
  id: number;
  status: "Running" | "Stopped";
  total: number;
};

export type SearchPlugin = {
  enabled: boolean;
  fullName: string;
  name: string;
  supportedCategories: string[];
  url: string;
  version: string;
};

// --- Log ---
export type LogEntry = {
  id: number;
  message: string;
  timestamp: number;
  type: number;
};

/** /log/peers: IP block records (the blocked field is present in practice but
 *  undocumented) */
export type PeerLogEntry = {
  id: number;
  ip: string;
  reason: string;
  timestamp: number;
  blocked?: boolean;
};

// --- Categories & Tags ---
export type Category = {
  name: string;
  savePath: string;
};
