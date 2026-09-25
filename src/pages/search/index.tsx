import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { PluginManager } from "@/components/search/PluginManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
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
  const [pattern, setPattern] = useState(urlSearch.q ?? "");
  const [category, setCategory] = useState(urlSearch.category ?? "all");
  const [autoStarted, setAutoStarted] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const offsetRef = useRef(0);

  const [pluginDialog, setPluginDialog] = useState(false);

  // Search plugin list
  const { data: plugins } = useQuery({
    queryKey: ["search-plugins"],
    queryFn: () => qbtClient.getSearchPlugins(),
  });

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
      const res = await qbtClient.getSearchResults(activeId, 50, offsetRef.current);
      if (res.results.length > 0) {
        setAllResults((prev) => [...prev, ...res.results]);
        offsetRef.current += res.results.length;
      }
      return res;
    },
    enabled: activeId !== null && status?.[0]?.status === "Running",
    refetchInterval: pollWithBackoff(1500),
  });

  const isRunning = status?.[0]?.status === "Running";

  const startSearch = useCallback(async () => {
    if (!pattern.trim()) return;
    try {
      const { id } = await qbtClient.startSearch(pattern, "all", category);
      setActiveId(id);
      setAllResults([]);
      offsetRef.current = 0;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [pattern, category]);

  // Auto-start one search when arriving via a ?q= navigation
  useEffect(() => {
    if (urlSearch.q && !autoStarted && pattern === urlSearch.q) {
      setAutoStarted(true);
      startSearch();
    }
  }, [urlSearch.q, autoStarted, pattern, startSearch]);

  const stopSearch = useCallback(async () => {
    if (!activeId) return;
    try {
      await qbtClient.stopSearch(activeId);
      // Fetch remaining results
      const res = await qbtClient.getSearchResults(activeId, 500, offsetRef.current);
      if (res.results.length > 0) {
        setAllResults((prev) => [...prev, ...res.results]);
      }
      toast.success(t("Stopped"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [activeId, t]);

  const downloadResult = async (r: SearchResult) => {
    try {
      await qbtClient.addTorrent({ urls: r.fileUrl });
      toast.success(t("Added"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const clearSearch = () => {
    if (activeId) {
      qbtClient.deleteSearch(activeId).catch(() => {});
    }
    setActiveId(null);
    setAllResults([]);
    setPattern("");
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
          <Plus className="mr-1 h-4 w-4" />
          {t("Manage Plugins")}
        </Button>
      </div>

      <SearchForm
        pattern={pattern}
        category={category}
        isRunning={isRunning}
        hasActiveSearch={activeId !== null}
        onPatternChange={setPattern}
        onCategoryChange={setCategory}
        onStart={startSearch}
        onStop={stopSearch}
        onClear={clearSearch}
      />

      {/* Plugin status */}
      {plugins && plugins.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {plugins
            .filter((p) => p.enabled)
            .map((p) => (
              <Badge key={p.name} variant="outline" className="text-[10px]">
                {p.fullName || p.name}
              </Badge>
            ))}
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
