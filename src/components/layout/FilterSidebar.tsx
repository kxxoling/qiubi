/**
 * Left filter sidebar —— aligned with the official qBT sidebar
 *
 * Three filter groups (all written to the URL):
 * - Categories: All / Uncategorized / custom categories
 * - Tags: All / Untagged / custom tags
 * - Trackers: All / Trackerless / per-tracker domains (with torrent counts)
 */
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronRight, FolderOpen, Radio, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTorrentList } from "@/hooks/useMainDataSync";
import { cn } from "@/lib/utils";
import type { TorrentInfo } from "@/types/qbt";

function FilterRow({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] outline-none transition-colors",
        active ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 px-2 pb-1 pt-3 text-xs font-semibold text-muted-foreground">
        <ChevronRight className="h-3 w-3" />
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * Tracker domain → torrent count map from sync/maindata's membership map
 * (tracker URL → member hashes, qBT's actual shape). A torrent counts toward
 * every tracker domain it uses, like the official UI; each domain counts a
 * torrent once even if it has several trackers on that host. Falls back to
 * the single primary tracker per torrent when the map is absent.
 */
function trackerCounts(
  trackersMap: Record<string, string[]> | undefined,
  torrents: TorrentInfo[] | undefined,
): Map<string, number> {
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
    return new Map([...map].map(([host, set]) => [host, set.size]));
  }
  const counts = new Map<string, number>();
  for (const tr of torrents ?? []) {
    if (!tr.tracker) continue;
    try {
      const host = new URL(tr.tracker).host;
      counts.set(host, (counts.get(host) ?? 0) + 1);
    } catch {
      // Skip non-URL formats
    }
  }
  return counts;
}

export function FilterSidebar({ onSelect }: { onSelect?: () => void } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, torrents, categories, tags } = useTorrentList(2000);
  const urlSearch = useSearch({ strict: false }) as {
    category?: string;
    tag?: string;
    tracker?: string;
  };
  const category = urlSearch.category ?? "";
  const tag = urlSearch.tag ?? "";
  const tracker = urlSearch.tracker ?? "";

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

  // Tracker counts
  const trackers = trackerCounts(data?.trackers, torrents);
  let noTracker = 0;
  for (const tr of torrents ?? []) {
    if (!tr.tracker) noTracker++;
  }

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-card p-2">
      {/* Categories */}
      <Section title={t("Category")}>
        <FilterRow
          active={category === ""}
          label={t("All")}
          count={torrents?.length ?? 0}
          onClick={() => setUrlFilter({ category: "" })}
        />
        <FilterRow
          active={category === "__uncategorized__"}
          label={t("Uncategorized")}
          count={uncategorized}
          icon={<FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          onClick={() => setUrlFilter({ category: "__uncategorized__" })}
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
            />
          ))}
      </Section>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <Section title={t("Tags")}>
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
      <Section title={t("Tracker")}>
        <FilterRow
          active={tracker === ""}
          label={t("All")}
          count={torrents?.length ?? 0}
          onClick={() => setUrlFilter({ tracker: "" })}
        />
        <FilterRow
          active={tracker === "__none__"}
          label={t("Trackerless")}
          count={noTracker}
          icon={<Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          onClick={() => setUrlFilter({ tracker: "__none__" })}
        />
        {[...trackers.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([host, count]) => (
            <FilterRow
              key={host}
              active={tracker === host}
              label={host}
              count={count}
              icon={<Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              onClick={() => setUrlFilter({ tracker: host })}
            />
          ))}
      </Section>
    </aside>
  );
}
