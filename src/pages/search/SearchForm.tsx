import { Loader2, Search, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchPlugin } from "@/types/qbt";

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "movies", label: "Movies" },
  { value: "tv", label: "TV shows" },
  { value: "music", label: "Music" },
  { value: "games", label: "Games" },
  { value: "anime", label: "Anime" },
  { value: "software", label: "Software" },
  { value: "books", label: "Books" },
];

// Natural sort for plugin names, mirroring the official WebUI
const pluginCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

interface SearchFormProps {
  pattern: string;
  category: string;
  pluginFilter: string;
  plugins?: SearchPlugin[];
  isRunning: boolean;
  hasActiveSearch: boolean;
  onPatternChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPluginFilterChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

/** Search bar: category + plugin selects, pattern input, start/stop/clear controls */
export function SearchForm({
  pattern,
  category,
  pluginFilter,
  plugins,
  isRunning,
  hasActiveSearch,
  onPatternChange,
  onCategoryChange,
  onPluginFilterChange,
  onStart,
  onStop,
  onClear,
}: SearchFormProps) {
  const { t } = useTranslation();

  // Official WebUI dropdown: enabled plugins only, alphabetically sorted
  const enabledPlugins = useMemo(
    () =>
      (plugins ?? [])
        .filter((p) => p.enabled)
        .sort((a, b) => pluginCollator.compare(a.fullName || a.name, b.fullName || b.name)),
    [plugins],
  );

  const pluginFilterLabel =
    pluginFilter === "enabled"
      ? t("Only enabled")
      : pluginFilter === "all"
        ? t("All plugins")
        : plugins?.find((p) => p.name === pluginFilter)?.fullName || pluginFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={category} onValueChange={(v) => onCategoryChange(v ?? "all")}>
        <SelectTrigger size="sm" className="w-36 shrink-0" aria-label={t("Category")}>
          <SelectValue>
            {t(CATEGORIES.find((c) => c.value === category)?.label ?? "All categories")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {t(c.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={pluginFilter} onValueChange={(v) => onPluginFilterChange(v ?? "enabled")}>
        <SelectTrigger size="sm" className="w-40 shrink-0" aria-label={t("Plugins")}>
          <SelectValue>{pluginFilterLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-48">
          <SelectItem value="enabled">{t("Only enabled")}</SelectItem>
          <SelectItem value="all">{t("All plugins")}</SelectItem>
          {enabledPlugins.length > 0 && <SelectSeparator />}
          {enabledPlugins.map((p) => (
            <SelectItem key={p.name} value={p.name}>
              {p.fullName || p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={pattern}
          onChange={(e) => onPatternChange(e.target.value)}
          placeholder={t("Search torrents...")}
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") onStart();
          }}
        />
      </div>
      {hasActiveSearch ? (
        <div className="flex items-center gap-1">
          {isRunning ? (
            <Button variant="outline" size="sm" onClick={onStop}>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              {t("Stop")}
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t("Completed")}
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button onClick={onStart} disabled={!pattern.trim()}>
          {t("Search")}
        </Button>
      )}
    </div>
  );
}
