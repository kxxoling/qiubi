/**
 * Desktop torrent table — marquee-scoped container + header (sort/drag-reorder/
 * resize/column-visibility context menu) + rows with context menu.
 *
 * Marquee selection is scoped INSIDE the scroll container: pointer presses on
 * sibling regions (toolbar, detail panel handle) can never leak into selection
 * because events do not bubble across sibling nodes.
 *
 * All rows stay mounted (no virtualization); rendering cost is kept in check
 * by row-level memoization: a row only re-renders when ITS torrent object
 * changed (the maindata merge preserves object identity for untouched
 * torrents), its selection/focus state changed, or the column set / locale
 * changed. Callbacks and list-level data (categories, tags, selectedHashes)
 * are forwarded through a ref that is refreshed on every parent render, so
 * the memo is neither defeated by inline closures nor served stale handlers.
 */
import { flexRender, type Header, type Row, type Table } from "@tanstack/react-table";
import type * as React from "react";
import { memo, type RefObject, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type CtxAction,
  ctxHashesFor,
  TorrentContextMenu,
} from "@/components/torrent/TorrentContextMenu";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UiTable,
} from "@/components/ui/table";
import { useUiStore } from "@/stores/ui";
import type { TorrentInfo } from "@/types/qbt";

/** Custom drag image element for the active header drag (removed on dragend) */
let dragGhostEl: HTMLElement | null = null;

export type TorrentTableProps = {
  table: Table<TorrentInfo>;
  rows: Row<TorrentInfo>[];
  selectedHashes: string[];
  categories: { name: string; savePath: string }[] | undefined;
  tags: string[] | undefined;
  focusedIndex: number;
  isLoading: boolean;
  /** Selection hook bindings (marquee + row click/context) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  marquee: { x0: number; y0: number; x1: number; y1: number } | null;
  handlePointerDown: (e: React.PointerEvent) => void;
  handleRowClick: (e: React.MouseEvent, idx: number) => boolean;
  handleRowContextMenu: (
    row: Row<TorrentInfo>,
    idx: number,
    setFocused: (i: number) => void,
  ) => void;
  setFocusedIndex: (i: number) => void;
  /** Header drag-reorder bindings */
  dragColumnRef: React.MutableRefObject<string | null>;

  resizingRef: React.MutableRefObject<boolean>;
  markResizing: () => void;
  /** Commit a header drag: place `from` before/after `targetId` */
  dropColumn: (from: string, targetId: string, side: "left" | "right") => void;
  /** Context menu action dispatcher */
  onCtxAction: (action: CtxAction, hashes: string[], row?: TorrentInfo) => void;
  /** Row click/double-click open the bottom detail panel */
  onOpenDetail: (hash: string) => void;
};

/** Everything a row needs that changes at list level (not per row). Passed via
 *  a ref refreshed on every parent render so the row memo can ignore it. */
type StableRowDeps = {
  selectedHashes: string[];
  categories: { name: string; savePath: string }[] | undefined;
  tags: string[] | undefined;
  handleRowClick: (e: React.MouseEvent, idx: number) => boolean;
  handleRowContextMenu: (
    row: Row<TorrentInfo>,
    idx: number,
    setFocused: (i: number) => void,
  ) => void;
  setFocusedIndex: (i: number) => void;
  onCtxAction: (action: CtxAction, hashes: string[], row?: TorrentInfo) => void;
  onOpenDetail: (hash: string) => void;
};

type TorrentRowProps = {
  row: Row<TorrentInfo>;
  idx: number;
  isSelected: boolean;
  isFocused: boolean;
  /** Visible column ids + locale; changes invalidate every row's cells */
  columnSignature: string;
  depsRef: RefObject<StableRowDeps>;
};

