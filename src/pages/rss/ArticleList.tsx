import { ChevronRight, Download, ExternalLink, RefreshCw, Rss } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shortcut } from "@/components/Shortcut";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RssArticle } from "@/types/qbt";

const formatDate = (date: string | number): string => {
  const d = typeof date === "number" ? new Date(date * 1000) : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export type ArticleSortKey = "title" | "date" | "isRead";
export type ArticleSort = { key: ArticleSortKey; dir: "asc" | "desc" };

const articleTime = (date: RssArticle["date"]): number =>
  (typeof date === "number" ? date * 1000 : new Date(date).getTime()) || 0;

/** Sort articles for display — stable, shared by the table and the j/k
 *  keyboard nav so both always walk the same order */
export function sortArticles(articles: RssArticle[], sort: ArticleSort): RssArticle[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...articles].sort((a, b) => {
    switch (sort.key) {
      case "title":
        return dir * a.title.localeCompare(b.title);
      case "isRead":
        // isRead asc = unread first (unread is the state worth surfacing)
        return dir * (Number(a.isRead ?? false) - Number(b.isRead ?? false));
      default:
        return dir * (articleTime(a.date) - articleTime(b.date));
    }
  });
}

/** First click on a column picks its useful direction (newest dates, A→Z
 *  titles, unread first); further clicks toggle */
const INITIAL_DIR: Record<ArticleSortKey, ArticleSort["dir"]> = {
  date: "desc",
  title: "asc",
  isRead: "asc",
};

interface ArticleListProps {
  selectedFeed: string | null;
  /** Already sorted — the page owns the order (keyboard nav depends on it) */
  articles: RssArticle[];
  sort: ArticleSort;
  onSortChange: (sort: ArticleSort) => void;
  /** Keyboard-highlighted article (j/k move it, Enter downloads it) */
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  /** Click / "Download" menu item → open the add-torrent dialog with article
   *  context */
  onDownload: (article: RssArticle) => void;
  /** Refresh just the selected feed */
  onRefresh: (path: string) => void;
}

/** Right column: article table — sortable by title / date / read status.
 *  Click opens the add dialog (with article context); right-click /
 *  long-press menu offers download or opening the article's webpage. */
export function ArticleList({
  selectedFeed,
  articles,
  sort,
  onSortChange,
  selectedArticleId,
  onSelectArticle,
  onDownload,
  onRefresh,
}: ArticleListProps) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the keyboard-moved selection in view
  useEffect(() => {
    if (!selectedArticleId) return;
    listRef.current
      ?.querySelector(`[data-article-id="${CSS.escape(selectedArticleId)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedArticleId]);

  const toggleSort = (key: ArticleSortKey) =>
    onSortChange(
      sort.key === key
        ? { key, dir: sort.dir === "asc" ? "desc" : "asc" }
        : { key, dir: INITIAL_DIR[key] },
    );

  const sortHead = (key: ArticleSortKey, label: string, className?: string) => (
    <TableHead
      className={cn("sticky top-0 z-10 bg-card p-0", className)}
      aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className="flex h-9 w-full items-center gap-1 px-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => toggleSort(key)}
      >
        <span className="min-w-0 truncate">{label}</span>
        {/* the torrent table's ↑/↓ sort-indicator convention */}
        <span className="shrink-0">
          {sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
        </span>
      </button>
    </TableHead>
  );

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-card">
      {/* Panel header: selected feed + per-feed refresh (no right-click needed) */}
      {selectedFeed && (
        <div className="flex shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3 py-1.5">
          <Rss className="size-3.5 shrink-0 text-orange-500" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {selectedFeed.split("/").pop()}
          </span>
          {/* j/k = select previous/next article (hover for the full legend) */}
          <span className="mr-1 hidden md:inline-flex" title={t("RSS hotkeys hint")}>
            <Shortcut keys={["j", "/", "k"]} />
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onRefresh(selectedFeed)}
            aria-label={t("Refresh")}
            title={`${t("Refresh")} (R)`}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      )}
      {!selectedFeed ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          <ChevronRight className="mr-2 size-4" />
          {t("Select a feed to view articles")}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("No results found")}
        </div>
      ) : (
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" role="listbox">
          {/* plain <table> (not the UiTable wrapper): its overflow-x-auto slot
              container would become the sticky header's scroll ancestor */}
          <table className="w-full table-fixed text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {sortHead("title", t("Title"))}
                {sortHead("date", t("Date"), "w-24")}
                {sortHead("isRead", t("Status"), "w-20")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => {
                const selected = article.id === selectedArticleId;
                const unread = !article.isRead;
                return (
                  <ContextMenu key={article.id}>
                    <ContextMenuTrigger
                      render={
                        <TableRow
                          role="option"
                          aria-selected={selected}
                          tabIndex={0}
                          data-article-id={article.id}
                          title={article.description?.replace(/<[^>]*>/g, "") || article.title}
                          className={cn(
                            "cursor-pointer",
                            selected && "bg-primary/10 hover:bg-primary/10",
                          )}
                          onClick={() => {
                            onSelectArticle(article.id);
                            onDownload(article);
                          }}
                        />
                      }
                    >
                      <TableCell className="max-w-0 p-0">
                        <div className="group flex items-center gap-3 px-3 py-2">
                          <Download className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-[13px]",
                              article.isRead ? "text-muted-foreground" : "font-semibold",
                            )}
                          >
                            {article.title}
                          </span>
                          {article.link && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label={t("Open article page")}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(article.link, "_blank");
                              }}
                            >
                              <ExternalLink className="size-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs tabular-nums text-muted-foreground">
                        {formatDate(article.date)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs">
                        <span
                          className={unread ? "font-medium text-primary" : "text-muted-foreground"}
                        >
                          {unread ? t("Unread") : t("Read")}
                        </span>
                      </TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onDownload(article)}>
                        <Download />
                        {t("Download")}
                      </ContextMenuItem>
                      {article.link && (
                        <ContextMenuItem onClick={() => window.open(article.link, "_blank")}>
                          <ExternalLink />
                          {t("Open article page")}
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}
