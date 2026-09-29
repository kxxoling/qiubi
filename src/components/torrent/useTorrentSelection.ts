/**
 * Desktop-style selection logic for the torrent list
 *
 * Plain click selects one / Ctrl+Cmd toggles / Shift range-selects / right-click on an
 * unselected row selects just it / drag on empty space marquee-selects (rubber band) / click empty space clears.
 * Operates on TanStack Table's rowSelection state.
 */

import type { Row, Table } from "@tanstack/react-table";
import { useCallback, useRef, useState } from "react";
import type { TorrentInfo } from "@/types/qbt";

type Marquee = { x0: number; y0: number; x1: number; y1: number } | null;

export function useTorrentSelection(table: Table<TorrentInfo>, rows: Row<TorrentInfo>[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<Marquee>(null);
  /** Shift-range anchor, by torrent hash: rows reindex on delete/filter/sort,
      so an index-keyed anchor would drift onto whichever torrent slid into
      that slot between clicks */
  const anchorHashRef = useRef<string | null>(null);
  /** Marquee crossed the drag threshold: the click fired after this press-release must be swallowed */
  const suppressClickRef = useRef(false);

  /** Desktop-semantics click selection; returns false when the click is a marquee release, and the caller should skip further actions */
  const handleRowClick = useCallback(
    (e: React.MouseEvent, idx: number): boolean => {
      if (suppressClickRef.current) return false;
      const row = rows[idx];
      if (!row) return true;

      if (e.shiftKey && anchorHashRef.current != null) {
        // Resolve the anchor's CURRENT position — it may have moved (or left
        // the filtered view) since it was clicked
        const anchorIdx = rows.findIndex((r) => r.original.hash === anchorHashRef.current);
        if (anchorIdx >= 0) {
          const [from, to] = [anchorIdx, idx].sort((a, b) => a - b);
          table.setRowSelection(() => {
            const next: Record<string, boolean> = {};
            for (let i = from; i <= to; i++) next[rows[i].id] = true;
            return next;
          });
          return true;
        }
        // Anchor torrent left the list → fall through to plain-click semantics
      }

      anchorHashRef.current = row.original.hash;
      if (e.ctrlKey || e.metaKey) {
        row.toggleSelected(!row.getIsSelected());
      } else {
        // With an active multi-selection, plain-clicking one of the rows: keep the selection (only update the detail panel), don't clear the multi-select
        const current = table.getSelectedRowModel().rows;
        if (current.length > 1 && row.getIsSelected()) {
          return true; // Selection unchanged, treat as "view details" only
        }
        table.setRowSelection({ [row.id]: !row.getIsSelected() });
      }
      return true;
    },
    [rows, table],
  );

  /** Marquee: press and drag the left button within the list area (including on rows); starts only after
   *  the movement passes the threshold, otherwise it falls through as a normal click —— the table height
   *  equals the row height exactly, so there is no blank space outside rows to start from */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // Interactive controls and the header don't take part in marquee selection; rows (td/tr) allow the press and convert to marquee after dragging
      if (
        (e.target as HTMLElement).closest(
          "th,button,input,select,a,[role=menuitem],[data-slot=resizable-handle],[data-slot=detail-panel-root]",
        )
      )
        return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x0 = e.clientX - rect.left;
      const y0 = e.clientY - rect.top;
      let armed = false;

      const move = (ev: PointerEvent) => {
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        if (!armed) {
          // Drag threshold: only counts as marquee past it, otherwise wait for release to be judged a click
          if (Math.abs(cx - x0) + Math.abs(cy - y0) < 4) return;
          armed = true;
          suppressClickRef.current = true;
        }
        const x1 = Math.min(Math.max(cx, 0), rect.width);
        const y1 = Math.min(Math.max(cy, 0), rect.height);
        setMarquee({ x0, y0, x1, y1 });

        const left = Math.min(x0, x1);
        const right = Math.max(x0, x1);
        const top = Math.min(y0, y1);
        const bottom = Math.max(y0, y1);
        const next: Record<string, boolean> = {};
        // Rows identify themselves by hash on the DOM node: this listener is
        // registered once at pointerdown and outlives re-renders, so mapping a
        // row index through the captured `rows` array would misresolve
        // whenever a poll re-sorts the list mid-drag
        for (const tr of container.querySelectorAll<HTMLTableRowElement>(
          "tbody tr[data-row-hash]",
        )) {
          const r = tr.getBoundingClientRect();
          const ry0 = r.top - rect.top;
          const rx0 = r.left - rect.left;
          const intersects =
            right > rx0 && left < rx0 + r.width && bottom > ry0 && top < ry0 + r.height;
          if (intersects && tr.dataset.rowHash) next[tr.dataset.rowHash] = true;
        }
        table.setRowSelection(next);
      };

      const up = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setMarquee(null);
        // Plain click on blank space (threshold not crossed and not on a row): clear the selection
        const moved = Math.abs(ev.clientX - rect.left - x0) + Math.abs(ev.clientY - rect.top - y0);
        const onRow = !!(ev.target as HTMLElement)?.closest?.("tr");
        if (!armed && moved < 4 && !onRow) table.setRowSelection({});
        // click is dispatched after pointerup; lift the suppression on the next tick
        if (armed) setTimeout(() => (suppressClickRef.current = false), 0);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [table],
  );

  /** Right-click: on an unselected row → select only that row; if already selected keep the multi-selection */
  const handleRowContextMenu = useCallback(
    (row: Row<TorrentInfo>, idx: number, setFocusedIndex: (i: number) => void) => {
      setFocusedIndex(idx);
      if (!row.getIsSelected()) table.setRowSelection({ [row.id]: true });
    },
    [table],
  );

  return {
    containerRef,
    marquee,
    handleRowClick,
    handlePointerDown,
    handleRowContextMenu,
  };
}
