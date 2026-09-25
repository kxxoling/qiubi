import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import type { LogLevel } from "./utils";

interface LogFilterBarProps {
  source: "main" | "peers";
  filterLevel: LogLevel | "all";
  searchInput: string;
  activeCount: number;
  activeTotal: number;
  onSelectLevel: (level: LogLevel | "all") => void;
  onSearchChange: (value: string) => void;
}

/** Level tabs (underline style, execution log only) + keyword filter input + entry count */
export function LogFilterBar({
  source,
  filterLevel,
  searchInput,
  activeCount,
  activeTotal,
  onSelectLevel,
  onSearchChange,
}: LogFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {source === "main" && (
        <div className="flex items-center gap-0 border-b">
          {(["all", "normal", "info", "warning", "critical"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              className={`relative flex items-center gap-1.5 px-2.5 pb-1.5 text-xs font-medium transition-colors ${
                filterLevel === level
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {level !== "all" && (
                <span
                  className={`inline-block size-2 rounded-full ${
                    level === "normal"
                      ? "bg-muted-foreground/50"
                      : level === "info"
                        ? "bg-blue-500"
                        : level === "warning"
                          ? "bg-amber-500"
                          : "bg-red-500"
                  }`}
                />
              )}
              {t(level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1))}
            </button>
          ))}
        </div>
      )}
      <div className="relative ml-auto">
        <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`${t("Filter")}...`}
          className="h-8 w-56 pl-7"
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {activeCount} / {activeTotal} {t("entries")}
      </span>
    </div>
  );
}
