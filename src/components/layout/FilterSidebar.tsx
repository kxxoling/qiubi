/**
 * Left filter sidebar —— aligned with the official qBT sidebar
 *
 * Three filter groups (all written to the URL):
 * - Categories: All / Uncategorized / custom categories
 * - Tags: All / Untagged / custom tags
 * - Trackers: All / Trackerless / per-tracker domains (with torrent counts)
 *
 * Every category/tracker row — custom rows AND the pseudo rows All /
 * Uncategorized / Trackerless — carries a right-click menu with the qBT
 * torrent ops (resume → pause → remove) scoped to its torrents; custom
 * category rows add remove-unused management below.
 *
 * Each section header collapses/expands its rows (persisted), so a long
 * tracker list can be tucked away.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  FolderMinus,
  FolderOpen,
  Pause,
  Play,
  Radio,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { DeleteConfirmDialog, type DeleteDialogState } from "@/components/torrent/TorrentDialogs";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTorrentList } from "@/hooks/useMainDataSync";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
import type { TorrentInfo } from "@/types/qbt";

function FilterRow({
  active,
  label,
  count,
  icon,
  onClick,
  contextMenu,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  onClick: () => void;
  /** Context-menu content; rows without it stay plain buttons */
  contextMenu?: React.ReactNode;
}) {
  const className = cn(
    "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] outline-none transition-colors",
    active ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
  );
  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </>
  );
  if (!contextMenu) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger render={<button type="button" onClick={onClick} className={className} />}>
        {content}
      </ContextMenuTrigger>
      {contextMenu}
    </ContextMenu>
  );
}

