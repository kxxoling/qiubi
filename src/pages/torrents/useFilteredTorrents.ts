/**
 * Client-side torrent filtering: status + keyword + category (incl.
 * uncategorized) + tag (incl. untagged) + tracker (incl. trackerless).
 * Returns a memoized stable array (fresh arrays would defeat TanStack
 * autoReset guards and cause render loops).
 */
import { useMemo } from "react";
import { matchStatus } from "@/lib/torrentStatus";
import type { TorrentInfo } from "@/types/qbt";

export function useFilteredTorrents(
  torrents: TorrentInfo[] | undefined,
  filters: {
    search: string;
    status: string;
    category: string;
    tag: string;
    tracker: string;
    /** sync/maindata membership map (tracker URL → hashes); absent = old first-tracker matching */
    trackersMap?: Record<string, string[]>;
  },
) {
  const { search, status, category, tag, tracker, trackersMap } = filters;

  // hash → set of tracker hosts (from the URL → hashes membership map)
  const torrentHosts = useMemo(() => {
    const m = new Map<string, Set<string>>();
    if (!trackersMap) return m;
    for (const [url, hashes] of Object.entries(trackersMap)) {
      if (url.startsWith("**")) continue;
      let host: string;
      try {
        host = new URL(url).host;
      } catch {
        continue;
      }
      for (const h of hashes) {
        const set = m.get(h) ?? new Set<string>();
        set.add(host);
        m.set(h, set);
      }
    }
    return m;
  }, [trackersMap]);

  return useMemo(
    () =>
      (torrents ?? []).filter((tr) => {
        if (!matchStatus(tr.state, status)) return false;
        if (search !== "" && !tr.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (category === "__uncategorized__") {
          if (tr.category) return false;
        } else if (category !== "" && tr.category !== category) return false;
        if (tag === "__untagged__") {
          if (
            tr.tags
              .split(",")
              .map((s) => s.trim())
              .some(Boolean)
          )
            return false;
        } else if (
          tag !== "" &&
          !tr.tags
            .split(",")
            .map((s) => s.trim())
            .includes(tag)
        ) {
          return false;
        }
        if (tracker === "__none__") {
          if (tr.tracker) return false;
        } else if (tracker !== "") {
          if (torrentHosts.size > 0) {
            // full membership: the torrent uses ANY tracker on that host
            const hosts = torrentHosts.get(tr.hash);
            if (!hosts?.has(tracker)) return false;
          } else {
            try {
              if (!tr.tracker || new URL(tr.tracker).host !== tracker) return false;
            } catch {
              return false;
            }
          }
        }
        return true;
      }),
    [torrents, search, status, category, tag, tracker, torrentHosts],
  );
}
