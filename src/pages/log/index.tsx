import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Copy, EyeOff, Logs, ShieldBan } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { LogEntry, PeerLogEntry } from "@/types/qbt";
import { LogFilterBar } from "./LogFilterBar";
import { LogList } from "./LogList";
import { formatTime, getLevelLabel, type LogLevel, levelConfig } from "./utils";

const validLevel = (v: unknown): v is LogLevel | "all" =>
  v === "all" || v === "normal" || v === "info" || v === "warning" || v === "critical";
const validSrc = (v: unknown): v is "main" | "peers" => v === "main" || v === "peers";

/** Local buffer cap: qBT logs can reach tens of thousands of entries; the virtual
 *  list keeps the DOM node count constant regardless */
const MAX_BUFFER = 50_000;

/**
 * Log page
 *
 * - Fetching: /log/main polled incrementally via last_known_id (2s).
 *   Tested on qBT 5.2.3: the per-level query params (normal/info/warning/critical)
 *   have no effect, so level filtering happens on the client; the type bitmask is
 *   1=NORMAL 2=INFO 4=WARNING 8=CRITICAL.
 * - Filtering: level + keyword, both written to the URL (?level=&q=), applied instantly.
 * - Rendering: @tanstack/react-virtual virtual list mounts only the visible rows,
 *   keeping the DOM node count constant even with tens of thousands of entries.
 * - Keyboard: f toggles auto refresh.
 */
