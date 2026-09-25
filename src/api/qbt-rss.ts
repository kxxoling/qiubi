/**
 * QbtRss — split from the original QbtClient god-class (see qbt-core.ts).
 */
import type { RssAutoDownloadingRule, RssFeed } from "@/types/qbt";
import { QbtLibraryApi } from "./qbt-library";

export class QbtRssApi extends QbtLibraryApi {
  // --- RSS ---
  async addRssFolder(path: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("path", path);
    await this.request("/rss/addFolder", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async addRssFeed(url: string, path?: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("url", url);
    // qBT 5.x rejects addFeed without a path (400) even though the API docs
    // call it optional — default the feed name to the URL's host
    if (!path) {
      try {
        path = new URL(url).hostname;
      } catch {
        path = url;
      }
    }
    body.set("path", path);
    await this.request("/rss/addFeed", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async removeRssItem(path: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("path", path);
    await this.request("/rss/removeItem", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getRssItems(withData?: boolean): Promise<Record<string, RssFeed>> {
    const qs = withData ? "?withData=true" : "";
    return this.request(`/rss/items${qs}`);
  }

  /** Have qBT immediately re-fetch a feed/folder (itemPath is required) */
  async refreshRssItem(path: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("itemPath", path);
    await this.request("/rss/refreshItem", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  /** Mark an article as read; omitting articleId = mark the whole feed as read */
  async markRssAsRead(path: string, articleId?: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("itemPath", path);
    if (articleId) body.set("articleId", articleId);
    await this.request("/rss/markAsRead", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async markRssAsUnread(path: string, articleId: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("itemPath", path);
    body.set("articleId", articleId);
    await this.request("/rss/markAsUnread", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async setRssRule(ruleName: string, rule: RssAutoDownloadingRule): Promise<void> {
    const body = new URLSearchParams();
    body.set("ruleName", ruleName);
    // The official param name is ruleDef (older code mistakenly used rule, which makes qBT return 400)
    body.set("ruleDef", JSON.stringify(rule));
    await this.request("/rss/setRule", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async getRssRules(): Promise<Record<string, RssAutoDownloadingRule>> {
    return this.request("/rss/rules");
  }

  async removeRssRule(ruleName: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("ruleName", ruleName);
    await this.request("/rss/removeRule", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }
}
