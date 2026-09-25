/**
 * qBittorrent API mock data mapping
 *
 * Data structures stay consistent with the mocks in the existing e2e spec files.
 * Keys are API pathnames (without the /api/v2/ prefix), values are response bodies.
 */

export type MockHandler = {
  body: string | number | boolean | object;
  contentType: string;
  /** Defaults to GET when unspecified (matching qBT read endpoints) */
  method?: "GET" | "POST";
};

export const mockHandlers: Record<string, MockHandler> = {
  "auth/login": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "auth/logout": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "app/version": {
    body: "v5.0.0",
    contentType: "text/plain",
  },
  "app/webapiVersion": {
    body: "2.11.2",
    contentType: "text/plain",
  },
  "app/buildInfo": {
    body: {
      qt: "6.7.0",
      libtorrent: "2.0.10.0",
      boost: "1.85.0",
      openssl: "3.3.0",
      bitness: 64,
    },
    contentType: "application/json",
  },
  "app/defaultSavePath": {
    body: "/downloads",
    contentType: "text/plain",
  },
  "app/preferences": {
    body: {
      listen_port: 6881,
      upnp: true,
      dl_limit: 0,
      up_limit: 0,
      alt_dl_limit: 1024,
      alt_up_limit: 512,
      scheduler_enabled: false,
      max_connec: 500,
      max_connec_per_torrent: 100,
      dht: true,
      pex: true,
      lsd: true,
      encryption: 1,
      anonymous_mode: false,
      queueing_enabled: false,
      max_active_downloads: 3,
      max_active_uploads: 3,
      max_active_torrents: 5,
      max_ratio_enabled: false,
      max_ratio: 2,
      max_seeding_time_enabled: false,
      max_seeding_time: 1440,
      preallocate_all: false,
      web_ui_port: 18080,
      web_ui_username: "admin",
      web_ui_session_timeout: 3600,
      web_ui_max_auth_fail_count: 5,
      web_ui_ban_duration: 3600,
      web_ui_csrf_protection_enabled: true,
      web_ui_host_header_validation_enabled: true,
      save_path: "/downloads",
      add_stopped_enabled: false,
    },
    contentType: "application/json",
  },
  "transfer/speedLimitsMode": {
    body: "0",
    contentType: "text/plain",
  },
  "transfer/globalDlLimit": {
    body: "-1",
    contentType: "text/plain",
  },
  "transfer/globalUpLimit": {
    body: "-1",
    contentType: "text/plain",
  },
  "transfer/info": {
    body: {
      dl_info_speed: 1048576,
      up_info_speed: 524288,
      dl_info_data: 1073741824,
      up_info_data: 536870912,
      dl_rate_limit: -1,
      up_rate_limit: -1,
      dht_nodes: 150,
      connection_status: "connected",
      fresh_session: false,
    },
    contentType: "application/json",
  },
  "torrents/info": {
    body: [
      {
        hash: "abc123",
        name: "Test Torrent 1",
        size: 1073741824,
        progress: 0.5,
        dlspeed: 524288,
        upspeed: 131072,
        eta: 3600,
        state: "downloading",
        category: "movies",
        tags: "",
        save_path: "/downloads",
        added_on: 1700000000,
        completion_on: -1,
        ratio: 0.5,
        num_complete: 10,
        num_incomplete: 5,
        magnet_uri: "magnet:?xt=urn:btih:abc123",
      },
    ],
    contentType: "application/json",
  },
  "torrents/properties": {
    body: {
      addition_date: 1700000000,
      comment: "",
      completion_date: -1,
      created_by: "mktorrent",
      creation_date: 1699990000,
      dl_limit: -1,
      download_path: "",
      hash: "abc123",
      infohash_v1: "abc123",
      infohash_v2: "",
      last_seen: 0,
      name: "Test Torrent 1",
      nb_connections: 5,
      nb_connections_limit: 100,
      peers: 5,
      peers_total: 15,
      piece_size: 262144,
      pieces_have: 500,
      pieces_num: 1024,
      reannounce: 1800,
      save_path: "/downloads",
      seeding_time: -1,
      seeds: 10,
      seeds_total: 20,
      share_ratio: 0,
      time_elapsed: 600,
      total_downloaded: 536870912,
      total_downloaded_session: 536870912,
      total_size: 1073741824,
      total_uploaded: 268435456,
      total_uploaded_session: 268435456,
      up_limit: -1,
      upload_payload: 268435456,
      up_speed: 131072,
    },
    contentType: "application/json",
  },
  "torrents/trackers": {
    body: [
      {
        url: "** [DHT] **",
        status: 0,
        tier: 0,
        num_peers: 0,
        num_seeds: 0,
        num_leeches: 0,
        num_downloaded: 0,
        num_downloaded_session: 0,
        msg: "",
      },
      {
        url: "https://tracker.example.com/announce",
        status: 2,
        tier: 0,
        num_peers: 5,
        num_seeds: 10,
        num_leeches: 3,
        num_downloaded: 100,
        num_downloaded_session: 20,
        msg: "",
      },
    ],
    contentType: "application/json",
  },
  "torrents/webseeds": {
    body: [],
    contentType: "application/json",
  },
  "torrents/files": {
    body: [
      {
        index: 0,
        name: "test-torrent-1/readme.txt",
        size: 1024,
        progress: 1,
        priority: 1,
        is_seed: false,
        piece_range: [0, 1],
        availability: 1,
      },
      {
        index: 1,
        name: "test-torrent-1/data.bin",
        size: 1073740608,
        progress: 0.45,
        priority: 1,
        is_seed: false,
        piece_range: [1, 4096],
        availability: 0.8,
      },
    ],
    contentType: "application/json",
  },
  "torrents/pieceStates": {
    body: [],
    contentType: "application/json",
  },
  "sync/torrentPeers": {
    body: { peers: {}, rid: 0 },
    contentType: "application/json",
  },
  "search/start": {
    body: { id: 42 },
    contentType: "application/json",
    method: "POST",
  },
  "search/status": {
    body: [{ id: 42, status: "Stopped", total: 0 }],
    contentType: "application/json",
  },
  "search/results": {
    body: { results: [], status: "Stopped", total: 0 },
    contentType: "application/json",
  },
  "search/delete": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "torrents/stop": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "torrents/start": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "torrents/categories": {
    body: {
      movies: { name: "movies", savePath: "/downloads/movies" },
      music: { name: "music", savePath: "/downloads/music" },
    },
    contentType: "application/json",
  },
  "torrents/tags": {
    body: [],
    contentType: "application/json",
  },
  "rss/items": {
    body: {
      TechBlog: {
        uid: "1",
        url: "https://tech.example.com/rss",
        title: "Tech Blog",
        articles: [
          {
            id: "a1",
            title: "New Release v2.0",
            date: "18 May 2026 10:00:00 +0000",
            link: "https://tech.example.com/1",
            description: "Version 2.0 is out",
            isRead: false,
            torrentURL: "magnet:?xt=v2",
          },
          {
            id: "a2",
            title: "Bug Fix v1.9",
            date: "17 May 2026 08:00:00 +0000",
            link: "https://tech.example.com/2",
            description: "Fixed critical bug",
            isRead: true,
            torrentURL: "magnet:?xt=v19",
          },
        ],
      },
    },
    contentType: "application/json",
  },
  "sync/maindata": {
    body: {
      rid: 0,
      full_update: true,
      torrents: {},
      categories: {},
      tags: [],
      server_state: {
        dl_info_speed: 1048576,
        up_info_speed: 524288,
        dl_info_data: 1073741824,
        up_info_data: 536870912,
        dht_nodes: 150,
        connection_status: "connected",
      },
    },
    contentType: "application/json",
  },
  "log/main": {
    body: [
      { id: 1, message: "qBittorrent v5.0.0 started", timestamp: 1700000000, type: 1 },
      { id: 2, message: "Listening on port 6881", timestamp: 1700000001, type: 2 },
      { id: 3, message: "Disk space low", timestamp: 1700000002, type: 4 },
      {
        id: 4,
        message: "File not found: missing.torrent",
        timestamp: 1700000003,
        type: 8,
      },
    ],
    contentType: "application/json",
  },
  "rss/setRule": {
    body: "Ok.",
    contentType: "text/plain",
    method: "POST",
  },
  "rss/rules": {
    body: {
      "Anime Rule": {
        enabled: true,
        mustContain: "S\\d+E\\d+",
        mustNotContain: "",
        useRegex: true,
        episodeFilter: "",
        smartFilter: false,
        previouslyMatchedEpisodes: [],
        affectedFeeds: ["TechBlog"],
        ignoreDays: 0,
        lastMatch: "",
        addPaused: false,
        assignedCategory: "",
        savePath: "",
      },
    },
    contentType: "application/json",
  },
  "search/plugins": {
    body: [
      {
        enabled: true,
        fullName: "The Pirate Bay",
        name: "piratebay",
        supportedCategories: ["all"],
        url: "https://example.com/piratebay",
        version: "2.0",
      },
      {
        enabled: false,
        fullName: "Legit Torrents",
        name: "legittorrents",
        supportedCategories: ["all"],
        url: "https://example.com/legit",
        version: "1.1",
      },
    ],
    contentType: "application/json",
  },
};

export type MockHandlerKey = keyof typeof mockHandlers;
