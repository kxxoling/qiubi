import { useVirtualizer } from "@tanstack/react-virtual";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { LogEntry, PeerLogEntry } from "@/types/qbt";
import { formatTime, getLevelLabel, levelConfig } from "./utils";

interface LogListProps {
  activeList: LogEntry[] | PeerLogEntry[];
  activeTotal: number;
  isLoading: boolean;
  onToggleAutoRefresh: Dispatch<SetStateAction<boolean>>;
}

/** Virtualized log rows (only the visible window is mounted) + keyboard navigation */
export function LogList({ activeList, activeTotal, isLoading, onToggleAutoRefresh }: LogListProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Virtual list: render only the visible window + overscan, row heights measured dynamically
  const virtualizer = useVirtualizer({
    count: activeList.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  // Keyboard: f toggles auto refresh
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "f") {
        e.preventDefault();
        onToggleAutoRefresh((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleAutoRefresh]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto rounded-md border">
      {isLoading && activeTotal === 0 ? (
        <div className="p-8 text-center text-muted-foreground">{t("Connecting...")}</div>
      ) : activeList.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">{t("No results found")}</div>
      ) : (
        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const entry = activeList[vRow.index];
            const isPeer = "ip" in entry;
            const level = isPeer ? null : getLevelLabel((entry as LogEntry).type);
            const cfg = level ? levelConfig[level] : null;
            return (
              <div
                key={entry.id}
                ref={virtualizer.measureElement}
                data-index={vRow.index}
                className={`absolute right-0 left-0 flex items-start gap-3 px-4 py-2 text-sm transition-colors ${
                  vRow.index % 2 === 0 ? "" : "bg-muted/30"
                } hover:bg-accent/50`}
                style={{ transform: `translateY(${vRow.start}px)` }}
              >
                <span className="w-28 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
                  {formatTime(entry.timestamp)}
                </span>
                {isPeer ? (
                  <>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-0 bg-red-100 px-1.5 py-0 text-[10px] text-red-800 dark:bg-red-900 dark:text-red-200"
                    >
                      {t("Banned")}
                    </Badge>
                    <span className="shrink-0 font-mono text-xs">{(entry as PeerLogEntry).ip}</span>
                    <span className="break-all text-xs text-muted-foreground">
                      {(entry as PeerLogEntry).reason}
                    </span>
                  </>
                ) : (
                  <>
                    <Badge
                      variant="outline"
                      className={`shrink-0 border-0 px-1.5 py-0 text-[10px] ${cfg?.color}`}
                    >
                      {level?.toUpperCase()}
                    </Badge>
                    <span className="break-all font-mono text-xs">
                      {(entry as LogEntry).message}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
