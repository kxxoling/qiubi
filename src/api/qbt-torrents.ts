/**
 * QbtTorrents — split from the original QbtClient god-class (see qbt-core.ts).
 */
import type { TorrentFiles, TorrentInfo, TorrentProperties, TorrentTracker } from "@/types/qbt";
import { QbtAppApi } from "./qbt-app";

export class QbtTorrentsApi extends QbtAppApi {
  // --- Torrents ---
  async getTorrentsInfo(params?: {
    filter?: string;
    category?: string;
    tag?: string;
    hash?: string;
    sort?: string;
    reverse?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<TorrentInfo[]> {
    const query = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) query.set(k, String(v));
      }
    }
    const qs = query.toString();
    return this.request(`/torrents/info${qs ? `?${qs}` : ""}`);
  }

  async getTorrentProperties(hash: string): Promise<TorrentProperties> {
    return this.request(`/torrents/properties?hash=${hash}`);
  }

  async getTorrentTrackers(hash: string): Promise<TorrentTracker[]> {
    return this.request(`/torrents/trackers?hash=${hash}`);
  }

  async getTorrentWebSeeds(hash: string): Promise<{ url: string }[]> {
    return this.request(`/torrents/webseeds?hash=${hash}`);
  }

  async getTorrentFiles(hash: string): Promise<TorrentFiles[]> {
    return this.request(`/torrents/files?hash=${hash}`);
  }

  async getTorrentPieceStates(hash: string): Promise<number[]> {
    return this.request(`/torrents/pieceStates?hash=${hash}`);
  }

  /**
   * Pause torrents (auto-adapts between 4.x /torrents/pause and 5.x /torrents/stop).
   */
  async pauseTorrents(hashes: string[]): Promise<void> {
    await this.postStopOrStart(hashes, "stop");
  }

  /** Resume torrents (auto-adapts between 4.x /torrents/resume and 5.x /torrents/start). */
  async resumeTorrents(hashes: string[]): Promise<void> {
    await this.postStopOrStart(hashes, "start");
  }

  async deleteTorrents(hashes: string[], deleteFiles: boolean): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("deleteFiles", String(deleteFiles));
    await this.request("/torrents/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async recheckTorrents(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/recheck", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async reannounceTorrents(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/reannounce", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async addTorrent(params: {
    urls?: string;
    torrentFiles?: File[];
    savepath?: string;
    cookie?: string;
    category?: string;
    tags?: string;
    skipChecking?: boolean;
    paused?: boolean;
    rootFolder?: boolean;
    rename?: string;
    upLimit?: number;
    dlLimit?: number;
    ratioLimit?: number;
    seedingTimeLimit?: number;
    autoTMM?: boolean;
    sequentialDownload?: boolean;
    firstLastPiecePrio?: boolean;
  }): Promise<string> {
    const formData = new FormData();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      if (k === "torrentFiles" && Array.isArray(v)) {
        for (const file of v) {
          formData.append("torrents", file);
        }
      } else {
        formData.set(k, String(v));
      }
    }
    return this.request("/torrents/add", {
      method: "POST",
      body: formData,
    });
  }

  async addTrackers(hash: string, urls: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hash", hash);
    body.set("urls", urls);
    await this.request("/torrents/addTrackers", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async editTrackers(hash: string, origUrl: string, newUrl: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hash", hash);
    body.set("origUrl", origUrl);
    body.set("newUrl", newUrl);
    await this.request("/torrents/editTracker", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async removeTrackers(hash: string, urls: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hash", hash);
    body.set("urls", urls);
    await this.request("/torrents/removeTrackers", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async increasePriority(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/increasePrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async decreasePriority(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/decreasePrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async topPriority(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/topPrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async bottomPriority(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/bottomPrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  /** Set the download speed limit for one or more torrents (KiB/s, 0 = unlimited). qBT 5.x params: hashes + limit */
  async setTorrentDownloadLimit(hashes: string[], limitKiB: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("limit", String(limitKiB));
    await this.request("/torrents/setDownloadLimit", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  /** Set the upload speed limit for one or more torrents (KiB/s, 0 = unlimited) */
  async setTorrentUploadLimit(hashes: string[], limitKiB: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("limit", String(limitKiB));
    await this.request("/torrents/setUploadLimit", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  /**
   * Set file priority. The qBT API requires one repeated id param per file (id=1&id=2...),
   * so an array is accepted and appended one by one; priorities: 0=skip 1=normal 6=high 7=maximal.
   */
  async setFilePriority(hash: string, fileIds: number[], priority: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("hash", hash);
    for (const id of fileIds) body.append("id", String(id));
    body.set("priority", String(priority));
    await this.request("/torrents/filePrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setTorrentLocation(hashes: string[], location: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("location", location);
    await this.request("/torrents/setLocation", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setTorrentName(hash: string, name: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hash", hash);
    body.set("name", name);
    await this.request("/torrents/rename", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setTorrentCategory(hashes: string[], category: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("category", category);
    await this.request("/torrents/setCategory", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async addTorrentTags(hashes: string[], tags: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("tags", tags.join(","));
    await this.request("/torrents/addTags", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async removeTorrentTags(hashes: string[], tags?: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    if (tags) body.set("tags", tags.join(","));
    await this.request("/torrents/removeTags", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setForceStart(hashes: string[], value: boolean): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("value", String(value));
    await this.request("/torrents/setForceStart", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setSuperSeeding(hashes: string[], value: boolean): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    body.set("value", String(value));
    await this.request("/torrents/setSuperSeeding", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async toggleSequentialDownload(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/toggleSequentialDownload", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async toggleFirstLastPiecePrio(hashes: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("hashes", hashes.join("|"));
    await this.request("/torrents/toggleFirstLastPiecePrio", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }
}
