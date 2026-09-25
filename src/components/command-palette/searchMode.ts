/**
 * Command palette input prefix parsing.
 *
 * Prefixes follow common conventions:
 *   /xxx  quick commands (actions)  — slash-command convention (Slack/Discord/GitHub)
 *   #xxx  online torrent search     — DISABLED for redesign (falls through to mixed)
 *   @xxx  local torrents            — "@" stands for looking up entries (mention)
 *   >xxx  page navigation           — ">" = go to (vim/Notion convention)
 *   bare input  mixed mode (everything)
 */
import type { SearchResult } from "@/types/qbt";

export type PaletteMode = "mixed" | "command" | "search" | "local" | "nav";

export type SearchState =
  | { phase: "idle" }
  | { phase: "running"; jobId: number }
  | { phase: "done"; jobId: number; results: SearchResult[]; total: number };

/** Parse the input prefix into a palette mode + the remaining keywords */
export function parseMode(input: string): { mode: PaletteMode; query: string } {
  if (input.startsWith("/")) return { mode: "command", query: input.slice(1).trim() };
  // "#" online search is temporarily disabled (feature paused for redesign);
  // treat it as plain input so the prefix neither dead-ends nor triggers search
  // if (input.startsWith("#")) return { mode: "search", query: input.slice(1).trim() };
  if (input.startsWith("@")) return { mode: "local", query: input.slice(1).trim() };
  if (input.startsWith(">")) return { mode: "nav", query: input.slice(1).trim() };
  return { mode: "mixed", query: input.trim() };
}
