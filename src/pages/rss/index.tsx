import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCheck,
  ExternalLink,
  Plus,
  RefreshCcw,
  Rss,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
import type { AppPreferences, RssArticle } from "@/types/qbt";
import { ArticleList } from "./ArticleList";
import { FeedTree, flattenFeeds } from "./FeedTree";

/**
 * RSS page — two-column layout (narrow feed tree | wide article list)
 *
 * - Feeds and articles both have a context menu (desktop) and a ⋮ dropdown (mobile)
 * - Article list: unread in bold, click to download, external-link button on hover
 */
export function RssPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [addDialog, setAddDialog] = useState(false);
  const [feedUrl, setFeedUrl] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [_refreshingFeed, setRefreshingFeed] = useState<string | null>(null);

  const { data: feeds, isLoading } = useQuery({
    queryKey: ["rss-feeds"],
    queryFn: () => qbtClient.getRssItems(true),
    refetchInterval: pollWithBackoff(30000),
  });

  const { data: prefs } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => qbtClient.getPreferences(),
    staleTime: 10_000,
  });
  const rssEnabled = prefs ? (prefs as AppPreferences).rss_processing_enabled !== false : true;

  const flat = feeds ? flattenFeeds(feeds) : [];
  const selected = flat.find((f) => f.path === selectedFeed);
  const selectedArticles: RssArticle[] = selected?.feed.articles ?? [];
  const feedOnly = flat.filter((f) => !f.feed.children);

  const handleAddFeed = async () => {
    try {
      await qbtClient.addRssFeed(feedUrl);
      toast.success(t("Saved"));
      setAddDialog(false);
      setFeedUrl("");
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await qbtClient.removeRssItem(path);
      toast.success(t("Deleted"));
      setDeleteTarget(null);
      if (selectedFeed === path) setSelectedFeed(null);
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  /** Click/context-menu "Download": open the global add-torrent dialog with
   *  the article's context above the fields (nothing is added until confirmed) */
  const downloadArticle = (article: RssArticle) => {
    const link = article.torrentURL || article.link;
    const desc = article.description?.replace(/<[^>]*>/g, "").trim();
    openAddTorrentDialog({
      urls: link,
      header: (
        <div className="mb-4 space-y-1 rounded-md border bg-muted/40 p-3">
          <div className="truncate text-sm font-semibold">{article.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Rss className="size-3 text-orange-500" />
            <span className="truncate">{selectedFeed ?? t("RSS")}</span>
          </div>
          {desc && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          )}
          {article.link && (
            <a
              href={article.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              {t("Open article page")}
            </a>
          )}
        </div>
      ),
    });
  };

  /**
   * qBT's refreshItem returns 200 immediately — the feed fetch happens
   * server-side and shows up as isLoading on the feed. Poll until every
   * watched feed stops loading (timeout 30s), then report per-feed errors.
   */
  const waitForFeedsIdle = async (paths: string[]) => {
    const watched = new Set(paths);
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const items = await qbtClient.getRssItems(true);
      // stream every snapshot into the UI cache so each feed's spinner
      // appears/clears as its own refresh finishes (official-UI behavior)
      qc.setQueryData(["rss-feeds"], items);
      const flat = flattenFeeds(items);
      const busy = flat.filter((f) => watched.has(f.path) && f.feed.isLoading);
      if (busy.length === 0) {
        return flat.filter((f) => watched.has(f.path));
      }
      await new Promise((r) => setTimeout(r, 800));
    }
    return null; // timed out
  };

  const refreshOne = async (path: string) => {
    setRefreshingFeed(path);
    try {
      await qbtClient.refreshRssItem(path);
      const final = await waitForFeedsIdle([path]);
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
      if (final === null) {
        toast.error(t("Refresh timed out"));
      } else if (final[0]?.feed.hasError) {
        toast.error(t("Refresh failed"));
      } else {
        toast.success(t("Refreshed"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshingFeed(null);
    }
  };

  const refreshAll = async () => {
    try {
      // no server-side "refresh all": itemPath is required, so fan out
      // over every feed and tolerate individual failures
      await Promise.allSettled(feedOnly.map((f) => qbtClient.refreshRssItem(f.path)));
      const final = await waitForFeedsIdle(feedOnly.map((f) => f.path));
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
      if (final === null) {
        toast.error(t("Refresh timed out"));
        return;
      }
      const errored = final.filter((f) => f.feed.hasError).length;
      if (errored) toast.error(`${t("Refresh failed")} (${errored})`);
      else toast.success(t("Refreshed"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const markAllRead = async () => {
    try {
      if (selectedFeed) {
        await qbtClient.markRssAsRead(selectedFeed);
      } else {
        for (const f of feedOnly) {
          if (f.feed.articles?.some((a) => !a.isRead)) {
            await qbtClient.markRssAsRead(f.path);
          }
        }
      }
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const markFeedRead = async (path: string) => {
    await qbtClient.markRssAsRead(path);
    await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">{t("Connecting...")}</div>;
  }

  const totalUnread = flat.reduce(
    (sum, f) => sum + (f.feed.articles?.filter((a) => !a.isRead).length ?? 0),
    0,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Banner shown when RSS is disabled on the server */}
      {!rssEnabled && (
        <div className="flex shrink-0 items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            {t("RSS is disabled on the server — enable it in Settings → RSS")}
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/settings" })}>
            <Settings className="mr-1 h-3.5 w-3.5" />
            {t("Settings")}
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <Rss className="size-5 shrink-0 text-orange-500" />
        <span className="text-base font-semibold">{t("RSS")}</span>
        {totalUnread > 0 && <Badge variant="secondary">{totalUnread}</Badge>}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={refreshAll}
            disabled={!rssEnabled}
            aria-label={t("Refresh All")}
          >
            <RefreshCcw className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={markAllRead}
            aria-label={t("Mark all read")}
          >
            <CheckCheck className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigate({ to: "/rss/rules" })}
            aria-label={t("RSS Downloader")}
          >
            <Settings className="size-4" />
          </Button>
          <Button size="sm" onClick={() => setAddDialog(true)} disabled={!rssEnabled}>
            <Plus className="mr-1 size-3.5" />
            {t("Add Feed")}
          </Button>
        </div>
      </div>

      {/* Two-column layout at every width: narrow feed tree | article list */}
      <div className="grid min-h-0 flex-1 grid-cols-[170px_1fr] gap-2">
        {/* Left: feed tree (narrow) */}
        <FeedTree
          flat={flat}
          selectedFeed={selectedFeed}
          onSelectFeed={setSelectedFeed}
          onRefreshOne={refreshOne}
          onDeleteRequest={setDeleteTarget}
          onMarkFeedRead={markFeedRead}
        />

        {/* Right: article list (wide) */}
        <ArticleList
          selectedFeed={selectedFeed}
          articles={selectedArticles}
          onDownload={downloadArticle}
          onRefresh={refreshOne}
        />
      </div>

      {/* Add feed dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add Feed")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">{t("Feed URL")}</div>
              <Input
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://example.com/rss.xml"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleAddFeed} disabled={!feedUrl.trim()}>
              {t("Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Delete feed confirm", { name: deleteTarget ?? "" })}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {t("Delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
