/**
 * Bottom dynamic status bar of the command palette: prefix legend + per-mode
 * status (mode hint / result count / engine count).
 */
import { useTranslation } from "react-i18next";
import { Kbd } from "@/components/ui/kbd";
import type { TorrentInfo } from "@/types/qbt";
import { filterLocalTorrents } from "./localTorrents";
import type { PaletteMode } from "./searchMode";

type PaletteFooterProps = {
  mode: PaletteMode;
  query: string;
  torrents: TorrentInfo[];
};

export function PaletteFooter({ mode, query, torrents }: PaletteFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Kbd>/</Kbd>
        {t("Commands")}
        <Kbd>@</Kbd>
        {t("Torrents")}
        <Kbd>&gt;</Kbd>
        {t("Navigation")}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {mode === "command" && <span>{t("Run a quick action")}</span>}
        {mode === "nav" && <span>{t("Jump to a page")}</span>}
        {mode === "local" && (
          <span>
            {filterLocalTorrents(torrents, query).length} {t("entries")}
          </span>
        )}
      </span>
    </div>
  );
}
