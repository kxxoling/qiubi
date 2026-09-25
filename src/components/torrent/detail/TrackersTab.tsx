import { useQueryClient } from "@tanstack/react-query";
import { Globe, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { TorrentTracker } from "@/types/qbt";

interface TrackersTabProps {
  hash: string | null;
  httpTrackers: TorrentTracker[];
}

/** Split pasted tracker text into URL list (one per line; handy for pasting
 *  public tracker lists, which are newline-separated) */
function parseTrackerList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Trackers tab: add (single or batch) / remove HTTP(S) trackers */
export function TrackersTab({ hash, httpTrackers }: TrackersTabProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["torrent-trackers", hash] });

  const add = async () => {
    const urls = parseTrackerList(draft);
    if (!urls.length || !hash) return;
    try {
      // qBT accepts newline-separated URLs in one call
      await qbtClient.addTrackers(hash, urls.join("\n"));
      setDraft("");
      await refresh();
      toast.success(t("Added"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (url: string) => {
    if (!hash) return;
    try {
      await qbtClient.removeTrackers(hash, url);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <TabsContent value="trackers" className="min-h-0 flex-1 overflow-y-auto p-2">
      <div className="flex gap-2 pb-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`${t("Add tracker URL...")}\n${t("(multiple select supported)")}`}
          className="min-h-9 h-16 flex-1 resize-y py-1.5 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void add();
          }}
        />
        <Button size="sm" variant="outline" className="h-8 shrink-0 self-end" onClick={add}>
          <Plus className="size-3.5" />
          {t("Add")}
        </Button>
      </div>
      <div className="space-y-1">
        {httpTrackers.map((tr) => (
          <div key={tr.url} className="flex items-center gap-2 rounded border p-1.5 text-sm">
            <span className="min-w-0 flex-1 truncate text-xs">{tr.url}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              S:{tr.num_seeds} P:{tr.num_peers}
            </span>
            <span className="max-w-32 shrink-0 truncate text-xs text-muted-foreground">
              {tr.msg || "OK"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 shrink-0 px-2 text-xs text-destructive"
              onClick={() => remove(tr.url)}
            >
              {t("Delete")}
            </Button>
          </div>
        ))}
        {httpTrackers.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("No results found")}
          </div>
        )}
      </div>
    </TabsContent>
  );
}

interface HttpSourcesTabProps {
  trackers: TorrentTracker[] | undefined;
}

/** HTTP Sources tab: HTTP/HTTPS-type sources extracted from the trackers list.
 *  Plain text — these are source page URLs for reference, not meant to open */
export function HttpSourcesTab({ trackers }: HttpSourcesTabProps) {
  const { t } = useTranslation();

  const sources =
    trackers?.filter((tr) => tr.url.startsWith("http") && !tr.url.includes("announce")) ?? [];

  return (
    <TabsContent value="http-sources" className="min-h-0 flex-1 overflow-y-auto p-2">
      <div className="rounded-md border">
        {sources.map((tr) => (
          <div key={tr.url} className="flex items-center gap-2 border-b p-2 text-sm last:border-0">
            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{tr.url}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{tr.msg || "OK"}</span>
          </div>
        ))}
        {sources.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("No results found")}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
