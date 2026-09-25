import {
  CheckCheck,
  FolderOpen,
  Loader2,
  MoreVertical,
  RefreshCw,
  Rss,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { RssFeed } from "@/types/qbt";

/** One row of the flattened feed tree */
export interface FlatFeed {
  path: string;
  feed: RssFeed;
  depth: number;
}

export function flattenFeeds(items: Record<string, RssFeed>, prefix = ""): FlatFeed[] {
  const out: FlatFeed[] = [];
  for (const [name, feed] of Object.entries(items)) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (feed.children) {
      out.push({ path, feed, depth: prefix ? 2 : 0 });
      out.push(...flattenFeeds(feed.children, path));
    } else {
      out.push({ path, feed, depth: prefix ? 2 : 0 });
    }
  }
  return out;
}

interface FeedTreeProps {
  flat: FlatFeed[];
  selectedFeed: string | null;
  onSelectFeed: (path: string) => void;
  onRefreshOne: (path: string) => void;
  onDeleteRequest: (path: string) => void;
  onMarkFeedRead: (path: string) => Promise<void>;
}

/** Left column: feed tree with desktop context menu and mobile ⋮ dropdown */
export function FeedTree({
  flat,
  selectedFeed,
  onSelectFeed,
  onRefreshOne,
  onDeleteRequest,
  onMarkFeedRead,
}: FeedTreeProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-0 overflow-y-auto rounded-md border bg-card p-1">
      {flat.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">{t("No feeds")}</div>
      ) : (
        flat.map(({ path, feed, depth }) => {
          const unread = feed.articles?.filter((a) => !a.isRead).length ?? 0;
          const isFolder = !!feed.children;
          return (
            <ContextMenu key={path}>
              <ContextMenuTrigger
                render={
                  <div
                    className={cn(
                      "group flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      selectedFeed === path
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-accent",
                    )}
                    onClick={() => !isFolder && onSelectFeed(path)}
                  />
                }
              >
                {isFolder ? (
                  <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                ) : feed.isLoading ? (
                  // per-feed fetching state from qBT (isLoading) — the official
                  // UI spins each feed's icon as its refresh completes
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  // RSS brand orange — reads as an accent on every theme
                  <Rss
                    className={cn(
                      "size-3.5 shrink-0",
                      unread > 0 ? "text-orange-500" : "text-muted-foreground/70",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    unread > 0 && !isFolder && "font-semibold text-foreground",
                    feed.isLoading && !isFolder && "text-muted-foreground",
                  )}
                  style={{ paddingLeft: depth > 0 ? 8 : 0 }}
                >
                  {feed.title || path.split("/").pop()}
                </span>
                {unread > 0 && (
                  <Badge className="bg-primary/15 px-1 text-[9px] text-primary hover:bg-primary/15">
                    {unread}
                  </Badge>
                )}
                {/* Mobile ⋮ dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 md:hidden"
                        aria-label={t("Actions")}
                      />
                    }
                  >
                    <MoreVertical className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isFolder && (
                      <DropdownMenuItem onClick={() => onRefreshOne(path)}>
                        <RefreshCw className="mr-1 size-3.5" />
                        {t("Refresh")}
                      </DropdownMenuItem>
                    )}
                    {!isFolder && unread > 0 && (
                      <DropdownMenuItem
                        onClick={async () => {
                          await onMarkFeedRead(path);
                        }}
                      >
                        <CheckCheck className="mr-1 size-3.5" />
                        {t("Mark all read")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => onDeleteRequest(path)}>
                      <Trash2 className="mr-1 size-3.5" />
                      {t("Delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ContextMenuTrigger>
              {/* Desktop context menu */}
              <ContextMenuContent>
                {!isFolder && (
                  <ContextMenuItem onClick={() => onRefreshOne(path)}>
                    <RefreshCw className="mr-2 size-4" />
                    {t("Refresh")}
                  </ContextMenuItem>
                )}
                {!isFolder && unread > 0 && (
                  <ContextMenuItem
                    onClick={async () => {
                      await onMarkFeedRead(path);
                    }}
                  >
                    <CheckCheck className="mr-2 size-4" />
                    {t("Mark all read")}
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onClick={() => onDeleteRequest(path)}>
                  <Trash2 className="mr-2 size-4" />
                  {t("Delete")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })
      )}
    </div>
  );
}
