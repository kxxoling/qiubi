/**
 * Recent search chips under the search bar.
 *
 * Click a chip to re-run that search; X removes one entry; Clear wipes all.
 * Pure client-side state (localStorage) — see useSearchHistory.
 */
import { History, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function SearchHistory({
  entries,
  onSelect,
  onRemove,
  onClear,
}: {
  entries: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <History className="size-3.5" />
        {t("Recent searches")}
      </span>
      {entries.map((term) => (
        <span
          key={term}
          className="group inline-flex max-w-full items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 py-0.5 pr-0.5 pl-2.5 text-xs transition-colors hover:border-foreground/20 hover:bg-muted"
        >
          <button
            type="button"
            className="max-w-40 truncate text-muted-foreground transition-colors group-hover:text-foreground sm:max-w-64"
            title={term}
            onClick={() => onSelect(term)}
          >
            {term}
          </button>
          <button
            type="button"
            className="grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
            aria-label={t("Delete")}
            title={t("Delete")}
            onClick={() => onRemove(term)}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 rounded-full px-2 text-xs text-muted-foreground"
        aria-label={t("Clear search history")}
        onClick={onClear}
      >
        {t("Clear")}
      </Button>
    </div>
  );
}
