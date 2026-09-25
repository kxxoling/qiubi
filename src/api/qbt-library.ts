/**
 * QbtLibrary — split from the original QbtClient god-class (see qbt-core.ts).
 */
import type { Category } from "@/types/qbt";
import { QbtTorrentsApi } from "./qbt-torrents";

export class QbtLibraryApi extends QbtTorrentsApi {
  // --- Categories ---
  async getTorrentTags(): Promise<string[]> {
    return this.request("/torrents/tags");
  }

  async getCategories(): Promise<Category[]> {
    const data = await this.request<Record<string, Category>>("/torrents/categories");
    return Object.values(data);
  }

  async addCategory(name: string, savePath?: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("category", name);
    if (savePath) body.set("savePath", savePath);
    await this.request("/torrents/createCategory", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async editCategory(name: string, savePath: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("category", name);
    body.set("savePath", savePath);
    await this.request("/torrents/editCategory", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async removeCategories(names: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("categories", names.join("\n"));
    await this.request("/torrents/removeCategories", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  // --- Tags ---
  async getTags(): Promise<string[]> {
    return this.request("/torrents/tags");
  }

  async createTags(tags: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("tags", tags.join(","));
    await this.request("/torrents/createTags", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async deleteTags(tags: string[]): Promise<void> {
    const body = new URLSearchParams();
    body.set("tags", tags.join(","));
    await this.request("/torrents/deleteTags", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }
}
