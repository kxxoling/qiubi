/**
 * Bottom status bar —— qBittorrent native layout
 *
 * Left: connection status (●) + DHT nodes (🌐) + free disk space
 * Right: alt-speed toggle (⚡) + speeds (click to open the recent speed chart)
 */
import { ArrowDown, ArrowUp, Globe, HardDrive, Snail } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SpeedChartContent } from "@/components/layout/SpeedChartPopover";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAltSpeed } from "@/hooks/useAltSpeed";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMainDataSync } from "@/hooks/useMainDataSync";
import { cn } from "@/lib/utils";
import { formatBytes, formatSpeed } from "@/lib/utils.format";

export function StatusBar() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [chartOpen, setChartOpen] = useState(false);
  const { data } = useMainDataSync(2000);
  const serverState = data?.serverState;
  const { altSpeed, toggleAltSpeed } = useAltSpeed();

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-card px-3 text-xs text-muted-foreground">
      {/* Connection status */}
      <span
        className={cn(
          "flex items-center gap-1",
          serverState?.connection_status === "connected" && "text-green-600 dark:text-green-400",
        )}
      >
        ● {t(serverState?.connection_status ?? "disconnected")}
      </span>

      {/* DHT node count (qBT's little green globe) */}
      <span className="hidden items-center gap-1 sm:flex" title={t("DHT Nodes")}>
        <Globe className="h-3 w-3 text-green-600 dark:text-green-400" />
        {serverState?.dht_nodes ?? 0}
      </span>

      {/* Free disk space (same as qBT's bottom bar) */}
      <span className="hidden items-center gap-1 md:flex" title={t("Free disk space")}>
        <HardDrive className="h-3 w-3" />
        {serverState?.free_space_on_disk !== undefined && serverState.free_space_on_disk >= 0
          ? formatBytes(serverState.free_space_on_disk)
          : "—"}
      </span>

      <div className="ml-auto flex items-center gap-3">
        {/* Alt speed toggle */}
        <button
          type="button"
          onClick={toggleAltSpeed}
          title={t("Alt Speed")}
          className={cn(
            "flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-accent",
            altSpeed && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          )}
        >
          <Snail className="h-3.5 w-3.5" />
        </button>

        {/* Speeds (click to open the recent speed chart; bottom sheet on mobile) */}
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => setChartOpen(true)}
              title={t("Speed history")}
              className="flex items-center gap-2 rounded px-1 py-0.5 tabular-nums transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {formatSpeed(serverState?.dl_info_speed ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {formatSpeed(serverState?.up_info_speed ?? 0)}
              </span>
            </button>
            <Sheet open={chartOpen} onOpenChange={setChartOpen}>
              <SheetContent side="bottom" className="p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("Speed history")}</SheetTitle>
                </SheetHeader>
                <SpeedChartContent className="w-full" />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  title={t("Speed history")}
                  className="flex items-center gap-2 rounded px-1 py-0.5 tabular-nums transition-colors hover:bg-accent"
                />
              }
            >
              <span className="flex items-center gap-1">
                <ArrowDown className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {formatSpeed(serverState?.dl_info_speed ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {formatSpeed(serverState?.up_info_speed ?? 0)}
              </span>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" sideOffset={6} className="w-auto p-0">
              <SpeedChartContent />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </footer>
  );
}
