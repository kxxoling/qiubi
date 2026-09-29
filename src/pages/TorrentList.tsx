/**
 * Torrent list (qBT main view)
 *
 * Filtering is entirely URL-driven (#/?status=&q=&category=&tag=): bookmarkable,
 * shareable, survives refresh. The toolbar provides a status select + keyword
 * search (debounced back to the URL); the sidebar provides the category/tag
 * tree. Interaction logic lives in components/torrent/ and pages/torrents/.
 */
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { TorrentCardList } from "@/components/torrent/TorrentCardList";
import {
  type DeleteDialogState,
  type LimitDialogState,
  type RenameDialogState,
  TorrentDialogs,
} from "@/components/torrent/TorrentDialogs";
import { useTorrentSelection } from "@/components/torrent/useTorrentSelection";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTorrentList } from "@/hooks/useMainDataSync";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui";
import { DEFAULT_COLUMN_VISIBILITY, useTorrentColumns } from "./torrents/columns";
import { DetailDrawer } from "./torrents/DetailDrawer";
import { TorrentTable } from "./torrents/TorrentTable";
import { TorrentToolbar } from "./torrents/TorrentToolbar";
import { useFilteredTorrents } from "./torrents/useFilteredTorrents";
import { useTorrentActions } from "./torrents/useTorrentActions";
import { useTorrentKeyboard } from "./torrents/useTorrentKeyboard";

