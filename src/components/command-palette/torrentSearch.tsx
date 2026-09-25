/**
 * "#" online torrent search mode: search plugin state, search job lifecycle
 * (start → poll → stop) and result rendering for the command palette.
 */
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download, Search as SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { formatBytes } from "@/lib/utils.format";
import type { SearchPlugin } from "@/types/qbt";
import type { SearchState } from "./searchMode";

/** Search state machine + plugin list for the "#" mode (used by the palette shell). */
export function useOnlineSearch(open: boolean, query: string) {
  const [searchState, setSearchState] = useState<SearchState>({ phase: "idle" });

  // Palette closed → stop any running search job and reset
  const searchRef = useRef(searchState);
  searchRef.current = searchState;
  useEffect(() => {
    if (!open && searchRef.current.phase === "running") {
      qbtClient.stopSearch(searchRef.current.jobId).catch(() => {});
    }
    if (!open && searchRef.current.phase !== "idle") setSearchState({ phase: "idle" });
  }, [open]);
  // Input changed → reset search state (a new query must start over)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — the query is the reset trigger, not a used value
  useEffect(() => {
    setSearchState((s) => (s.phase === "idle" ? s : { phase: "idle" }));
  }, [query]);

  // --- Search plugin state ("#" mode entry) ---
  const { data: plugins } = useQuery({
    queryKey: ["search-plugins"],
    queryFn: () => qbtClient.getSearchPlugins(),
    enabled: open,
    staleTime: 30_000,
  });
  const enabledPlugins: SearchPlugin[] = plugins?.filter((p) => p.enabled) ?? [];

  // --- "#" mode: start a real search job ---
  const runOnlineSearch = useCallback(async () => {
    if (!query) return;
    try {
      const { id } = await qbtClient.startSearch(query, "enabled");
      setSearchState({ phase: "running", jobId: id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [query]);

  // --- "#" mode: poll search results until the job stops or all are fetched ---
  useEffect(() => {
    if (searchState.phase !== "running") return;
    const jobId = searchState.jobId;
    let stopped = false;
    const poll = async () => {
      try {
        const r = await qbtClient.getSearchResults(jobId, 30);
        if (stopped) return;
        // A just-started job has total=0 and empty results — not "done" yet;
        // only finish when the job is Stopped, or results exist and are complete
        if (r.status === "Stopped" || (r.total > 0 && r.results.length >= r.total)) {
          setSearchState({ phase: "done", jobId, results: r.results, total: r.total });
        }
      } catch {
        if (!stopped) setSearchState({ phase: "done", jobId, results: [], total: 0 });
      }
    };
    poll();
    const timer = setInterval(poll, 1000);
    const timeout = setTimeout(() => qbtClient.stopSearch(jobId).catch(() => {}), 10_000);
    return () => {
      stopped = true;
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [searchState]);

  return { searchState, enabledPlugins, runOnlineSearch };
}

type OnlineSearchSectionProps = {
  query: string;
  enabledPlugins: SearchPlugin[];
  searchState: SearchState;
  onNavigate: (to: string) => void;
  onDownload: (url: string) => Promise<void>;
  onRunSearch: () => void;
};

/** Result section for the "#" mode (renders itself only when the mode is active). */
export function OnlineSearchSection({
  query,
  enabledPlugins,
  searchState,
  onNavigate,
  onDownload,
  onRunSearch,
}: OnlineSearchSectionProps) {
  const { t } = useTranslation();

  if (enabledPlugins.length === 0) {
    return (
      <CommandGroup heading={t("Search")}>
        <CommandItem value="no-plugin" onSelect={() => onNavigate("/search")}>
          <SearchIcon />
          <span className="truncate">
            {t("No search plugins enabled — open Search page to configure")}
          </span>
        </CommandItem>
      </CommandGroup>
    );
  }

  if (searchState.phase === "idle") {
    return (
      <CommandGroup heading={t("Search online")}>
        <CommandItem value={`search ${query}`} onSelect={onRunSearch}>
          <SearchIcon />
          <span className="truncate">
            {t("Search online for")} “{query}”
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {enabledPlugins.length} {t("engines")}
          </span>
        </CommandItem>
      </CommandGroup>
    );
  }

  if (searchState.phase === "running") {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
        {t("Searching...")}
      </div>
    );
  }

  return (
    <CommandGroup heading={`${t("Search results")} · ${searchState.total} ${t("entries")}`}>
      <CommandItem
        value="refine"
        onSelect={() => onNavigate(`/search?q=${encodeURIComponent(query)}`)}
      >
        <ArrowRight />
        <span className="text-muted-foreground">{t("Refine in search page")}</span>
      </CommandItem>
      {searchState.results.map((r, i) => (
        <CommandItem
          // biome-ignore lint/suspicious/noArrayIndexKey: fileUrl can repeat across engines; index keeps keys unique
          key={`${r.fileUrl}-${i}`}
          value={`sr ${r.fileName}`}
          onSelect={() => onDownload(r.fileUrl)}
        >
          <Download />
          <span className="min-w-0 flex-1 truncate">{r.fileName}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatBytes(r.fileSize)}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-green-600 dark:text-green-400">
            ↑{r.nbSeeders}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            ↓{r.nbLeechers}
          </span>
        </CommandItem>
      ))}
      {searchState.results.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">{t("No results found")}</div>
      )}
    </CommandGroup>
  );
}

/** Footer status text for the "#" mode (result count / engine count / hint). */
export function OnlineSearchFooterStatus({
  enabledPlugins,
  searchState,
}: {
  enabledPlugins: SearchPlugin[];
  searchState: SearchState;
}) {
  const { t } = useTranslation();

  if (enabledPlugins.length === 0) {
    return <span>{t("No search plugins enabled — open Search page to configure")}</span>;
  }
  if (searchState.phase === "done") {
    return (
      <span>
        {searchState.total} {t("entries")}
      </span>
    );
  }
  return (
    <span>
      {enabledPlugins.length} {t("engines")}
    </span>
  );
}
