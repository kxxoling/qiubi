/**
 * Three action dialogs for the torrent list: delete confirmation / rename / speed limit.
 */

import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type DeleteDialogState = { hashes: string[]; open: boolean };
export type RenameDialogState = { hash: string; name: string; open: boolean };
export type LimitDialogState = {
  hashes: string[];
  type: "dl" | "up";
  value: string;
  open: boolean;
};

type Ctx = {
  deleteDialog: DeleteDialogState;
  setDeleteDialog: (s: DeleteDialogState) => void;
  renameDialog: RenameDialogState;
  setRenameDialog: (s: RenameDialogState) => void;
  limitDialog: LimitDialogState;
  setLimitDialog: (s: LimitDialogState) => void;
  onDone: () => void; // Clear the selection after the action completes
};

export function TorrentDialogs({
  deleteDialog,
  setDeleteDialog,
  renameDialog,
  setRenameDialog,
  limitDialog,
  setLimitDialog,
  onDone,
}: Ctx) {
  const { t } = useTranslation();
  const doAction = async (fn: () => Promise<void>, label: string) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const submitLimit = async () => {
    const limit = Number(limitDialog.value);
    await doAction(
      () =>
        limitDialog.type === "dl"
          ? qbtClient.setTorrentDownloadLimit(limitDialog.hashes, limit)
          : qbtClient.setTorrentUploadLimit(limitDialog.hashes, limit),
      t("Limit set"),
    );
    setLimitDialog({ hashes: [], type: "dl", value: "", open: false });
  };

  const submitRename = async () => {
    await doAction(
      () => qbtClient.setTorrentName(renameDialog.hash, renameDialog.name),
      t("Renamed"),
    );
    setRenameDialog({ hash: "", name: "", open: false });
  };

  return (
    <>
      {/* Delete confirmation */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Delete confirm", { count: deleteDialog.hashes.length })}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ hashes: [], open: false })}>
              {t("Cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await doAction(
                  () => qbtClient.deleteTorrents(deleteDialog.hashes, false),
                  t("Deleted"),
                );
                setDeleteDialog({ hashes: [], open: false });
                onDone();
              }}
            >
              {t("Delete")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await doAction(
                  () => qbtClient.deleteTorrents(deleteDialog.hashes, true),
                  t("Deleted with files"),
                );
                setDeleteDialog({ hashes: [], open: false });
                onDone();
              }}
            >
              {t("Delete with files")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Rename")}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDialog.name}
            onChange={(e) => setRenameDialog({ ...renameDialog, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRenameDialog({ hash: "", name: "", open: false })}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={submitRename}>{t("Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Speed limit */}
      <Dialog
        open={limitDialog.open}
        onOpenChange={(open) => setLimitDialog({ ...limitDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {limitDialog.type === "dl" ? t("Set Download Limit") : t("Set Upload Limit")} (KiB/s)
            </DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            value={limitDialog.value}
            onChange={(e) => setLimitDialog({ ...limitDialog, value: e.target.value })}
            placeholder="0 = unlimited"
            onKeyDown={(e) => e.key === "Enter" && submitLimit()}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setLimitDialog({ hashes: [], type: "dl", value: "", open: false })}
            >
              {t("Cancel")}
            </Button>
            <Button onClick={submitLimit}>{t("Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
