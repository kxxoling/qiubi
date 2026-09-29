/**
 * Recent search terms — client-side only.
 *
 * The qBittorrent API has no search-history endpoint, so this persists to
 * localStorage (same spirit as qiubi-settings / qiubi-error-log): a capped,
 * deduped, most-recent-first list that survives reloads.
 */
import { useCallback, useState } from "react";

const STORAGE_KEY = "qiubi-search-history";
const MAX_ENTRIES = 20;

function readStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_ENTRIES)
      : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded / private mode: history lives on for this session only
  }
}

export function useSearchHistory() {
  const [entries, setEntries] = useState<string[]>(readStorage);

  /** Record a search — dedupe (moves repeats to the front) and cap the list */
  const add = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setEntries((prev) => {
      const next = [trimmed, ...prev.filter((e) => e !== trimmed)].slice(0, MAX_ENTRIES);
      writeStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((term: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e !== term);
      writeStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    writeStorage([]);
  }, []);

  return { entries, add, remove, clear };
}
