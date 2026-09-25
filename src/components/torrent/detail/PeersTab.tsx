import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import { formatSpeed } from "@/lib/utils.format";
import type { TorrentPeer } from "@/types/qbt";

interface PeersTabProps {
  peers: TorrentPeer[] | undefined;
}

/** Peers tab: connected peer list */
export function PeersTab({ peers }: PeersTabProps) {
  const { t } = useTranslation();

  return (
    <TabsContent value="peers" className="min-h-0 flex-1 overflow-y-auto p-2">
      <div className="rounded-md border">
        <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.6fr] gap-2 border-b p-1.5 text-xs font-medium text-muted-foreground">
          <span>IP</span>
          <span>{t("Client")}</span>
          <span>{t("Download Speed")}</span>
          <span>{t("Upload Speed")}</span>
          <span>{t("Progress")}</span>
        </div>
        {peers?.map((p) => (
          <div
            key={`${p.ip}:${p.port}-${p.client}`}
            className="grid grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.6fr] gap-2 border-b p-1.5 text-xs last:border-0"
          >
            <span className="truncate font-mono">
              {p.ip}:{p.port}
            </span>
            <span className="truncate">{p.client}</span>
            <span className="tabular-nums">{p.dl_speed > 0 ? formatSpeed(p.dl_speed) : "-"}</span>
            <span className="tabular-nums">{p.up_speed > 0 ? formatSpeed(p.up_speed) : "-"}</span>
            <span className="tabular-nums">{(p.progress * 100).toFixed(0)}%</span>
          </div>
        ))}
        {(!peers || peers.length === 0) && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t("No results found")}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