/** Shared torrent-ops block for sidebar category/tracker rows (qBT order: resume → pause → remove) */
function TorrentOpItems({
  getHashes,
  disabled,
  onRemove,
}: {
  getHashes: () => string[];
  disabled: boolean;
  onRemove: (hashes: string[]) => void;
}) {
  const { t } = useTranslation();
  const act = async (fn: (hashes: string[]) => Promise<void>, label: string) => {
    try {
      await fn(getHashes());
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <>
      <ContextMenuItem
        disabled={disabled}
        onClick={() => act((h) => qbtClient.resumeTorrents(h), t("Resume"))}
      >
        <Play />
        {t("Resume Torrents")}
      </ContextMenuItem>
      <ContextMenuItem
        disabled={disabled}
        onClick={() => act((h) => qbtClient.pauseTorrents(h), t("Pause"))}
      >
        <Pause />
        {t("Pause Torrents")}
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        disabled={disabled}
        onClick={() => onRemove(getHashes())}
      >
        <Trash2 />
        {t("Remove Torrents")}
      </ContextMenuItem>
    </>
  );
}

/** Collapsible filter group: the header toggles its rows (persisted in the ui store) */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const collapsed = useUiStore((s) => s.sidebarSectionsCollapsed[id] ?? false);
  const toggleSection = useUiStore((s) => s.toggleSidebarSection);
  return (
    <div>
      <button
        type="button"
        onClick={() => toggleSection(id)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-1 px-2 pb-1 pt-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {title}
      </button>
      {!collapsed && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

/**
 * Tracker domain → member torrent hashes from sync/maindata's membership map
 * (tracker URL → member hashes, qBT's actual shape). A torrent belongs to
 * every tracker domain it uses, like the official UI; each domain counts a
 * torrent once even if it has several trackers on that host. Falls back to
 * the single primary tracker per torrent when the map is absent.
 */
function trackerHosts(
  trackersMap: Record<string, string[]> | undefined,
  torrents: TorrentInfo[] | undefined,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (trackersMap) {
    for (const [url, hashes] of Object.entries(trackersMap)) {
      if (url.startsWith("**")) continue; // [DHT]/[PeX]/[LSD] pseudo-trackers
      try {
        const host = new URL(url).host;
        const set = map.get(host) ?? new Set<string>();
        for (const h of hashes) set.add(h);
        map.set(host, set);
      } catch {
        // Skip non-URL formats
      }
    }
    return map;
  }
  for (const tr of torrents ?? []) {
    if (!tr.tracker) continue;
    try {
      const host = new URL(tr.tracker).host;
      map.set(host, (map.get(host) ?? new Set<string>()).add(tr.hash));
    } catch {
      // Skip non-URL formats
    }
  }
  return map;
}

export function FilterSidebar({ onSelect }: { onSelect?: () => void } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, torrents, categories, tags } = useTorrentList();
  const urlSearch = useSearch({ strict: false }) as {
    category?: string;
    tag?: string;
    tracker?: string;
  };
  const category = urlSearch.category ?? "";
  const tag = urlSearch.tag ?? "";
  const tracker = urlSearch.tracker ?? "";

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ hashes: [], open: false });

  const setUrlFilter = (patch: { category?: string; tag?: string; tracker?: string }) => {
    navigate({
      to: "/",
      search: (prev: Record<string, string | undefined>) => {
        const next: Record<string, string | undefined> = { ...prev, ...patch };
        for (const k of Object.keys(next)) if (!next[k]) delete next[k];
        return next;
      },
      replace: true,
    });
    onSelect?.();
  };

  // Category counts
  const catCounts = new Map<string, number>();
  let uncategorized = 0;
  for (const tr of torrents ?? []) {
    if (tr.category) {
      catCounts.set(tr.category, (catCounts.get(tr.category) ?? 0) + 1);
    } else {
      uncategorized++;
    }
  }
  const categoryHashes = (name: string) =>
    (torrents ?? []).filter((tr) => tr.category === name).map((tr) => tr.hash);
  const unusedCategoryNames = (categories ?? [])
    .filter((c) => (catCounts.get(c.name) ?? 0) === 0)
    .map((c) => c.name);

  // Tag counts
  const tagCounts = new Map<string, number>();
  let untagged = 0;
  for (const tr of torrents ?? []) {
    const list = tr.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) untagged++;
    for (const tg of list) tagCounts.set(tg, (tagCounts.get(tg) ?? 0) + 1);
  }

  // Tracker membership (host → member hashes; counts are the set sizes)
  const trackers = trackerHosts(data?.trackers, torrents);
  let noTracker = 0;
  for (const tr of torrents ?? []) {
    if (!tr.tracker) noTracker++;
  }

  const removeUnusedCategories = async () => {
    if (unusedCategoryNames.length === 0) return;
    try {
      await qbtClient.removeCategories(unusedCategoryNames);
      toast.success(t("Deleted"));
      await qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const openDeleteDialog = (hashes: string[]) => setDeleteDialog({ hashes, open: true });

  // Pseudo-row scopes: every sidebar row acts on its own slice of torrents
  const allHashes = () => (torrents ?? []).map((tr) => tr.hash);
  const uncategorizedHashes = () =>
    (torrents ?? []).filter((tr) => !tr.category).map((tr) => tr.hash);
  const trackerlessHashes = () => (torrents ?? []).filter((tr) => !tr.tracker).map((tr) => tr.hash);

  /** Torrent-ops menu content for a fixed scope (the pseudo rows) */
  const torrentOpsMenu = (getHashes: () => string[], count: number) => (
    <ContextMenuContent>
      <TorrentOpItems getHashes={getHashes} disabled={count === 0} onRemove={openDeleteDialog} />
    </ContextMenuContent>
  );

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-card p-2">
      {/* Categories */}
      <Section id="category" title={t("Category")}>
        <FilterRow
          active={category === ""}
          label={t("All")}
          count={torrents?.length ?? 0}
          onClick={() => setUrlFilter({ category: "" })}
          contextMenu={torrentOpsMenu(allHashes, torrents?.length ?? 0)}
        />
        <FilterRow
          active={category === "__uncategorized__"}
          label={t("Uncategorized")}
          count={uncategorized}
          icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          onClick={() => setUrlFilter({ category: "__uncategorized__" })}
          contextMenu={torrentOpsMenu(uncategorizedHashes, uncategorized)}
        />
        {[...(categories ?? [])]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <FilterRow
              key={c.name}
              active={category === c.name}
              label={c.name}
              count={catCounts.get(c.name) ?? 0}
              icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              onClick={() => setUrlFilter({ category: c.name })}
              contextMenu={
                <ContextMenuContent>
                  <TorrentOpItems
                    getHashes={() => categoryHashes(c.name)}
                    disabled={(catCounts.get(c.name) ?? 0) === 0}
                    onRemove={openDeleteDialog}
                  />
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    disabled={unusedCategoryNames.length === 0}
                    onClick={removeUnusedCategories}
                  >
                    <FolderMinus />
                    {t("Remove Unused Categories")}
                  </ContextMenuItem>
                </ContextMenuContent>
              }
            />
          ))}
      </Section>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <Section id="tags" title={t("Tags")}>
          <FilterRow
            active={tag === ""}
            label={t("All")}
            count={torrents?.length ?? 0}
            onClick={() => setUrlFilter({ tag: "" })}
          />
          <FilterRow
            active={tag === "__untagged__"}
            label={t("Untagged")}
            count={untagged}
            icon={<Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            onClick={() => setUrlFilter({ tag: "__untagged__" })}
          />
          {[...tags].sort().map((tg) => (
            <FilterRow
              key={tg}
              active={tag === tg}
              label={tg}
              count={tagCounts.get(tg) ?? 0}
              icon={<Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              onClick={() => setUrlFilter({ tag: tg })}
            />
          ))}
        </Section>
      )}

      {/* Tracker */}
      <Section id="tracker" title={t("Tracker")}>
        <FilterRow
          active={tracker === ""}
          label={t("All")}
          count={torrents?.length ?? 0}
          onClick={() => setUrlFilter({ tracker: "" })}
          contextMenu={torrentOpsMenu(allHashes, torrents?.length ?? 0)}
        />
        <FilterRow
          active={tracker === "__none__"}
          label={t("Trackerless")}
          count={noTracker}
          icon={<Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          onClick={() => setUrlFilter({ tracker: "__none__" })}
          contextMenu={torrentOpsMenu(trackerlessHashes, noTracker)}
        />
        {[...trackers.entries()]
          .sort((a, b) => b[1].size - a[1].size)
          .map(([host, hashes]) => (
            <FilterRow
              key={host}
              active={tracker === host}
              label={host}
              count={hashes.size}
              icon={<Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              onClick={() => setUrlFilter({ tracker: host })}
              contextMenu={
                <ContextMenuContent>
                  <TorrentOpItems
                    getHashes={() => [...hashes]}
                    disabled={hashes.size === 0}
                    onRemove={openDeleteDialog}
                  />
                </ContextMenuContent>
              }
            />
          ))}
      </Section>

      {/* Context-menu dialogs (portal-rendered) */}
      <DeleteConfirmDialog state={deleteDialog} setState={setDeleteDialog} />
    </aside>
  );
}
