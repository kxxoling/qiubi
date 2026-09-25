/**
 * "@" local torrent search mode: filtering helper + result rendering for
 * the command palette (searches the currently connected client's torrents).
 */
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { torrentStateLabel } from "@/lib/utils.format";
import type { TorrentInfo } from "@/types/qbt";

/** Filter local torrents by the current query (empty query matches everything) */
export function filterLocalTorrents(torrents: TorrentInfo[], query: string): TorrentInfo[] {
  return torrents.filter((tr) => !query || tr.name.toLowerCase().includes(query.toLowerCase()));
}

type LocalTorrentsSectionProps = {
  torrents: TorrentInfo[];
  query: string;
  /** Opens the torrent detail panel and closes the palette */
  onOpenTorrent: (hash: string) => void;
};

/** Result section for the "@" mode. */
export function LocalTorrentsSection({
  torrents,
  query,
  onOpenTorrent,
}: LocalTorrentsSectionProps) {
  const { t } = useTranslation();

  return (
    <CommandGroup heading={t("Local torrents")}>
      {filterLocalTorrents(torrents, query)
        .slice(0, 12)
        .map((tr) => (
          <CommandItem
            key={tr.hash}
            value={`local ${tr.name}`}
            onSelect={() => onOpenTorrent(tr.hash)}
          >
            <Download />
            <span className="min-w-0 flex-1 truncate">{tr.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {torrentStateLabel(tr.state)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(tr.progress * 100)}%
            </span>
          </CommandItem>
        ))}
    </CommandGroup>
  );
}
