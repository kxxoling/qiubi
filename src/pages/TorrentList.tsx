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
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { TorrentCardList } from "@/components/torrent/TorrentCardList";
import { TorrentDetailPanel } from "@/components/torrent/TorrentDetailPanel";
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
import { TorrentTable } from "./torrents/TorrentTable";
import { TorrentToolbar } from "./torrents/TorrentToolbar";
import { useDetailSplit } from "./torrents/useDetailSplit";
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
  /** Move column `from` to `from`→`to`'s position (called on header dragover, live preview) */
  const moveColumn = (from: string, to: string) => {
    if (from === to) return;
    // Empty columnOrder (never dragged): seed from current column definition order
    const base = columnOrder.length ? columnOrder : table.getAllLeafColumns().map((c) => c.id);
    const fromIdx = base.indexOf(from);
    const toIdx = base.indexOf(to);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const next = [...base];
    next.splice(toIdx, 0, next.splice(fromIdx, 1)[0]);
    setColumnOrder(next);
  };

  const {
    collapsed: detailCollapsed,
    setCollapsed: setDetailCollapsed,
    flex: detailFlex,
    splitRef: detailSplitRef,
    startDrag: startDetailDrag,
  } = useDetailSplit();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

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
  const { data: mainData, torrents, categories, tags, isLoading } = useTorrentList(2000);

  // Close the detail panel when its torrent is deleted (otherwise the panel
  // keeps polling a dead hash and spams 404s)
  useEffect(() => {
    if (detailHash && torrents && !torrents.some((tr) => tr.hash === detailHash)) {
      setDetailHash(null);
      setDetailPanelOpen(false);
    }
  }, [detailHash, torrents, setDetailHash, setDetailPanelOpen]);

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
  });

  const rows = table.getRowModel().rows;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedHashes = selectedRows.map((r) => r.original.hash);

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
      moveColumn={moveColumn}
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
        onStatusChange={(v) => setUrlFilter({ status: v ?? "all" })}
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

      {/* Desktop: table, switchable to a table|detail-panel vertical split
          (layout ratio persists after drag) */}
      {!isMobile && (
        <div className="min-h-0 flex-1">
          {!detailPanelOpen ? (
            tableBlock
          ) : detailCollapsed ? (
            /* Collapsed: a single bottom bar (click to expand the panel) */
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1">{tableBlock}</div>
              <button
                type="button"
                className="group flex h-6 w-full shrink-0 cursor-pointer items-center justify-center gap-2 border-t bg-card text-xs font-normal text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => setDetailCollapsed(false)}
              >
                <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                {t("Show detail panel")}
              </button>
            </div>
          ) : (
            /* Expanded: vertical split + custom drag handle */
            <div ref={detailSplitRef} className="flex h-full flex-col">
              <div className="min-h-[120px]" style={{ flex: `${detailFlex} 1 0%` }}>
                {tableBlock}
              </div>
              <div
                className="group relative z-10 flex h-1.5 w-full shrink-0 cursor-row-resize items-center justify-center bg-border transition-colors hover:bg-primary/50"
                title={t("Resize panel")}
                onMouseDown={startDetailDrag}
                onDoubleClick={() => setDetailCollapsed(true)}
              >
                <div className="absolute inset-x-0 -top-1.5 -bottom-1.5" />
                {/* Collapse arrow (visible on hover) */}
                <ChevronDown className="absolute size-3 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              <div className="min-h-[160px]" style={{ flex: `${100 - detailFlex} 1 0%` }}>
                <TorrentDetailPanel
                  hash={detailHash}
                  onClose={() => setDetailPanelOpen(false)}
                  onCollapse={() => setDetailCollapsed(true)}
                />
              </div>
            </div>
          )}
        </div>
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
