/**
 * Per-torrent file checkbox list (shown when exactly one .torrent file is
 * picked and parsed successfully) — drives the selective download flow.
 */
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import type { ParsedTorrent } from "@/lib/torrentParse";
import { formatBytes } from "@/lib/utils.format";

type SelectiveFilesProps = {
  /** Picked .torrent file name (map key for skipped-file state) */
  torrentName: string;
  parsed: ParsedTorrent;
  skippedFiles: Map<string, Set<number>>;
  setSkippedFiles: React.Dispatch<React.SetStateAction<Map<string, Set<number>>>>;
};

export function SelectiveFiles({
  torrentName,
  parsed,
  skippedFiles,
  setSkippedFiles,
}: SelectiveFilesProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("Select files to download")} ({parsed.files.length})
        </span>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => {
            const current = skippedFiles.get(torrentName);
            const allSkipped = current?.size === parsed.files.length;
            if (allSkipped) {
              setSkippedFiles((prev) => new Map(prev).set(torrentName, new Set()));
            } else {
              setSkippedFiles((prev) =>
                new Map(prev).set(torrentName, new Set(parsed.files.map((_, i) => i))),
              );
            }
          }}
        >
          {t("Toggle all")}
        </button>
      </div>
      <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border p-1.5">
        {parsed.files.map((pf, idx) => {
          const skip = skippedFiles.get(torrentName);
          const isSkipped = skip?.has(idx) ?? false;
          return (
            <div
              key={pf.path}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-xs hover:bg-accent/50"
            >
              <Checkbox
                checked={!isSkipped}
                onCheckedChange={(v) => {
                  setSkippedFiles((prev) => {
                    const cur = new Set(prev.get(torrentName) ?? []);
                    if (v) {
                      cur.delete(idx);
                    } else {
                      cur.add(idx);
                    }
                    return new Map(prev).set(torrentName, cur);
                  });
                }}
              />
              <span
                className={`min-w-0 flex-1 truncate ${isSkipped ? "text-muted-foreground line-through" : ""}`}
              >
                {pf.path}
              </span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(pf.size)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
