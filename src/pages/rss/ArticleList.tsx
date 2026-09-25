import { ChevronRight, Download, ExternalLink, RefreshCw, Rss } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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

interface ArticleListProps {
  selectedFeed: string | null;
  articles: RssArticle[];
  /** Click / "Download" menu item → open the add-torrent dialog with article context */
  onDownload: (article: RssArticle) => void;
  /** Refresh just the selected feed */
  onRefresh: (path: string) => void;
}

/** Right column: article list — click opens the add dialog (with article
 *  context); right-click / long-press menu offers download or opening the
 *  article's webpage (the magnet's release/detail page). */
export function ArticleList({ selectedFeed, articles, onDownload, onRefresh }: ArticleListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-md border">
      {/* Panel header: selected feed + per-feed refresh (no right-click needed) */}
      {selectedFeed && (
        <div className="flex shrink-0 items-center gap-1.5 border-b bg-muted/30 px-3 py-1.5">
          <Rss className="size-3.5 shrink-0 text-orange-500" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {selectedFeed.split("/").pop()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onRefresh(selectedFeed)}
            aria-label={t("Refresh")}
            title={t("Refresh")}
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="divide-y">
            {[...articles]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((article) => (
                <ContextMenu key={article.id}>
                  <ContextMenuTrigger
                    render={
                      <div
                        title={article.description?.replace(/<[^>]*>/g, "") || article.title}
                        className="group flex cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/50"
                        onClick={() => onDownload(article)}
                      />
                    }
                  >
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
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDate(article.date)}
                    </span>
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
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
