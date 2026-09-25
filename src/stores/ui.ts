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
      detailPanelOpen: false,
      detailHash: null,
      toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
      toggleStatusBar: () => set((s) => ({ statusBarVisible: !s.statusBarVisible })),
      setColumnSizing: (columnSizing) => set({ columnSizing }),
      setColumnVisibility: (columnVisibility) => set({ columnVisibility }),
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      setDetailPanelOpen: (detailPanelOpen) => set({ detailPanelOpen }),
      setDetailHash: (detailHash) => set({ detailHash }),
    }),
    // Filters are not persisted; view toggles, column widths/order and the
    // detail-panel toggle are; detailHash is not persisted (the torrent may
    // already be deleted — the panel handles that fallback itself)
    {
      name: "qiubi-ui",
      partialize: (s) => ({
        sidebarVisible: s.sidebarVisible,
        statusBarVisible: s.statusBarVisible,
        columnSizing: s.columnSizing,
        columnVisibility: s.columnVisibility,
        columnOrder: s.columnOrder,
        detailPanelOpen: s.detailPanelOpen,
      }),
    },
  ),
);
