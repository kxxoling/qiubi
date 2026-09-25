/**
 * QbtApp — split from the original QbtClient god-class (see qbt-core.ts).
 */
import type {
  AppBuildInfo,
  AppPreferences,
  LogEntry,
  PeerLogEntry,
  SyncMainData,
  TorrentPeer,
  TransferInfo,
} from "@/types/qbt";
import { QbtCore } from "./qbt-core";

export class QbtAppApi extends QbtCore {
  // --- App ---
  async getAppVersion(): Promise<string> {
    return this.request("/app/version");
  }

  async getApiVersion(): Promise<string> {
    return this.request("/app/webapiVersion");
  }

  async getBuildInfo(): Promise<AppBuildInfo> {
    return this.request("/app/buildInfo");
  }

  async getPreferences(): Promise<AppPreferences> {
    return this.request("/app/preferences");
  }

  async setPreferences(prefs: Partial<AppPreferences>): Promise<void> {
    // 4.x and 5.x use different key names for "add paused"; send both so either backend generation works
    // (qBT ignores unknown preference keys, so the duplicate is harmless)
    const merged = { ...prefs };
    if (prefs.add_stopped_enabled !== undefined)
      merged.start_paused_enabled = prefs.add_stopped_enabled;
    if (prefs.start_paused_enabled !== undefined)
      merged.add_stopped_enabled = prefs.start_paused_enabled;
    const body = new URLSearchParams();
    body.set("json", JSON.stringify(merged));
    await this.request("/app/setPreferences", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getDefaultSavePath(): Promise<string> {
    return this.request("/app/defaultSavePath");
  }

  async shutdown(): Promise<void> {
    await this.request("/app/shutdown", { method: "POST" });
  }

  // --- Transfer ---
  async getTransferInfo(): Promise<TransferInfo> {
    return this.request("/transfer/info");
  }

  async getSpeedLimitsMode(): Promise<number> {
    return this.request("/transfer/speedLimitsMode");
  }

  async toggleSpeedLimitsMode(): Promise<void> {
    await this.request("/transfer/toggleSpeedLimitsMode", { method: "POST" });
  }

  async getGlobalDlLimit(): Promise<number> {
    return this.request("/transfer/globalDlLimit");
  }

  async setGlobalDlLimit(limit: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("limit", String(limit));
    await this.request("/transfer/setGlobalDlLimit", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getGlobalUpLimit(): Promise<number> {
    return this.request("/transfer/globalUpLimit");
  }

  async setGlobalUpLimit(limit: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("limit", String(limit));
    await this.request("/transfer/setGlobalUpLimit", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  // --- Sync ---
  async getSyncMainData(rid = 0): Promise<SyncMainData> {
    return this.request(`/sync/maindata?rid=${rid}`);
  }

  async getSyncTorrentPeers(
    hash: string,
    rid = 0,
  ): Promise<{ peers: Record<string, TorrentPeer>; rid: number }> {
    return this.request(`/sync/torrentPeers?hash=${hash}&rid=${rid}`);
  }

  // --- Log ---
  async getLog(params?: {
    normal?: boolean;
    info?: boolean;
    warning?: boolean;
    critical?: boolean;
    last_known_id?: number;
  }): Promise<LogEntry[]> {
    const query = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) query.set(k, String(v));
      }
    }
    const qs = query.toString();
    return this.request(`/log/main${qs ? `?${qs}` : ""}`);
  }

  async getPeerLog(lastKnownId?: number): Promise<PeerLogEntry[]> {
    const qs = `?last_known_id=${lastKnownId ?? -1}`;
    return this.request(`/log/peers${qs}`);
  }
}
