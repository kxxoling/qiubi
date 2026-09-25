/**
 * QbtSearch — split from the original QbtClient god-class (see qbt-core.ts).
 */
import type { SearchPlugin, SearchResult, SearchStatus } from "@/types/qbt";
import { QbtRssApi } from "./qbt-rss";

export class QbtSearchApi extends QbtRssApi {
  // --- Search ---
  async startSearch(pattern: string, plugins = "all", category = "all"): Promise<{ id: number }> {
    const body = new URLSearchParams();
    body.set("pattern", pattern);
    body.set("plugins", plugins);
    body.set("category", category);
    return this.request("/search/start", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async stopSearch(id: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("id", String(id));
    await this.request("/search/stop", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getSearchStatus(id?: number): Promise<SearchStatus[]> {
    const qs = id ? `?id=${id}` : "";
    return this.request(`/search/status${qs}`);
  }

  async getSearchResults(
    id: number,
    limit?: number,
    offset?: number,
  ): Promise<{
    results: SearchResult[];
    status: string;
    total: number;
  }> {
    const params = new URLSearchParams();
    params.set("id", String(id));
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));
    return this.request(`/search/results?${params}`);
  }

  async deleteSearch(id: number): Promise<void> {
    const body = new URLSearchParams();
    body.set("id", String(id));
    await this.request("/search/delete", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getSearchPlugins(): Promise<SearchPlugin[]> {
    return this.request("/search/plugins");
  }

  async installSearchPlugin(sources: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("sources", sources);
    await this.request("/search/installPlugin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async uninstallSearchPlugin(names: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("names", names.join("|"));
    await this.request("/search/uninstallPlugin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async enableSearchPlugin(names: string[], enable: boolean): Promise<void> {
    const body = new URLSearchParams();
    body.set("names", names.join("|"));
    body.set("enable", String(enable));
    await this.request("/search/enablePlugin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async updateSearchPlugins(): Promise<void> {
    await this.request("/search/updatePlugins", { method: "POST" });
  }
}
