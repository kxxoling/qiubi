/**
 * Desktop torrent table — marquee-scoped container + header (sort/drag-reorder/
 * resize/column-visibility context menu) + rows with context menu.
 *
 * Marquee selection is scoped INSIDE the scroll container: pointer presses on
 * sibling regions (toolbar, detail panel handle) can never leak into selection
 * because events do not bubble across sibling nodes.
 */
import { flexRender, type Row, type Table } from "@tanstack/react-table";
import type * as React from "react";
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
  moveColumn: (from: string, to: string) => void;
  /** Context menu action dispatcher */
  onCtxAction: (action: CtxAction, hashes: string[], row?: TorrentInfo) => void;
  /** Row click/double-click open the bottom detail panel */
  onOpenDetail: (hash: string) => void;
};

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
  moveColumn,
  onCtxAction,
  onOpenDetail,
}: TorrentTableProps) {
  const { t } = useTranslation();
  const setColumnSizing = useUiStore((s) => s.setColumnSizing);
  const columns = table.getAllLeafColumns();

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
                          className={`relative ${h.column.getCanSort() ? "cursor-pointer select-none" : ""} data-dragging:opacity-40`}
                          style={{ width: h.getSize() }}
                          onClick={h.column.getToggleSortingHandler()}
                          draggable
                          onDragStart={(e) => {
                            // Resize-handle gesture bubbling to the th: cancel the
                            // drag so column resizing keeps working
                            if (resizingRef.current) {
                              e.preventDefault();
                              return;
                            }
                            dragColumnRef.current = h.column.id;
                            e.dataTransfer.effectAllowed = "move";
                            e.currentTarget.setAttribute("data-dragging", "");
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragColumnRef.current)
                              moveColumn(dragColumnRef.current, h.column.id);
                          }}
                          onDragEnd={(e) => {
                            dragColumnRef.current = null;
                            e.currentTarget.removeAttribute("data-dragging");
                          }}
                          onDrop={(e) => e.preventDefault()}
                        />
                      }
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
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
                    <ContextMenuContent className="max-h-72 overflow-y-auto">
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
                <TorrentContextMenu
                  key={row.id}
                  row={row}
                  ctxHashes={ctxHashesFor(row, selectedHashes)}
                  categories={categories}
                  tags={tags}
                  onAction={onCtxAction}
                  renderRow={
                    <TableRow
                      data-row-idx={idx}
                      className={`cursor-pointer transition-colors ${
                        row.getIsSelected() ? "bg-primary/10" : ""
                      } ${focusedIndex === idx ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
                      onClick={(e) => {
                        // false = click produced by a marquee release; skip select & panel
                        if (!handleRowClick(e, idx)) return;
                        // Single click syncs the bottom detail panel (qBT behavior)
                        onOpenDetail(row.original.hash);
                      }}
                      onContextMenu={() => handleRowContextMenu(row, idx, setFocusedIndex)}
                      onDoubleClick={() => onOpenDetail(row.original.hash)}
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
