import { Loader2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface SearchFormProps {
  pattern: string;
  category: string;
  isRunning: boolean;
  hasActiveSearch: boolean;
  onPatternChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

/** Search bar: category select + pattern input + start/stop/clear controls */
export function SearchForm({
  pattern,
  category,
  isRunning,
  hasActiveSearch,
  onPatternChange,
  onCategoryChange,
  onStart,
  onStop,
  onClear,
}: SearchFormProps) {
  const { t } = useTranslation();

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