function TorrentRowImpl({
  row,
  idx,
  isSelected,
  isFocused,
  columnSignature,
  depsRef,
}: TorrentRowProps) {
  const deps = depsRef.current;
  return (
    <TorrentContextMenu
      row={row}
      ctxHashes={ctxHashesFor(row, deps.selectedHashes)}
      categories={deps.categories}
      tags={deps.tags}
      onAction={deps.onCtxAction}
      renderRow={
        <TableRow
          data-row-hash={row.original.hash}
          className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : ""} ${
            isFocused ? "ring-1 ring-primary/50 bg-primary/5" : ""
          }`}
          onClick={(e) => {
            // false = click produced by a marquee release; skip select & panel
            if (!deps.handleRowClick(e, idx)) return;
            // Single click syncs the bottom detail panel (qBT behavior)
            deps.onOpenDetail(row.original.hash);
          }}
          onContextMenu={() => deps.handleRowContextMenu(row, idx, deps.setFocusedIndex)}
          onDoubleClick={() => deps.onOpenDetail(row.original.hash)}
        />
      }
      cells={row
        .getVisibleCells()
        .map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
    />
  );
}

/** Row memo: re-render only when this row's data/state actually changed. The
 *  TanStack Row instance itself is rebuilt whenever the data reference changes
 *  (every second with active torrents), so identity lives in row.original —
 *  which the maindata merge keeps stable for untouched torrents. */
const TorrentRow = memo(
  TorrentRowImpl,
  (a, b) =>
    a.row.original === b.row.original &&
    a.isSelected === b.isSelected &&
    a.isFocused === b.isFocused &&
    a.idx === b.idx &&
    a.columnSignature === b.columnSignature,
);

export function TorrentTable({
  table,
  rows,
  selectedHashes,
  categories,
  tags,
  focusedIndex,
  isLoading,
  containerRef,
  marquee,
  handlePointerDown,
  handleRowClick,
  handleRowContextMenu,
  setFocusedIndex,
  dragColumnRef,
  resizingRef,
  markResizing,
  dropColumn,
  onCtxAction,
  onOpenDetail,
}: TorrentTableProps) {
  const { t, i18n } = useTranslation();
  const setColumnSizing = useUiStore((s) => s.setColumnSizing);
  const columns = table.getAllLeafColumns();
  /** Insertion indicator while dragging: edge of which column, which side.
   *  The list does NOT reorder during the drag — the move happens on drop —
   *  so the indicator is the only thing that moves. */
  const [dropHint, setDropHint] = useState<{ id: string; side: "left" | "right" } | null>(null);

  /** Header drag-reorder handlers, hoisted out of the deeply nested header
   *  JSX. The drag itself never reorders — dragover only moves the insertion
   *  indicator; the move commits once on drop. */
  const headerDragHandlers = (h: Header<TorrentInfo, unknown>) => ({
    onDragStart: (e: React.DragEvent<HTMLElement>) => {
      // Resize-handle gesture bubbling to the th: cancel the drag so column
      // resizing keeps working
      if (resizingRef.current) {
        e.preventDefault();
        return;
      }
      dragColumnRef.current = h.column.id;
      e.dataTransfer.effectAllowed = "move";
      e.currentTarget.setAttribute("data-dragging", "");
      // Custom drag image: the native one snapshots the whole th — wide
      // headers dragged a mostly empty rectangle. A compact chip with the
      // column name reads far better.
      const label =
        typeof h.column.columnDef.header === "string" ? h.column.columnDef.header : h.column.id;
      dragGhostEl = document.createElement("div");
      dragGhostEl.textContent = label;
      dragGhostEl.className =
        "fixed top-0 left-0 z-50 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-lg pointer-events-none";
      dragGhostEl.style.opacity = "0.9";
      dragGhostEl.style.transform = "translate(-100px, -100px)";
      document.body.appendChild(dragGhostEl);
      e.dataTransfer.setDragImage(
        dragGhostEl,
        dragGhostEl.offsetWidth / 2,
        dragGhostEl.offsetHeight / 2,
      );
    },
    onDragOver: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      const from = dragColumnRef.current;
      const to = h.column.id;
      if (!from || from === to) {
        setDropHint(null);
        return;
      }
      // Which side of the target the pointer is on picks the insertion edge;
      // the order itself stays put until drop (no live reorder → no
      // oscillation, and the affected columns never shift under the pointer)
      const rect = e.currentTarget.getBoundingClientRect();
      // Flip side min(200px, 1/3 width) from the left edge — a midpoint needs
      // too much travel on wide columns like Name
      const flipAt = rect.left + Math.min(200, rect.width / 3);
      const side = e.clientX < flipAt ? "left" : "right";
      const order = table.getState().columnOrder.length
        ? table.getState().columnOrder
        : table.getAllLeafColumns().map((c) => c.id);
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) {
        setDropHint(null);
        return;
      }
      // Hide the indicator when the drop would be a no-op (inserting right
      // where the column already is)
      const insertAt = toIdx + (side === "right" ? 1 : 0);
      const finalIdx = fromIdx < insertAt ? insertAt - 1 : insertAt;
      setDropHint(finalIdx === fromIdx ? null : { id: to, side });
    },
    onDragLeave: (e: React.DragEvent<HTMLElement>) => {
      // Leaving a header clears its indicator (entering the neighbor re-sets
      // it in the same frame)
      if (!e.currentTarget.contains(e.relatedTarget as Node | null))
        setDropHint((h2) => (h2?.id === h.column.id ? null : h2));
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      const from = dragColumnRef.current;
      if (from && dropHint && dropHint.id === h.column.id)
        dropColumn(from, dropHint.id, dropHint.side);
      setDropHint(null);
    },
    onDragEnd: (e: React.DragEvent<HTMLElement>) => {
      dragColumnRef.current = null;
      setDropHint(null);
      dragGhostEl?.remove();
      dragGhostEl = null;
      e.currentTarget.removeAttribute("data-dragging");
    },
  });

  const depsRef = useRef<StableRowDeps>(null as unknown as StableRowDeps);
  depsRef.current = {
    selectedHashes,
    categories,
    tags,
    handleRowClick,
    handleRowContextMenu,
    setFocusedIndex,
    onCtxAction,
    onOpenDetail,
  };

  const columnSignature = `${i18n.language}:${table
    .getVisibleLeafColumns()
    .map((c) => c.id)
    .join(",")}`;

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onPointerDown={handlePointerDown}
    >
      {/* Marquee rectangle */}
      {marquee && (
        <div
          className="pointer-events-none absolute z-10 left-(--mx) top-(--my) w-(--mw) h-(--mh) border border-primary/60 bg-primary/10"
          style={
            {
              "--mx": `${Math.min(marquee.x0, marquee.x1)}px`,
              "--my": `${Math.min(marquee.y0, marquee.y1)}px`,
              "--mw": `${Math.abs(marquee.x1 - marquee.x0)}px`,
              "--mh": `${Math.abs(marquee.y1 - marquee.y0)}px`,
            } as React.CSSProperties
          }
        />
      )}
      <div className="rounded-md border">
        <UiTable className="table-fixed" style={{ minWidth: table.getTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  /* Right-click header = column visibility menu (qBT style); the render
                     prop passes through the th to avoid invalid table DOM;
                     drag = column reorder (live preview on dragover, persisted on drop) */
                  <ContextMenu key={h.id}>
                    <ContextMenuTrigger
                      render={
                        <TableHead
                          className={`relative ${h.column.getCanSort() ? "cursor-pointer select-none" : ""} data-dragging:opacity-45`}
                          style={{ width: h.getSize() }}
                          onClick={h.column.getToggleSortingHandler()}
                          draggable
                          {...headerDragHandlers(h)}
                        />
                      }
                    >
                      {dropHint?.id === h.column.id && (
                        /* Insertion indicator: a primary bar on the edge the
                           dragged column will land on */
                        <div
                          className={`pointer-events-none absolute inset-y-0 z-20 w-[3px] rounded-full bg-primary ${
                            dropHint.side === "left" ? "left-0" : "right-0"
                          }`}
                        />
                      )}
                      {h.isPlaceholder ? null : (
                        // table-fixed shrinks cells below their content width
                        // when columns are resized narrow; clip the title with
                        // an ellipsis instead of letting it paint over the
                        // neighboring header (the sort arrow never truncates)
                        <div className="flex min-w-0 items-center">
                          <span className="min-w-0 flex-1 truncate">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </span>
                          <span className="shrink-0">
                            {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                          </span>
                        </div>
                      )}
                      {/* Resize handle: drag or arrow keys to resize (qBT style),
                           double-click resets to default width */}
                      {h.column.getCanResize() && (
                        <button
                          type="button"
                          aria-label={`${t("Resize column")}: ${typeof h.column.columnDef.header === "string" ? h.column.columnDef.header : h.column.id}`}
                          onMouseDown={(e) => {
                            markResizing();
                            h.getResizeHandler()(e);
                          }}
                          onTouchStart={h.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            h.column.resetSize();
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                            e.preventDefault();
                            e.stopPropagation();
                            const delta = e.key === "ArrowRight" ? 20 : -20;
                            const min = h.column.columnDef.minSize ?? 40;
                            setColumnSizing({
                              ...useUiStore.getState().columnSizing,
                              [h.column.id]: Math.max(min, h.getSize() + delta),
                            });
                          }}
                          className={`absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize touch-none border-0 bg-transparent p-0 select-none transition-colors outline-none hover:bg-primary/50 focus-visible:bg-primary/60 ${
                            h.column.getIsResizing() ? "bg-primary" : ""
                          }`}
                        />
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="max-h-[min(36rem,calc(100dvh-8rem))] overflow-y-auto">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {t("Visible columns")}
                      </div>
                      {table
                        .getAllLeafColumns()
                        .filter((c) => c.id !== "select")
                        .map((c) => (
                          <ContextMenuCheckboxItem
                            key={c.id}
                            checked={c.getIsVisible()}
                            onCheckedChange={(v) => c.toggleVisibility(!!v)}
                          >
                            {typeof c.columnDef.header === "string" ? t(c.columnDef.header) : c.id}
                          </ContextMenuCheckboxItem>
                        ))}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, idx) => (
                <TorrentRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  isSelected={row.getIsSelected()}
                  isFocused={focusedIndex === idx}
                  columnSignature={columnSignature}
                  depsRef={depsRef}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? t("Connecting...") : t("No results found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
    </div>
  );
}
