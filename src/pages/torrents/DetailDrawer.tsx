/**
 * Desktop torrent-list layout: full-height table plus the detail drawer at
 * the bottom (table | drawer split, drag the handle to resize, double-click
 * or the bar to collapse). Owns the persisted split state (useDetailSplit)
 * and the exit-animation render state, so TorrentList only decides WHEN the
 * drawer is open (and for which torrent).
 *
 * Animations: open slides the drawer (handle + panel as one block) up into
 * its slot; close gives the table its full height back immediately and
 * slides the drawer down over it as an overlay — no layout space is held,
 * so the list bottom is never blocked mid-animation.
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TorrentDetailPanel } from "@/components/torrent/TorrentDetailPanel";
import { useDetailSplit } from "@/pages/torrents/useDetailSplit";

export function DetailDrawer({
  table,
  hash,
  open,
  onClose,
}: {
  table: ReactNode;
  hash: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { collapsed, setCollapsed, flex, splitRef, startDrag } = useDetailSplit();

  // Exit animation: keep the drawer mounted briefly after close so the
  // slide-out can finish before unmount (opening mounts it immediately)
  const [rendered, setRendered] = useState(open);
  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    const id = setTimeout(() => setRendered(false), 190);
    return () => clearTimeout(id);
  }, [open]);

  return (
    // overflow-hidden clips the sliding drawer at the list bounds so the
    // page never grows a scrollbar mid-animation
    <div className="min-h-0 flex-1 overflow-hidden">
      {!open && !rendered ? (
        table
      ) : !open ? (
        <div className="relative h-full">
          <div className="h-full">{table}</div>
          {/* top+bottom insets give the wrapper a definite height (its live
              share of the split), so the handle never jumps position */}
          <div
            className="drawer-out absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden"
            style={{ top: `${flex}%` }}
          >
            <div className="h-1.5 w-full shrink-0 bg-border" />
            <div className="min-h-0 flex-1 overflow-hidden">
              <TorrentDetailPanel
                hash={hash}
                onClose={onClose}
                onCollapse={() => setCollapsed(true)}
              />
            </div>
          </div>
        </div>
      ) : collapsed ? (
        /* Collapsed: a single bottom bar (click to expand the panel) */
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1">{table}</div>
          <button
            type="button"
            className="group flex h-6 w-full shrink-0 cursor-pointer items-center justify-center gap-2 border-t bg-card text-xs font-normal text-muted-foreground transition-colors hover:bg-accent"
            onClick={() => setCollapsed(false)}
          >
            <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
            {t("Show detail panel")}
          </button>
        </div>
      ) : (
        /* Expanded: vertical split + custom drag handle */
        <div ref={splitRef} className="flex h-full flex-col">
          <div className="min-h-[120px]" style={{ flex: `${flex} 1 0%` }}>
            {table}
          </div>
          {/* handle + panel animate as ONE block: the wrapper carries the
              keyframe, so translateY(100%) is the drawer's own height and
              the handle travels with the panel */}
          <div
            className="drawer-in flex min-h-[160px] flex-col"
            style={{ flex: `${100 - flex} 1 0%` }}
          >
            <div
              className="group relative z-10 flex h-1.5 w-full shrink-0 cursor-row-resize items-center justify-center bg-border transition-colors hover:bg-primary/50"
              title={t("Resize panel")}
              onMouseDown={startDrag}
              onDoubleClick={() => setCollapsed(true)}
            >
              <div className="absolute inset-x-0 -top-1.5 -bottom-1.5" />
              {/* Collapse arrow (visible on hover) */}
              <ChevronDown className="absolute size-3 opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
            <div className="min-h-0 flex-1">
              <TorrentDetailPanel
                hash={hash}
                onClose={onClose}
                onCollapse={() => setCollapsed(true)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
