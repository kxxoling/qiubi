/**
 * Search page state
 *
 * Module-level (NOT persisted): the active search job and its accumulated
 * results must survive route switches — the job keeps running server-side,
 * so resetting on unmount stranded both. A reload intentionally resets
 * everything, matching the server-side job's lifetime.
 */

import { create } from "zustand";
import type { SearchResult } from "@/types/qbt";

type SearchState = {
  pattern: string;
  category: string;
  /** Official WebUI default: first option "Only enabled" */
  pluginFilter: string;
  activeId: number | null;
  results: SearchResult[];
  /** Offset of the next incremental results page */
  offset: number;
  /** The ?q= value already auto-started (guards against double-start on remount) */
  autoStartedFor: string | null;
  setPattern: (v: string) => void;
  setCategory: (v: string) => void;
  setPluginFilter: (v: string) => void;
  /** Point the page at a fresh job: resets accumulated results and offset */
  beginSearch: (id: number) => void;
  appendResults: (r: SearchResult[]) => void;
  setAutoStartedFor: (q: string) => void;
};

export const useSearchStore = create<SearchState>()((set) => ({
  pattern: "",
  category: "all",
  pluginFilter: "enabled",
  activeId: null,
  results: [],
  offset: 0,
  autoStartedFor: null,
  setPattern: (pattern) => set({ pattern }),
  setCategory: (category) => set({ category }),
  setPluginFilter: (pluginFilter) => set({ pluginFilter }),
  beginSearch: (id) => set({ activeId: id, results: [], offset: 0 }),
  appendResults: (r) =>
    set((s) => (r.length ? { results: [...s.results, ...r], offset: s.offset + r.length } : s)),
  setAutoStartedFor: (autoStartedFor) => set({ autoStartedFor }),
}));
