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
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
import type { AppPreferences, RssArticle, RssFeed } from "@/types/qbt";
import { ArticleList } from "./ArticleList";
import { FeedTree, flattenFeeds } from "./FeedTree";

/** Apply fn to the map that CONTAINS the feed/folder at `path` — used for
 *  immediate cache updates once the server confirms a rename/delete, so the
 *  tree never waits for the refetch round-trip (invalidate reconciles after) */
function updateFeedTree(
  items: Record<string, RssFeed>,
  path: string,
  fn: (node: Record<string, RssFeed>, name: string) => Record<string, RssFeed>,
): Record<string, RssFeed> {
  const walk = (node: Record<string, RssFeed>, segs: string[]): Record<string, RssFeed> => {
    const [head, ...rest] = segs;
    if (!head || !(head in node)) return node;
    if (rest.length === 0) return fn(node, head);
    const child = node[head];
    if (!child.children) return node;
    return { ...node, [head]: { ...child, children: walk(child.children, rest) } };
  };
  return walk(items, path.split("/"));
}

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
  /** Rename dialog target: feed path + editable display name (last path segment) */
  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string } | null>(null);
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

  // Select the first feed by default once feeds load (a folder is not a feed;
  // also recovers selection when the selected feed disappears)
  useEffect(() => {
    if (!feeds) return;
    const f = flattenFeeds(feeds);
    const first = f.find((x) => !x.feed.children) ?? f[0];
    if (!first) return;
    if (selectedFeed && f.some((x) => x.path === selectedFeed)) return;
    setSelectedFeed(first.path);
  }, [feeds, selectedFeed]);

  const selected = flat.find((x) => x.path === selectedFeed);
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
      qc.setQueryData(["rss-feeds"], (prev: Record<string, RssFeed> | undefined) =>
        prev
          ? updateFeedTree(prev, path, (node, old) => {
              const rest = { ...node };
              delete rest[old];
              return rest;
            })
          : prev,
      );
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  /** Rename = move the feed under the same parent with the new name (qBT's
   *  moveItem is also its rename; the feed URL itself is not editable via API) */
  const handleRenameFeed = async () => {
    if (!renameTarget) return;
    const name = renameTarget.name.trim();
    if (!name) return;
    const parent = renameTarget.path.includes("/")
      ? renameTarget.path.slice(0, renameTarget.path.lastIndexOf("/"))
      : "";
    const dest = parent ? `${parent}/${name}` : name;
    setRenameTarget(null);
    if (dest === renameTarget.path) return;
    try {
      await qbtClient.moveRssItem(renameTarget.path, dest);
      toast.success(t("Saved"));
      if (selectedFeed === renameTarget.path) setSelectedFeed(dest);
      qc.setQueryData(["rss-feeds"], (prev: Record<string, RssFeed> | undefined) =>
        prev
          ? updateFeedTree(prev, renameTarget.path, (node, old) => {
              const { [old]: feed, ...rest } = node;
              return { ...rest, [name]: feed };
            })
          : prev,
      );
      await qc.invalidateQueries({ queryKey: ["rss-feeds"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const copyFeedUrl = async (feed: RssFeed) => {
    try {
      await navigator.clipboard.writeText(feed.url);
      toast.success(t("Copied"));
    } catch {
      toast.error(t("Copy failed"));
    }
  };

  /** Click/context-menu "Download": open the global add-torrent dialog with
   *  the article's context above the fields (nothing is added until confirmed).
   *  Clicking counts as reading — the article is marked read right away (the
   *  dialog can still be cancelled; unmarking would be more confusing). */
  const downloadArticle = (article: RssArticle) => {
    const link = article.torrentURL || article.link;
    const desc = article.description?.replace(/<[^>]*>/g, "").trim();
    if (selectedFeed && !article.isRead) {
      qbtClient
        .markRssAsRead(selectedFeed, article.id)
        .then(() => qc.invalidateQueries({ queryKey: ["rss-feeds"] }))
        .catch(() => {
          // non-fatal: the list just keeps the unread badge until the next poll
        });
    }
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

  // Page hotkeys: r refreshes the selected feed, Shift+R refreshes all.
  // Plain keys only — ctrl/meta/alt combos belong to the browser (Cmd+R
  // reloads); ignored while typing in a field or with a dialog open.
  // The handlers are redefined every render; a ref keeps the listener
  // subscribed once while always invoking the latest handlers (the torrent
  // table's depsRef pattern) — unstable identities in the deps array are
  // what the linter rejects.
  const refreshRef = useRef({ refreshOne, refreshAll });
  refreshRef.current = { refreshOne, refreshAll };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (addDialog || renameTarget || deleteTarget || !rssEnabled) return;
      if (e.shiftKey) {
        void refreshRef.current.refreshAll();
      } else if (selectedFeed) {
        void refreshRef.current.refreshOne(selectedFeed);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addDialog, renameTarget, deleteTarget, rssEnabled, selectedFeed]);

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
          onRenameRequest={(path) => setRenameTarget({ path, name: path.split("/").pop() ?? path })}
          onCopyUrl={copyFeedUrl}
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
          {/* form wrapper: Enter in the URL field saves */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddFeed();
            }}
          >
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
              <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={!feedUrl.trim()}>
                {t("Save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename feed dialog */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Rename")}</DialogTitle>
          </DialogHeader>
          {/* form wrapper: Enter in the name field saves */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameFeed();
            }}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">{t("Name")}</div>
                <Input
                  value={renameTarget?.name ?? ""}
                  onChange={(e) => setRenameTarget((h) => (h ? { ...h, name: e.target.value } : h))}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={!renameTarget?.name.trim()}>
                {t("Save")}
              </Button>
            </div>
          </form>
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