export function LogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlSearch = useSearch({ strict: false }) as {
    level?: string;
    q?: string;
    src?: string;
  };
  const [source, setSource] = useState<"main" | "peers">(
    validSrc(urlSearch.src) ? urlSearch.src : "main",
  );
  const [filterLevel, setFilterLevel] = useState<LogLevel | "all">(
    validLevel(urlSearch.level) ? urlSearch.level : "all",
  );
  const [searchInput, setSearchInput] = useState(urlSearch.q ?? "");
  const [autoRefresh, setAutoRefresh] = useState(true);
  // Full buffer (kept in state so filtered results can be derived via useMemo)
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [peerLogs, setPeerLogs] = useState<PeerLogEntry[]>([]);
  const lastIdRef = useRef(0);
  const lastPeerIdRef = useRef(-1);

  // URL param changes (command palette / external navigation) sync into local state
  useEffect(() => {
    if (validLevel(urlSearch.level)) setFilterLevel(urlSearch.level);
    if (typeof urlSearch.q === "string") setSearchInput(urlSearch.q);
    if (validSrc(urlSearch.src)) setSource(urlSearch.src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch.level, urlSearch.q, urlSearch.src]);

  const setUrlParam = useCallback(
    (patch: { level?: string; q?: string; src?: string }) => {
      navigate({
        to: "/log",
        search: (prev) => {
          const next: Record<string, string | undefined> = { ...prev, ...patch };
          for (const k of Object.keys(next)) {
            if (
              !next[k] ||
              (k === "level" && next[k] === "all") ||
              (k === "src" && next[k] === "main")
            ) {
              delete next[k];
            }
          }
          return next as { level?: string; q?: string };
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce writing the keyword back to the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((urlSearch.q ?? "") !== searchInput) setUrlParam({ q: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch.q, setUrlParam]);

  const { data: newLogs, isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () =>
      qbtClient.getLog({
        normal: true,
        info: true,
        warning: true,
        critical: true,
        last_known_id: lastIdRef.current,
      }),
    refetchInterval: autoRefresh ? 2000 : false,
  });

  const { data: newPeerLogs } = useQuery({
    queryKey: ["peer-logs"],
    queryFn: () => qbtClient.getPeerLog(lastPeerIdRef.current),
    enabled: source === "peers",
    refetchInterval: autoRefresh ? 2000 : false,
  });

  useEffect(() => {
    if (!newPeerLogs || newPeerLogs.length === 0) return;
    setPeerLogs((prev) => {
      const existing = new Set(prev.map((l) => l.id));
      const merged = [...newPeerLogs.filter((l) => !existing.has(l.id)), ...prev].sort(
        (a, b) => b.id - a.id,
      );
      return merged.length > MAX_BUFFER ? merged.slice(0, MAX_BUFFER) : merged;
    });
    const maxId = Math.max(...newPeerLogs.map((l) => l.id));
    if (maxId > lastPeerIdRef.current) lastPeerIdRef.current = maxId;
  }, [newPeerLogs]);

  // Merge increments into the buffer (newest first), dedupe + cap at MAX_BUFFER
  useEffect(() => {
    if (!newLogs || newLogs.length === 0) return;
    setAllLogs((prev) => {
      const existing = new Set(prev.map((l) => l.id));
      const merged = [...newLogs.filter((l) => !existing.has(l.id)), ...prev].sort(
        (a, b) => b.id - a.id,
      );
      return merged.length > MAX_BUFFER ? merged.slice(0, MAX_BUFFER) : merged;
    });
    const maxId = Math.max(...newLogs.map((l) => l.id));
    if (maxId > lastIdRef.current) lastIdRef.current = maxId;
  }, [newLogs]);

  // Filter (level + keyword) via useMemo to avoid recomputing every frame;
  // the banned-IP source has no level, search matches IP/reason
  const filteredMain = useMemo(() => {
    const typeValue = filterLevel === "all" ? 0 : levelConfig[filterLevel].value;
    const q = searchInput.trim().toLowerCase();
    if (typeValue === 0 && !q) return allLogs;
    return allLogs.filter(
      (l) =>
        (typeValue === 0 || l.type === typeValue) && (!q || l.message.toLowerCase().includes(q)),
    );
  }, [allLogs, filterLevel, searchInput]);

  const filteredPeers = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return peerLogs;
    return peerLogs.filter(
      (l) => l.ip.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q),
    );
  }, [peerLogs, searchInput]);

  const activeList = source === "peers" ? filteredPeers : filteredMain;
  const activeTotal = source === "peers" ? peerLogs.length : allLogs.length;

  const copyAll = () => {
    const text = activeList
      .map((l) =>
        "message" in l
          ? `[${formatTime(l.timestamp)}] [${getLevelLabel(l.type).toUpperCase()}] ${l.message}`
          : `[${formatTime(l.timestamp)}] [BANNED] ${l.ip} — ${l.reason}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text).then(
      () => toast.success(t("Copied")),
      () => toast.error(t("Copy failed")),
    );
  };

  const clearLogs = () => {
    setAllLogs([]);
    lastIdRef.current = 0;
  };

  const selectSource = (src: "main" | "peers") => {
    setSource(src);
    setUrlParam({ src });
  };

  const selectLevel = (level: LogLevel | "all") => {
    setFilterLevel(level);
    setUrlParam({ level });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t("Log")}</h2>
        {/* Source tabs: execution log / IP bans (underline style, same as the global TabNav) */}
        <div className="flex items-center gap-0 border-b pb-0">
          {(["main", "peers"] as const).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => selectSource(src)}
              className={`relative flex items-center gap-1 px-3 pb-1.5 text-xs font-medium transition-colors ${
                source === src
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {src === "main" ? (
                <Logs className="inline size-3" />
              ) : (
                <ShieldBan className="inline size-3" />
              )}
              {t(src === "main" ? "Execution Log" : "Banned IPs")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <kbd className="rounded border px-1">f</kbd>
          <span>{t("Auto Refresh")}</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy className="mr-1 h-4 w-4" />
            {t("Copy All")}
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            <EyeOff className="mr-1 h-4 w-4" />
            {t("Clear")}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("Auto Refresh")}</span>
            <Switch checked={autoRefresh} onCheckedChange={(v) => setAutoRefresh(v === true)} />
          </div>
        </div>
      </div>

      <LogFilterBar
        source={source}
        filterLevel={filterLevel}
        searchInput={searchInput}
        activeCount={activeList.length}
        activeTotal={activeTotal}
        onSelectLevel={selectLevel}
        onSearchChange={setSearchInput}
      />

      <LogList
        activeList={activeList}
        activeTotal={activeTotal}
        isLoading={isLoading}
        onToggleAutoRefresh={setAutoRefresh}
      />
    </div>
  );
}
