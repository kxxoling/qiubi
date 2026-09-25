/**
 * Add torrent dialog (full qBT parameter set).
 *
 * Basic section: links (mixed paste) + files (multi-select & drop) +
 * category/path/tags. Advanced section (collapsible): rename / speed limits /
 * ratio / seeding time / cookie / sequential download / first-last priority /
 * skip check / auto management / root folder / paused.
 *
 * Selective download submit flow: add paused → set filePrio → resume.
 */
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { registerAddTorrentOpener } from "@/hooks/useGlobalHotkeys";
import { AdvancedFields } from "./AdvancedFields";
import { BasicFields } from "./BasicFields";
import { type AddTorrentForm, DEFAULTS, normalizeLink } from "./form";
import { useTorrentParse } from "./useTorrentParse";

/** Programmatic opener payload: prefilled links and/or a header slot */
export type AddTorrentDialogInit = {
  urls?: string;
  /** Rendered above the basic fields (e.g. RSS article context) */
  header?: React.ReactNode;
};

let setOpenExternal: ((init?: AddTorrentDialogInit) => void) | null = null;
export function openAddTorrentDialog(init?: AddTorrentDialogInit) {
  setOpenExternal?.(init);
}

export function AddTorrentDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [f, setF] = useState<AddTorrentForm>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  /** Per-torrent set of deselected file indexes (fileIdx Set) */
  const [skippedFiles, setSkippedFiles] = useState<Map<string, Set<number>>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parsedTorrents, parseFiles, resetParsedTorrents } = useTorrentParse();

  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);

  useEffect(() => {
    setOpenExternal = (init) => {
      if (init?.urls) setF((prev) => ({ ...prev, urls: init.urls as string }));
      setHeaderSlot(init?.header ?? null);
      setOpen(true);
    };
    registerAddTorrentOpener(() => setOpen(true));
    return () => {
      setOpenExternal = null;
      registerAddTorrentOpener(null);
    };
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => qbtClient.getCategories(),
    enabled: open,
  });
  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => qbtClient.getTorrentTags(),
    enabled: open,
  });
  const { data: prefs } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => qbtClient.getPreferences(),
    enabled: open,
  });

  const set = <K extends keyof AddTorrentForm>(key: K, value: AddTorrentForm[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const linkList = f.urls
        .split("\n")
        .map(normalizeLink)
        .filter((x): x is string => !!x);
      const common = {
        category: f.category || undefined,
        savepath: f.savePath || undefined,
        tags: f.tags || undefined,
        rename: f.rename || undefined,
        cookie: f.cookie || undefined,
        dlLimit: f.dlLimit ? Number(f.dlLimit) * 1024 : undefined,
        upLimit: f.upLimit ? Number(f.upLimit) * 1024 : undefined,
        ratioLimit: f.ratioLimit ? Number(f.ratioLimit) : undefined,
        seedingTimeLimit: f.seedingTimeLimit ? Number(f.seedingTimeLimit) : undefined,
        paused: f.paused,
        rootFolder: f.rootFolder,
        skipChecking: f.skipChecking,
        sequentialDownload: f.sequential,
        firstLastPiecePrio: f.firstLast,
        autoTMM: f.autoTMM,
      };
      if (linkList.length > 0) {
        await qbtClient.addTorrent({ urls: linkList.join("\n"), ...common });
      }
      if (f.files.length > 0) {
        // Check whether any files need to be skipped
        const hasSkipped = f.files.some((file) => {
          const skip = skippedFiles.get(file.name);
          return skip && skip.size > 0;
        });

        if (hasSkipped) {
          // Selective download: add paused → set file priorities → resume
          // qBT API: filePrio(hash, ids[], priority) — priority=0 means skip
          for (const file of f.files) {
            const skip = skippedFiles.get(file.name);
            const parsed = parsedTorrents.get(file.name);
            if (!skip || !parsed || skip.size === 0) continue;

            // Add (paused)
            await qbtClient.addTorrent({ torrentFiles: [file], ...common, paused: true });

            // Find the just-added torrent's hash (by save path or most recent)
            const torrents = await qbtClient.getTorrentsInfo();
            // Simplification: pick the most recently added one matching savepath
            const target =
              torrents.find(
                (tr) =>
                  tr.name === parsed.name || (common.savepath && tr.save_path === common.savepath),
              ) ?? torrents[torrents.length - 1];
            if (!target) continue;

            // Set skipped files to priority=0
            const skipIds = [...skip];
            await qbtClient.setFilePriority(target.hash, skipIds, 0);

            // Resume (unless the user checked Pause)
            if (!f.paused) {
              await qbtClient.resumeTorrents([target.hash]);
            }
          }
        } else {
          // Download everything: plain add
          await qbtClient.addTorrent({ torrentFiles: f.files, ...common });
        }
      }
      toast.success(t("Added successfully"));
      setOpen(false);
      setF(DEFAULTS);
      resetParsedTorrents();
      setSkippedFiles(new Map());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.includes("409") ? t("Torrent already exists") : msg);
    } finally {
      setLoading(false);
    }
  };

  const addFiles = async (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((file) =>
      file.name.toLowerCase().endsWith(".torrent"),
    );
    if (valid.length === 0) {
      toast.error(t("Only .torrent files are supported"));
      return;
    }
    // Parse each .torrent's file list asynchronously (does not block the picker)
    parseFiles(valid);
    setF((prev) => ({ ...prev, files: [...prev.files, ...valid] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-0 sm:max-w-md">
        <DialogHeader className="border-b px-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4 text-primary" />
            {t("Add Torrent")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-0 overflow-y-auto px-5 py-4">
          {/* Callers can inject context above the fields (e.g. RSS article) */}
          {headerSlot}
          <BasicFields
            form={f}
            set={set}
            categories={categories}
            tagsPlaceholder={allTags?.slice(0, 3).join(", ") || "tag1, tag2"}
            savePathPlaceholder={(prefs?.save_path as string) || "/downloads"}
            dragOver={dragOver}
            setDragOver={setDragOver}
            onAddFiles={addFiles}
            fileInputRef={fileInputRef}
            parsedTorrents={parsedTorrents}
            skippedFiles={skippedFiles}
            setSkippedFiles={setSkippedFiles}
          />
          <AdvancedFields
            form={f}
            set={set}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />
        </div>

        {/* ── Footer buttons ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/50 px-5 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (f.urls.trim() === "" && f.files.length === 0)}
          >
            {loading ? t("Connecting...") : t("Download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
