/**
 * Shared sync/maindata incremental sync hook
 *
 * qBT's officially recommended polling approach: a full_update fetch on the
 * first call, then subsequent calls pass the rid from the response to fetch
 * only the delta (changed torrents/categories/tags/server_state), merged
 * locally into complete state.
 *
 * Header (speed bar), Dashboard (stats + charts), TorrentList/Detail all
 * share this one query (same queryKey, shared cache, only one poll running),
 * replacing the previous approach where each page independently called
 * transfer/info + torrents/info every 1-2 seconds.
 *
 * On errors (backend unreachable etc.) polling automatically degrades to
 * 10-second intervals and returns to the normal frequency on recovery,
 * avoiding log/request flooding in the error state.
 */
import { type Query, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { qbtClient } from "@/api/qbt";
import { useSpeedHistory } from "@/stores/speedHistory";
import type { TorrentInfo, TransferInfo } from "@/types/qbt";

export type MainDataState = {
  rid: number;
  torrents: Record<string, TorrentInfo>;
  categories: Record<string, { name: string; savePath: string }>;
  tags: string[];
  /** tracker URL → member torrent hashes; drives the tracker sidebar/filter */
  trackers: Record<string, string[]>;
  serverState: Partial<TransferInfo> | null;
};

export const MAINDATA_KEY = ["sync", "maindata"] as const;

/** Polling backoff: normal intervalMs, degraded to 10s on error (no flooding
 *  while qBT restarts or the network is down) */
export function pollWithBackoff<TData>(
  intervalMs: number,
  slowMs = 10000,
): (query: Query<TData, Error, TData, readonly unknown[]>) => number | false {
  return (query) => (query.state.error != null ? slowMs : intervalMs);
}

export function useMainDataSync(intervalMs = 2000) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: MAINDATA_KEY,
    queryFn: async (): Promise<MainDataState> => {
      const prev = qc.getQueryData<MainDataState>(MAINDATA_KEY);
      const res = await qbtClient.getSyncMainData(prev?.rid ?? 0);

      const base =
        res.full_update || !prev
          ? { torrents: {}, categories: {}, tags: [], trackers: {}, serverState: null as null }
          : prev;

      // Merge the torrent delta: sync returns Partial<TorrentInfo>, overlaid
      // per hash. Note: a maindata torrent entry itself has no hash field (the
      // map key is the hash), so the key must be written back into the object,
      // otherwise downstream code can't read t.hash (context menu / detail
      // navigation would get undefined)
      const torrents = { ...base.torrents };
      for (const [hash, patch] of Object.entries(res.torrents ?? {})) {
        torrents[hash] = { ...torrents[hash], ...patch, hash } as TorrentInfo;
      }
      for (const hash of res.torrents_removed ?? []) {
        delete torrents[hash];
      }

      const categories = { ...base.categories, ...res.categories };
      for (const name of res.categories_removed ?? []) {
        delete categories[name];
      }

      const tags = (res.tags ?? base.tags).filter((tag) => !(res.tags_removed ?? []).includes(tag));

      // Tracker membership (URL → hashes): deltas carry changed URLs only,
      // so merge per-URL over the base
      const trackers = { ...base.trackers, ...(res.trackers ?? {}) };

      const serverState = res.server_state
        ? { ...base.serverState, ...res.server_state }
        : base.serverState;

      // Sample speed history in one place: shared by the status bar popup and
      // Dashboard, survives page switches
      if (serverState)
        useSpeedHistory.getState().push({
          t: Date.now(),
          dl: serverState.dl_info_speed ?? 0,
          up: serverState.up_info_speed ?? 0,
        });

      return { rid: res.rid, torrents, categories, tags, trackers, serverState };
    },
    refetchInterval: pollWithBackoff(intervalMs),
    staleTime: intervalMs / 2,
  });
}

/** Convenience wrapper: get the torrent array directly (used by TorrentList / Dashboard) */
export function useTorrentList(intervalMs = 2000) {
  const query = useMainDataSync(intervalMs);
  const data = query.data;

  // Derived arrays must be memoized: returning a new array on every render
  // defeats reference checks in downstream useMemo/useReactTable(autoReset),
  // causing thousands of render loops per second
  const torrents = useMemo(() => (data ? Object.values(data.torrents) : undefined), [data]);
  const categories = useMemo(() => (data ? Object.values(data.categories) : undefined), [data]);

  return {
    ...query,
    torrents,
    categories,
    tags: data?.tags,
    serverState: data?.serverState,
  };
}
