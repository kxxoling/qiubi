/**
 * Mobile torrent card list (replaces the 8-column table below 768px)
 *
 * Card: name + tinted status pill + progress bar + speeds/size;
 * the ⋮ button opens a compact action menu (pause/resume/delete/details).
 *
 * Selection model (standard mobile list pattern):
 * - Empty selection: tap opens the details route; LONG-PRESS (450ms)
 *   selects and enters selection mode
 * - Selection mode (≥1 selected): plain TAP toggles selection on any card
 *   (deselect is just a tap — details navigation is suspended so the
 *   context never jumps mid-selection)
 */

import type { Row } from "@tanstack/react-table";
import { Check, Magnet, MoreVertical, Pause, Play, Trash2 } from "lucide-react";
import type * as React from "react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statePill } from "@/lib/torrentStatus";
import { cn } from "@/lib/utils";
import { formatBytes, formatSpeed, torrentStateLabel } from "@/lib/utils.format";
import type { TorrentInfo } from "@/types/qbt";

/** Long-press threshold (ms); movement beyond this many px cancels (scroll) */
const HOLD_MS = 450;
const MOVE_CANCEL_PX = 10;

/**
 * Press gestures for the card body:
 * - tap: selection mode → toggle selection; otherwise open details
 * - held for HOLD_MS without significant movement → toggle selection
 *   (the trailing click is suppressed so nothing else fires)
 */
function useCardPress(
  hash: string,
  selectionActive: boolean,
  onToggle: (hash: string) => void,
  onOpen: (hash: string) => void,
) {
  const timerRef = useRef<number>(0);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    window.clearTimeout(timerRef.current);
    originRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      firedRef.current = false;
      originRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = window.setTimeout(() => {
        firedRef.current = true;
        // Haptic feedback where available (no-op on desktop)
        navigator.vibrate?.(15);
        onToggle(hash);
      }, HOLD_MS);
    },
    [hash, onToggle],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const origin = originRef.current;
      if (!origin) return;
      // Scrolling cancels the press — selection must not fight scroll
      if (Math.abs(e.clientX - origin.x) + Math.abs(e.clientY - origin.y) > MOVE_CANCEL_PX) clear();
    },
    [clear],
  );

  const onPointerUp = useCallback(() => clear(), [clear]);

  const onClick = useCallback(() => {
    if (firedRef.current) {
      firedRef.current = false; // long-press already handled this gesture
      return;
    }
    // Selection mode: tap toggles; normal mode: tap opens details
    if (selectionActive) onToggle(hash);
    else onOpen(hash);
  }, [hash, selectionActive, onToggle, onOpen]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClick,
    // Long-press opens the text-selection context menu on mobile — block it
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

function TorrentCard({
  row,
  selected,
  selectionActive,
  holding,
  onHoldStart,
  onHoldEnd,
  onToggle,
  onOpen,
  onDelete,
}: {
  row: Row<TorrentInfo>;
  selected: boolean;
  selectionActive: boolean;
  holding: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onToggle: (hash: string) => void;
  onOpen: (hash: string) => void;
  onDelete: (hashes: string[]) => void;
}) {
  const { t } = useTranslation();
  const tr = row.original;
  const press = useCardPress(tr.hash, selectionActive, onToggle, onOpen);

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-3 transition-colors select-none",
        selected ? "border-primary bg-primary/10 shadow-sm" : holding && "border-primary/60",
      )}
    >
      {/* Selected: the whole card content (title + progress) shifts right
          instead of reserving a permanent slot — no empty gap when
          unselected, and the shift itself doubles as selection feedback */}
      <div className={cn("transition-[padding] duration-150", selected && "pl-7")}>
        {selected && (
          <span className="absolute top-1/2 left-2 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
        <div className="flex items-start gap-2">
          <button
            type="button"
            className={cn(
              "min-w-0 flex-1 touch-manipulation text-left transition-transform",
              holding && "scale-[0.99]",
            )}
            {...press}
            onPointerDown={(e) => {
              onHoldStart();
              press.onPointerDown(e);
            }}
            onPointerUp={() => {
              onHoldEnd();
              press.onPointerUp();
            }}
            onPointerCancel={() => {
              onHoldEnd();
              press.onPointerCancel();
            }}
          >
            <div className="truncate text-sm font-medium">{tr.name}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge className={cn("text-[10px]", statePill(tr.state))}>
                {torrentStateLabel(tr.state)}
              </Badge>
              <span>{formatBytes(tr.size)}</span>
              {tr.dlspeed > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  ↓{formatSpeed(tr.dlspeed)}
                </span>
              )}
              {tr.upspeed > 0 && (
                <span className="text-blue-600 dark:text-blue-400">↑{formatSpeed(tr.upspeed)}</span>
              )}
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={t("Actions")}
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => qbtClient.pauseTorrents([tr.hash]).catch(() => {})}>
                <Pause />
                {t("Pause")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => qbtClient.resumeTorrents([tr.hash]).catch(() => {})}>
                <Play />
                {t("Resume")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpen(tr.hash)}>
                <Magnet />
                {t("Details")}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete([tr.hash])}>
                <Trash2 />
                {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full w-(--p) rounded-full bg-primary transition-all"
              style={{ "--p": `${tr.progress * 100}%` } as React.CSSProperties}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {(tr.progress * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TorrentCardList({
  rows,
  selectedHashes,
  onToggle,
  onOpen,
  onDelete,
}: {
  rows: Row<TorrentInfo>[];
  selectedHashes: string[];
  onToggle: (hash: string) => void;
  onOpen: (hash: string) => void;
  onDelete: (hashes: string[]) => void;
}) {
  const { t } = useTranslation();

  // Track which card is being held so it can render a pressing hint
  const [holdingHash, setHoldingHash] = useState<string | null>(null);
  const selectionActive = selectedHashes.length > 0;

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <TorrentCard
          key={row.original.hash}
          row={row}
          selected={selectedHashes.includes(row.original.hash)}
          selectionActive={selectionActive}
          holding={holdingHash === row.original.hash}
          onHoldStart={() => setHoldingHash(row.original.hash)}
          onHoldEnd={() => setHoldingHash(null)}
          onToggle={onToggle}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
      {rows.length === 0 && (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          {t("No results found")}
        </div>
      )}
    </div>
  );
}
