import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  /** View menu: show/hide the filter sidebar */
  sidebarVisible: boolean;
  /** View menu: show/hide the bottom status bar */
  statusBarVisible: boolean;
  /** Torrent table column widths (TanStack columnSizing), auto-persisted after dragging */
  columnSizing: Record<string, number>;
  /** Torrent table column visibility (header right-click checkboxes), persisted */
  columnVisibility: Record<string, boolean>;
  /** Torrent table column order (header drag reordering), persisted */
  columnOrder: string[];
  /** Torrent list sorting (header click), persisted across reloads */
  torrentSorting: SortingState;
  /** Last status filter chosen in the toolbar; a fresh open without ?status=
   *  in the URL seeds the filter from it (explicit URLs always win) */
  lastTorrentStatus: string;
  /** Whether the detail panel at the bottom of the torrent list is expanded
   *  (like qBT, shown after clicking a row) */
  detailPanelOpen: boolean;
  /** Torrent currently shown in the panel (shared across views: when switching
   *  back from the mobile detail route to desktop, it continues into the panel) */
  detailHash: string | null;
  toggleSidebar: () => void;
  toggleStatusBar: () => void;
  setColumnSizing: (sizing: Record<string, number>) => void;
  setColumnVisibility: (v: Record<string, boolean>) => void;
  setColumnOrder: (order: string[]) => void;
  setTorrentSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
  setLastTorrentStatus: (status: string) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setDetailHash: (hash: string | null) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      statusBarVisible: true,
      columnSizing: {},
      columnVisibility: {},
      columnOrder: [],
      torrentSorting: [],
      lastTorrentStatus: "all",
      detailPanelOpen: false,
      detailHash: null,
      toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
      toggleStatusBar: () => set((s) => ({ statusBarVisible: !s.statusBarVisible })),
      setColumnSizing: (columnSizing) => set({ columnSizing }),
      setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      setTorrentSorting: (updater) =>
        set((s) => ({
          torrentSorting: typeof updater === "function" ? updater(s.torrentSorting) : updater,
        })),
      setLastTorrentStatus: (lastTorrentStatus) => set({ lastTorrentStatus }),
      setDetailPanelOpen: (detailPanelOpen) => set({ detailPanelOpen }),
      setDetailHash: (detailHash) => set({ detailHash }),
    }),
    // View toggles, column widths/order, list sorting, the last status filter
    // and the detail-panel toggle are persisted; the other URL-driven filters
    // (search/category/tag/tracker) and detailHash are not — detailHash's
    // torrent may already be deleted (the panel handles that fallback itself)
    {
      name: "qiubi-ui",
      partialize: (s) => ({
        sidebarVisible: s.sidebarVisible,
        statusBarVisible: s.statusBarVisible,
        columnSizing: s.columnSizing,
        columnVisibility: s.columnVisibility,
        columnOrder: s.columnOrder,
        torrentSorting: s.torrentSorting,
        lastTorrentStatus: s.lastTorrentStatus,
        detailPanelOpen: s.detailPanelOpen,
      }),
    },
  ),
);
