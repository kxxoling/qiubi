/**
 * Torrent detail panel (same as the qBT bottom properties panel)
 *
 * Tabs: General (property grid) / Content (file tree + priority) / Trackers /
 * HTTP Sources / Peers.
 * Used in two places:
 * - the collapsible panel at the bottom of the torrent list page (expand by clicking a row)
 * - the /torrents/$hash detail page
 */
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FolderOpen, Globe, Info, Radio, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { FileTree } from "@/components/torrent/FileTree";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pollWithBackoff, useTorrentList } from "@/hooks/useMainDataSync";
import { GeneralTab } from "./GeneralTab";
import { PeersTab } from "./PeersTab";
import { HttpSourcesTab, TrackersTab } from "./TrackersTab";

export function TorrentDetailPanel({
  hash,
  onClose,
  onCollapse,
}: {
  hash: string | null;
  onClose?: () => void;
  onCollapse?: () => void;
}) {
  const { t } = useTranslation();

  // Basic info (speed/progress/ratio) comes from the shared maindata polling
  const { torrents } = useTorrentList();
  const info = torrents?.find((tr) => tr.hash === hash);

  const { data: props } = useQuery({
    queryKey: ["torrent-properties", hash],
    queryFn: () => qbtClient.getTorrentProperties(hash ?? ""),
    enabled: !!hash,
    refetchInterval: pollWithBackoff(5000),
  });

  const { data: files } = useQuery({
    queryKey: ["torrent-files", hash],
    queryFn: () => qbtClient.getTorrentFiles(hash ?? ""),
    enabled: !!hash,
  });

  const { data: trackers } = useQuery({
    queryKey: ["torrent-trackers", hash],
    queryFn: () => qbtClient.getTorrentTrackers(hash ?? ""),
    enabled: !!hash,
  });

  const { data: peers } = useQuery({
    queryKey: ["torrent-peers", hash],
    queryFn: () => qbtClient.getSyncTorrentPeers(hash ?? "").then((d) => Object.values(d.peers)),
    enabled: !!hash,
    refetchInterval: pollWithBackoff(1000),
  });

  const httpTrackers = trackers?.filter((tr) => tr.url.startsWith("http")) ?? [];

  return (
    <div
      data-slot="detail-panel-root"
      className="flex h-full min-h-[160px] flex-col overflow-hidden bg-card"
    >
      {/* Header: torrent name + close */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{info?.name ?? hash}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          {onCollapse && (
            <Button variant="ghost" size="icon-sm" aria-label={t("Collapse")} onClick={onCollapse}>
              <ChevronDown className="size-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon-sm" aria-label={t("Close")} onClick={onClose}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b px-3 pt-2">
          <TabsList>
            <TabsTrigger value="general">
              <Info />
              {t("General")}
            </TabsTrigger>
            <TabsTrigger value="content">
              <FolderOpen />
              {t("Content")} ({files?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="trackers">
              <Radio />
              {t("Trackers")} ({httpTrackers.length})
            </TabsTrigger>
            <TabsTrigger value="http-sources">
              <Globe />
              {t("HTTP Sources")}
            </TabsTrigger>
            <TabsTrigger value="peers">
              <Users />
              {t("Peers")} ({peers?.length ?? 0})
            </TabsTrigger>
          </TabsList>
        </div>

        <GeneralTab info={info} properties={props} />

        {/* Content: file tree */}
        <TabsContent value="content" className="min-h-0 flex-1 overflow-y-auto p-2">
          {files ? <FileTree hash={hash ?? ""} files={files} /> : null}
        </TabsContent>

        <TrackersTab hash={hash} httpTrackers={httpTrackers} />

        <HttpSourcesTab trackers={trackers} />

        <PeersTab peers={peers} />
      </Tabs>
    </div>
  );
}
