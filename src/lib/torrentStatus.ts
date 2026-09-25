/**
 * Shared definitions for torrent status filtering — aligned with the full
 * sidebar enumeration of the official qBT Web UI
 *
 * Status values are used directly as URL query params (#/?status=downloading);
 * labels are English-canonical, translated via i18n entries.
 */
import type { TorrentState } from "@/types/qbt";

export type StatusFilterValue =
  | "all"
  | "downloading"
  | "seeding"
  | "completed"
  | "resumed"
  | "paused"
  | "active"
  | "inactive"
  | "stalled"
  | "pausedUP"
  | "pausedDL"
  | "checking"
  | "error";

export interface StatusOption {
  value: StatusFilterValue;
  label: string;
  /** lucide icon shown in selects/menus (global consistency) */
  icon: string;
  /** text color classes matching the state pills below */
  color: string;
}

/** Icon names are resolved by the shared <StatusSelect> component */
export const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All", icon: "list", color: "text-muted-foreground" },
  {
    value: "downloading",
    label: "Downloading",
    icon: "arrow-down-to-line",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "seeding",
    label: "Seeding",
    icon: "arrow-up-from-line",
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    value: "completed",
    label: "Completed",
    icon: "circle-check",
    color: "text-teal-600 dark:text-teal-400",
  },
  { value: "resumed", label: "Resumed", icon: "play", color: "text-sky-600 dark:text-sky-400" },
  {
    value: "paused",
    label: "Paused",
    icon: "pause",
    color: "text-yellow-700 dark:text-yellow-400",
  },
  { value: "active", label: "Active", icon: "zap", color: "text-violet-600 dark:text-violet-400" },
  { value: "inactive", label: "Inactive", icon: "moon", color: "text-muted-foreground" },
  {
    value: "stalled",
    label: "Pending",
    icon: "hourglass",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "pausedUP",
    label: "Paused (Seeding)",
    icon: "pause",
    color: "text-yellow-700 dark:text-yellow-400",
  },
  {
    value: "pausedDL",
    label: "Paused (Downloading)",
    icon: "pause",
    color: "text-yellow-700 dark:text-yellow-400",
  },
  {
    value: "checking",
    label: "Checking",
    icon: "scan-line",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    value: "error",
    label: "Error",
    icon: "triangle-alert",
    color: "text-red-600 dark:text-red-400",
  },
];

const PAUSED_DL = ["pausedDL", "stoppedDL"];
const PAUSED_UP = ["pausedUP", "stoppedUP"];
const DL_STATES = [
  "downloading",
  "metaDL",
  "stalledDL",
  "forcedDL",
  "queuedDL",
  "allocating",
  "moving",
];
const UP_STATES = ["uploading", "stalledUP", "forcedUP", "queuedUP"];
const CHECK_STATES = ["checkingDL", "checkingUP", "checkingResumeData"];
const ACTIVE_STATES = ["downloading", "uploading", "metaDL", "forcedDL", "forcedUP"];

export function matchStatus(state: TorrentState, filter: string): boolean {
  switch (filter) {
    case "downloading":
      return DL_STATES.includes(state);
    case "seeding":
      return UP_STATES.includes(state);
    case "completed":
      return state.endsWith("UP") || state === "uploading";
    case "resumed":
      return !state.startsWith("paused") && !state.startsWith("stopped");
    case "paused":
      return state.startsWith("paused") || state.startsWith("stopped");
    case "active":
      return ACTIVE_STATES.includes(state);
    case "inactive":
      return !ACTIVE_STATES.includes(state);
    case "stalled":
      return state === "stalledDL" || state === "stalledUP";
    case "pausedUP":
      return PAUSED_UP.includes(state);
    case "pausedDL":
      return PAUSED_DL.includes(state);
    case "checking":
      return CHECK_STATES.includes(state);
    case "error":
      return state === "error" || state === "missingFiles";
    default:
      return true;
  }
}

/**
 * Soft-tinted status pill classes per state group.
 *
 * Design constraints: must stay legible on any of the 19 color themes in
 * both light and dark modes, and stay QUIET — the badge is metadata, not
 * the main content (dark mode uses even lighter tints to avoid visual
 * heaviness on dark backgrounds).
 */
const STATE_PILL: Record<string, string[]> = {
  // Downloading side — green family
  "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300": [
    "downloading",
    "metaDL",
    "forcedDL",
  ],
  // Seeding — blue family
  "bg-sky-500/15 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300": ["uploading", "forcedUP"],
  // Stale seeding (no peers interested) — indigo, distinct from active seeding
  "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300": ["stalledUP"],
  // Stalled download — amber (waiting for peers)
  "bg-amber-500/15 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300": ["stalledDL"],
  // Queued — muted violet
  "bg-violet-500/15 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300": [
    "queuedDL",
    "queuedUP",
  ],
  // Checking — cyan
  "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300": [
    "checkingDL",
    "checkingUP",
    "checkingResumeData",
    "allocating",
  ],

  // Paused — yellow family (deliberately NOT theme-tinted; a fixed semantic
  // hue that reads on light and dark, and stays distinguishable from amber
  // "stalled" and gruvbox/cobalt2 yellow-ish theme primaries because the
  // pill is tinted, not solid)
  "bg-yellow-500/15 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300": [
    "stoppedDL",
    "stoppedUP",
    "pausedUP",
    "pausedDL",
  ],
  // Errors — red
  "bg-red-500/15 text-red-700 dark:bg-red-400/10 dark:text-red-300": ["error", "missingFiles"],
};

/** Inverted lookup built once (state → pill classes) */
const STATE_PILL_BY_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_PILL).flatMap(([cls, states]) => states.map((s) => [s, cls])),
);

/** Pill classes for a torrent state */
export function statePill(state: string): string {
  return STATE_PILL_BY_STATE[state] ?? "bg-secondary text-secondary-foreground";
}
