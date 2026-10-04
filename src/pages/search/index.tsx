import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { PluginManager } from "@/components/search/PluginManager";
import { SearchHistory } from "@/components/search/SearchHistory";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchStore } from "@/stores/search";
import type { SearchResult } from "@/types/qbt";
import { ResultsTable } from "./ResultsTable";
import { SearchForm } from "./SearchForm";

/**
 * Search page
 *
 * qBT built-in search: start a search → live results → one-click download
 */
export function SearchPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const qc = useQueryClient();
  // Command palette navigation carries ?q= — prefill and auto-search
  const urlSearch = useSearch({ strict: false }) as { q?: string; category?: string };
  // Page state lives in a module-level store: the search job and its results
  // survive navigating away and back (component state reset on every mount)
  const {
    pattern,
    category,
    pluginFilter,
    activeId,
    results: allResults,
    setPattern,
    setCategory,
    setPluginFilter,
    beginSearch,
    appendResults,
    setAutoStartedFor,
  } = useSearchStore();

  const {
    entries: recent,
    add: addRecent,
    remove: removeRecent,
    clear: clearRecent,
  } = useSearchHistory();

  const [pluginDialog, setPluginDialog] = useState(false);

  // Search plugin list
  const { data: plugins } = useQuery({
    queryKey: ["search-plugins"],
    queryFn: () => qbtClient.getSearchPlugins(),
  });

  // Drop a stale selection: plugin got disabled or uninstalled meanwhile
  // (store actions are stable references; listed for the lint rule)
  useEffect(() => {
    if (!plugins || pluginFilter === "enabled" || pluginFilter === "all") return;
    const enabled = plugins.some((p) => p.enabled && p.name === pluginFilter);
    if (!enabled) setPluginFilter("enabled");
  }, [plugins, pluginFilter, setPluginFilter]);

  // Search status polling
  const { data: status } = useQuery({
    queryKey: ["search-status", activeId],
    queryFn: () => (activeId ? qbtClient.getSearchStatus(activeId) : Promise.resolve([])),
    enabled: activeId !== null,
    refetchInterval: pollWithBackoff(1000),
  });

  // Search result polling (incremental)
  useQuery({
    queryKey: ["search-results", activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const res = await qbtClient.getSearchResults(activeId, 50, useSearchStore.getState().offset);
      appendResults(res.results);
      return res;
    },
    enabled: activeId !== null && status?.[0]?.status === "Running",
    refetchInterval: pollWithBackoff(1500),
  });

  const isRunning = status?.[0]?.status === "Running";
  // /search/status's `total` is the number of results returned so far — shown
  // at the right end of the recent-searches row while a search is active
  const resultCount = activeId !== null ? (status?.[0]?.total ?? allResults.length) : null;

  // The incremental poll stops the moment status leaves "Running", so a
  // search that finishes on its own would leave its tail unfetched. Drain
  // the remainder once.
  useEffect(() => {
    if (activeId === null || status === undefined || isRunning) return;
    const total = status[0]?.total ?? 0;
    if (useSearchStore.getState().offset >= total) return;
    let cancelled = false;
    (async () => {
      try {
        // 500 per page × 50 pages covers any realistic search
        for (
          let page = 0;
          page < 50 && !cancelled && useSearchStore.getState().offset < total;
          page++
        ) {
          const res = await qbtClient.getSearchResults(
            activeId,
            500,
            useSearchStore.getState().offset,
          );
          if (res.results.length === 0) break;
          appendResults(res.results);
        }
      } catch {
        // Network hiccup: keep whatever was fetched
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId, status, isRunning, appendResults]);

  const startSearch = useCallback(
    async (patternOverride?: string) => {
      const p = (patternOverride ?? useSearchStore.getState().pattern).trim();
      if (!p) return;
      try {
        const { id } = await qbtClient.startSearch(p, pluginFilter, category);
        // The form no longer has a clear button: replacing means deleting the
        // previous job server-side instead of leaking it
        const prev = useSearchStore.getState().activeId;
        if (prev !== null) qbtClient.deleteSearch(prev).catch(() => {});
        addRecent(p);
        beginSearch(id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    },
    [pluginFilter, category, beginSearch, addRecent],
  );

  // Re-run a recent search from a history chip
  const rerunSearch = useCallback(
    (term: string) => {
      setPattern(term);
      startSearch(term);
    },
    [startSearch, setPattern],
  );

  // Auto-start one search when arriving via a ?q= navigation (once per q —
  // the store survives remounts, so the guard must too)
  useEffect(() => {
    const q = urlSearch.q;
    if (!q || useSearchStore.getState().autoStartedFor === q) return;
    setAutoStartedFor(q);
    setPattern(q);
    if (urlSearch.category) setCategory(urlSearch.category);
    startSearch(q);
  }, [urlSearch.q, urlSearch.category, startSearch, setAutoStartedFor, setPattern, setCategory]);

  const stopSearch = useCallback(async () => {
    if (!activeId) return;
    try {
      await qbtClient.stopSearch(activeId);
      // Fetch remaining results
      const res = await qbtClient.getSearchResults(activeId, 500, useSearchStore.getState().offset);
      appendResults(res.results);
      toast.success(t("Stopped"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [activeId, appendResults, t]);

  const downloadResult = async (r: SearchResult) => {
    try {
      await qbtClient.addTorrent({ urls: r.fileUrl });
      toast.success(t("Added"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const _updatePlugins = async () => {
    try {
      await qbtClient.updateSearchPlugins();
      await qc.invalidateQueries({ queryKey: ["search-plugins"] });
      toast.success(t("Saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("Search")}</h2>
        <Button variant="outline" size="sm" onClick={() => setPluginDialog(true)}>
          <Puzzle className="size-3.5" />
          {t("Manage Plugins")}
        </Button>
      </div>

      <SearchForm
        pattern={pattern}
        category={category}
        pluginFilter={pluginFilter}
        plugins={plugins}
        isRunning={isRunning}
        onPatternChange={setPattern}
        onCategoryChange={setCategory}
        onPluginFilterChange={setPluginFilter}
        onStart={startSearch}
        onStop={stopSearch}
      />

      {/* Recent-search chips (left) and the live result total (right) are
          separate concerns sharing one row: the count pairs with the results
          table below, not with the history */}
      {(recent.length > 0 || resultCount !== null) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <SearchHistory
            entries={recent}
            onSelect={rerunSearch}
            onRemove={removeRecent}
            onClear={clearRecent}
          />
          {resultCount !== null && (
            <span
              className={
                recent.length > 0
                  ? "ml-auto min-w-fit border-l border-border/60 pl-3 text-xs tabular-nums text-muted-foreground"
                  : "ml-auto text-xs tabular-nums text-muted-foreground"
              }
            >
              {resultCount} {t("results")}
            </span>
          )}
        </div>
      )}

      <ResultsTable
        results={allResults}
        isMobile={isMobile}
        isRunning={isRunning}
        hasActiveSearch={activeId !== null}
        onDownload={downloadResult}
      />

      {/* Plugin manager dialog */}
      <PluginManager open={pluginDialog} onOpenChange={setPluginDialog} />
    </div>
  );
}
