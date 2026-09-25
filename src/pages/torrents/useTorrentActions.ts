/**
 * Torrent action dispatchers: toast-wrapped single/scoped/batch actions and
 * the context-menu action switch.
 *
 * Scoped actions: with a selection → act on selected rows; without → act on
 * every torrent matching the current filters.
 */
import type { Row, Table } from "@tanstack/react-table";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import type { CtxAction } from "@/components/torrent/TorrentContextMenu";
import type {
  DeleteDialogState,
  LimitDialogState,
  RenameDialogState,
} from "@/components/torrent/TorrentDialogs";
import type { TorrentInfo } from "@/types/qbt";

export function useTorrentActions({
  table,
  rows,
  selectedHashes,
  filteredHashes,
  setDeleteDialog,
  setRenameDialog,
  setLimitDialog,
}: {
  table: Table<TorrentInfo>;
  rows: Row<TorrentInfo>[];
  selectedHashes: string[];
  filteredHashes: string[];
  setDeleteDialog: (s: DeleteDialogState) => void;
  setRenameDialog: (s: RenameDialogState) => void;
  setLimitDialog: (s: LimitDialogState) => void;
}) {
  const { t } = useTranslation();

  const doAction = useCallback(async (fn: () => Promise<void>, label: string) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, []);

  /** Pause/resume scope: selection takes priority, otherwise all filtered torrents */
  const scopedAction = useCallback(
    async (fn: (hashes: string[]) => Promise<void>, label: string) => {
      const hashes = selectedHashes.length ? selectedHashes : filteredHashes;
      if (hashes.length === 0) return;
      await doAction(() => fn(hashes), label);
      table.toggleAllPageRowsSelected(false);
    },
    [selectedHashes, filteredHashes, table, doAction],
  );

  const batchAction = useCallback(
    async (fn: (hashes: string[]) => Promise<void>, label: string) => {
      await doAction(() => fn(selectedHashes), label);
      table.toggleAllPageRowsSelected(false);
    },
    [selectedHashes, table, doAction],
  );

  /** Context-menu action dispatch */
  const handleCtxAction = useCallback(
    (action: CtxAction, hashes: string[], row?: TorrentInfo) => {
      switch (action) {
        case "pause":
          doAction(() => qbtClient.pauseTorrents(hashes), t("Pause"));
          break;
        case "resume":
          doAction(() => qbtClient.resumeTorrents(hashes), t("Resume"));
          break;
        case "forceStart":
          doAction(() => qbtClient.setForceStart(hashes, true), t("Force Start"));
          break;
        case "recheck":
          batchAction((h) => qbtClient.recheckTorrents(h), t("Recheck"));
          break;
        case "reannounce":
          doAction(() => qbtClient.reannounceTorrents(hashes), t("Reannounce"));
          break;
        case "delete":
          setDeleteDialog({ hashes, open: true });
          break;
        case "copyMagnet": {
          const magnets = hashes
            .map((h) => rows.find((r) => r.original.hash === h)?.original.magnet_uri)
            .filter(Boolean) as string[];
          if (magnets.length > 0) {
            navigator.clipboard.writeText(magnets.join("\n")).then(
              () => toast.success(t("Copied")),
              () => toast.error(t("Copy failed")),
            );
          }
          break;
        }
        case "copyHash":
          navigator.clipboard.writeText(hashes.join("\n")).then(
            () => toast.success(t("Copied")),
            () => toast.error(t("Copy failed")),
          );
          break;
        case "sequential":
          doAction(() => qbtClient.toggleSequentialDownload(hashes), t("Sequential Download"));
          break;
        case "firstLast":
          doAction(() => qbtClient.toggleFirstLastPiecePrio(hashes), t("First/Last Priority"));
          break;
        case "topPrio":
          batchAction((h) => qbtClient.topPriority(h), t("Top Priority"));
          break;
        case "upPrio":
          batchAction((h) => qbtClient.increasePriority(h), t("Priority Up"));
          break;
        case "downPrio":
          batchAction((h) => qbtClient.decreasePriority(h), t("Priority Down"));
          break;
        case "bottomPrio":
          batchAction((h) => qbtClient.bottomPriority(h), t("Bottom Priority"));
          break;
        case "rename":
          if (row) setRenameDialog({ hash: row.hash, name: row.name, open: true });
          break;
        case "setDlLimit":
          setLimitDialog({ hashes, type: "dl", value: "", open: true });
          break;
        case "setUpLimit":
          setLimitDialog({ hashes, type: "up", value: "", open: true });
          break;
      }
    },
    [doAction, batchAction, rows, t, setRenameDialog, setLimitDialog, setDeleteDialog],
  );

  return { doAction, scopedAction, batchAction, handleCtxAction };
}