export function TorrentList() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const urlSearch = useSearch({ strict: false }) as {
    status?: string;
    q?: string;
    category?: string;
    tag?: string;
    tracker?: string;
  };
  const status = urlSearch.status ?? "all";
  const category = urlSearch.category ?? "";
  const tag = urlSearch.tag ?? "";
  const tracker = urlSearch.tracker ?? "";
  const {
    columnSizing,
    setColumnSizing,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    torrentSorting: sorting,
    setTorrentSorting: setSorting,
    lastTorrentStatus,
    setLastTorrentStatus,
    detailPanelOpen,
    setDetailPanelOpen,
    detailHash,
    setDetailHash,
  } = useUiStore();

  /** Header drag-reorder: id of the column being dragged */
  const dragColumnRef = useRef<string | null>(null);
  /** Resize-handle pressed: dragstart fires on the th (not the handle), so a
      flag distinguishes the two drag gestures */
  const resizingRef = useRef(false);
  const markResizing = () => {
    resizingRef.current = true;
    const clear = () => {
      resizingRef.current = false;
      document.removeEventListener("mouseup", clear);
    };
    document.addEventListener("mouseup", clear);
  };
  /** Commit a header drag: place `from` before/after `targetId` (the list
   *  stays still during the drag; only the insertion indicator moves) */
  const dropColumn = (from: string, targetId: string, side: "left" | "right") => {
    if (from === targetId) return;
    const base = columnOrder.length ? columnOrder : table.getAllLeafColumns().map((c) => c.id);
    const fromIdx = base.indexOf(from);
    let insertAt = base.indexOf(targetId) + (side === "right" ? 1 : 0);
    if (fromIdx < 0 || insertAt - (side === "right" ? 1 : 0) < 0) return;
    if (fromIdx < insertAt) insertAt -= 1; // removal shifts later positions
    if (insertAt === fromIdx) return;
    const next = [...base];
    next.splice(insertAt, 0, next.splice(fromIdx, 1)[0]);
    setColumnOrder(next);
  };

  // Sorting lives in the ui store so it survives reloads (useState would
  // reset it on every mount)
  // Keyboard/context-menu focus follows the torrent's identity, not its row
  // position: rows reindex on delete/filter/sort, and an index-keyed focus
  // would silently land on whichever torrent slid into that slot (the same
  // pitfall selection escaped via getRowId). The row index is derived below,
  // where rows exist.
  const [focusedHash, setFocusedHash] = useState<string | null>(null);

  /** Patch URL filter params (replace, no history entries) */
  const setUrlFilter = useCallback(
    (patch: Partial<{ status: string; q: string; category: string; tag: string }>) => {
      navigate({
        to: "/",
        search: (prev: Record<string, string | undefined>) => {
          const next: Record<string, string | undefined> = { ...prev, ...patch };
          // Empty/default values stay out of the URL
          for (const k of Object.keys(next)) {
            if (!next[k] || (k === "status" && next[k] === "all")) delete next[k];
          }
          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Keyword: instant local filter, debounced 300ms back into the URL
  const [search, setSearch] = useState(urlSearch.q ?? "");
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((urlSearch.q ?? "") !== search) setUrlFilter({ q: search });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, urlSearch.q, setUrlFilter]);
  // Sync external changes (e.g. navigating from the categories page) into the input
  useEffect(() => {
    setSearch(urlSearch.q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch.q]);

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ hashes: [], open: false });
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    hash: "",
    name: "",
    open: false,
  });
  const [limitDialog, setLimitDialog] = useState<LimitDialogState>({
    hashes: [],
    type: "dl",
    value: "",
    open: false,
  });

  // Shared sync/maindata incremental polling
  const { data: mainData, torrents, categories, tags, isLoading } = useTorrentList();

  // Close the detail panel when its torrent is deleted (otherwise the panel
  // keeps polling a dead hash and spams 404s)
  useEffect(() => {
    if (detailHash && torrents && !torrents.some((tr) => tr.hash === detailHash)) {
      setDetailHash(null);
      setDetailPanelOpen(false);
    }
  }, [detailHash, torrents, setDetailHash, setDetailPanelOpen]);

  // A fresh open (no ?status= in the URL) seeds the status filter from the
  // last session; an explicit URL (shared link) always wins
  // biome-ignore lint/correctness/useExhaustiveDependencies: seeding runs once on mount; the effect itself sets urlSearch.status
  useEffect(() => {
    if ((urlSearch.status ?? "all") === "all" && lastTorrentStatus !== "all") {
      setUrlFilter({ status: lastTorrentStatus });
    }
    // mount-only by design: urlSearch.status is set by this very effect
  }, []);

  const filteredData = useFilteredTorrents(torrents, {
    search,
    status,
    category,
    tag,
    tracker,
    trackersMap: mainData?.trackers,
  });

  const columns = useTorrentColumns();

  // Seed default column visibility on first render
  useEffect(() => {
    const cur = useUiStore.getState().columnVisibility;
    if (Object.keys(cur).length === 0) setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setColumnVisibility]);

  const table = useReactTable({
    data: filteredData,
    columns,
    // Polling produces a new data reference every 2s; autoReset would wipe selection
    autoResetAll: false,
    state: { sorting, columnSizing, columnVisibility, columnOrder },
    onColumnOrderChange: (updater) => {
      setColumnOrder(
        typeof updater === "function" ? updater(useUiStore.getState().columnOrder) : updater,
      );
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility(
        typeof updater === "function" ? updater(useUiStore.getState().columnVisibility) : updater,
      );
    },
    onSortingChange: setSorting,
    // Column resize: live preview on change; sizes persist via uiStore (qiubi-ui)
    columnResizeMode: "onChange",
    onColumnSizingChange: (updater) => {
      setColumnSizing(
        typeof updater === "function" ? updater(useUiStore.getState().columnSizing) : updater,
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    // Selection (and React keys) must follow the torrent's identity, not its
    // position: the default row.id is the array index, so a torrent leaving a
    // filtered view handed its selection to whichever torrent slid into that
    // index (e.g. the selected download finishes under a "downloading" filter)
    getRowId: (row) => row.hash,
  });

  const rows = table.getRowModel().rows;
  // -1 once the focused torrent leaves the list (deleted or filtered out) —
  // no row inherits the focus ring
  const focusedIndex =
    focusedHash == null ? -1 : rows.findIndex((r) => r.original.hash === focusedHash);
  const setFocusedIndex = useCallback(
    (i: number) => setFocusedHash(i >= 0 ? (rows[i]?.original.hash ?? null) : null),
    [rows],
  );
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedHashes = selectedRows.map((r) => r.original.hash);

  // The row click that opens the detail panel also selects the row; when that
  // torrent is later deselected (ctrl-click toggle, marquee over empty space,
  // plain click on blank), close the panel instead of stranding it open on an
  // unselected torrent. Only the selected→deselected transition closes: the
  // command palette ("@search") opens the panel without selecting anything,
  // so its torrent was never in the selection and the panel stays.
  const panelTorrentWasSelectedRef = useRef(false);
  useEffect(() => {
    if (!detailHash) {
      panelTorrentWasSelectedRef.current = false;
      return;
    }
    const isSelected = selectedHashes.includes(detailHash);
    if (panelTorrentWasSelectedRef.current && !isSelected && detailPanelOpen) {
      setDetailHash(null);
      setDetailPanelOpen(false);
    }
    panelTorrentWasSelectedRef.current = isSelected;
  }, [detailHash, detailPanelOpen, selectedHashes, setDetailHash, setDetailPanelOpen]);

  const { containerRef, marquee, handleRowClick, handlePointerDown, handleRowContextMenu } =
    useTorrentSelection(table, rows);

  const { doAction, scopedAction, batchAction, handleCtxAction } = useTorrentActions({
    table,
    rows,
    selectedHashes,
    filteredHashes: filteredData.map((tr) => tr.hash),
    setDeleteDialog,
    setRenameDialog,
    setLimitDialog,
  });

  useTorrentKeyboard({
    table,
    rows,
    focusedIndex,
    setFocusedIndex,
    selectedHashes,
    doAction,
    batchAction,
    setDeleteDialog,
    setDetailHash,
    setDetailPanelOpen,
    isMobile,
    navigate,
  });

  const openDetail = useCallback(
    (hash: string) => {
      setDetailHash(hash);
      setDetailPanelOpen(true);
    },
    [setDetailHash, setDetailPanelOpen],
  );

  const tableBlock = (
    <TorrentTable
      table={table}
      rows={rows}
      selectedHashes={selectedHashes}
      categories={categories}
      tags={tags}
      focusedIndex={focusedIndex}
      isLoading={isLoading}
      containerRef={containerRef}
      marquee={marquee}
      handlePointerDown={handlePointerDown}
      handleRowClick={handleRowClick}
      handleRowContextMenu={handleRowContextMenu}
      setFocusedIndex={setFocusedIndex}
      dragColumnRef={dragColumnRef}
      resizingRef={resizingRef}
      markResizing={markResizing}
      dropColumn={dropColumn}
      onCtxAction={handleCtxAction}
      onOpenDetail={openDetail}
    />
  );

  return (
    <div
      className={cn(
        isMobile ? "space-y-4" : "flex h-full flex-col gap-4",
        marquee && "select-none",
      )}
    >
      <TorrentToolbar
        status={status}
        onStatusChange={(v) => {
          setLastTorrentStatus(v ?? "all");
          setUrlFilter({ status: v ?? "all" });
        }}
        search={search}
        onSearchChange={setSearch}
        selectedCount={selectedHashes.length}
        onPauseAll={() =>
          scopedAction(
            (h) => qbtClient.pauseTorrents(h),
            selectedHashes.length ? t("Pause") : t("Pause All"),
          )
        }
        onResumeAll={() =>
          scopedAction(
            (h) => qbtClient.resumeTorrents(h),
            selectedHashes.length ? t("Resume") : t("Resume All"),
          )
        }
        onDelete={() => setDeleteDialog({ hashes: selectedHashes, open: true })}
      />

      {/* Mobile: card list */}
      {isMobile && (
        <TorrentCardList
          rows={rows}
          selectedHashes={selectedHashes}
          onToggle={(hash) => {
            const row = rows.find((r) => r.original.hash === hash);
            // Incremental toggle — long-press multi-select accumulates
            // (replacing the map would keep only the last-selected card)
            if (row)
              table.setRowSelection((prev) => ({
                ...prev,
                [row.id]: !row.getIsSelected(),
              }));
          }}
          onOpen={(hash) => navigate({ to: "/torrents/$hash", params: { hash } })}
          onDelete={(hashes) => setDeleteDialog({ hashes, open: true })}
        />
      )}

      {/* Desktop: table + detail drawer (split state and animations live in
          the component; TorrentList only decides when it's open and for which
          torrent) */}
      {!isMobile && (
        <DetailDrawer
          table={tableBlock}
          hash={detailHash}
          open={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
        />
      )}

      <TorrentDialogs
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        renameDialog={renameDialog}
        setRenameDialog={setRenameDialog}
        limitDialog={limitDialog}
        setLimitDialog={setLimitDialog}
        onDone={() => table.toggleAllPageRowsSelected(false)}
      />
    </div>
  );
}
