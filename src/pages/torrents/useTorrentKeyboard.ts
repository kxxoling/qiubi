/**
 * Torrent list keyboard shortcuts (desktop list navigation)
 *
 * ↑/↓ move focus · Space pause/resume focused (or selection) · Delete remove
 * selection · Ctrl+A select all · Ctrl+R recheck · Ctrl+↑/↓ priority ·
 * Enter open focused torrent (desktop: bottom panel, mobile: full-screen route)
 */
import type { Row, Table } from "@tanstack/react-table";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import type { DeleteDialogState } from "@/components/torrent/TorrentDialogs";
import type { TorrentInfo } from "@/types/qbt";

export function useTorrentKeyboard({
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
}: {
  table: Table<TorrentInfo>;
  rows: Row<TorrentInfo>[];
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedHashes: string[];
  doAction: (fn: () => Promise<void>, label: string) => Promise<void>;
  batchAction: (fn: (hashes: string[]) => Promise<void>, label: string) => Promise<void>;
  setDeleteDialog: (s: DeleteDialogState) => void;
  setDetailHash: (hash: string | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
  isMobile: boolean;
  navigate: (opts: { to: string; params: Record<string, string> }) => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && key === "ArrowUp" && selectedHashes.length > 0) {
        e.preventDefault();
        batchAction((h) => qbtClient.increasePriority(h), t("Priority Up"));
      } else if (ctrl && key === "ArrowDown" && selectedHashes.length > 0) {
        e.preventDefault();
        batchAction((h) => qbtClient.decreasePriority(h), t("Priority Down"));
      } else if (key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, rows.length - 1));
      } else if (key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (key === " " && focusedIndex >= 0) {
        e.preventDefault();
        const row = rows[focusedIndex];
        if (row) {
          const isActive = [
            "downloading",
            "uploading",
            "stalledDL",
            "stalledUP",
            "metaDL",
            "forcedDL",
            "forcedUP",
          ].includes(row.original.state);
          doAction(
            () =>
              isActive
                ? qbtClient.pauseTorrents(
                    selectedHashes.length ? selectedHashes : [row.original.hash],
                  )
                : qbtClient.resumeTorrents(
                    selectedHashes.length ? selectedHashes : [row.original.hash],
                  ),
            isActive ? t("Pause") : t("Resume"),
          );
        }
      } else if (key === "Delete" && selectedHashes.length > 0) {
        e.preventDefault();
        setDeleteDialog({ hashes: selectedHashes, open: true });
      } else if (ctrl && key === "a") {
        e.preventDefault();
        table.toggleAllPageRowsSelected(true);
      } else if (ctrl && (key === "r" || key === "R") && selectedHashes.length > 0) {
        e.preventDefault();
        batchAction((h) => qbtClient.recheckTorrents(h), t("Recheck"));
      } else if (key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const row = rows[focusedIndex];
        if (row && !isMobile) {
          // Desktop Enter = view in bottom panel; mobile cards use the full-screen route
          setDetailHash(row.original.hash);
          setDetailPanelOpen(true);
        } else if (row) {
          navigate({ to: "/torrents/$hash", params: { hash: row.original.hash } });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    rows,
    focusedIndex,
    selectedHashes,
    navigate,
    table,
    t,
    doAction,
    batchAction,
    setDeleteDialog,
    setDetailPanelOpen,
    setDetailHash,
    isMobile,
    setFocusedIndex,
  ]);
}
