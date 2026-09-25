import i18n from "@/i18n";
/**
 * Format a byte count
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / k ** i;
  return `${value.toFixed(Math.max(0, decimals))} ${sizes[i]}`;
}

/**
 * Format a speed
 */
export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

/**
 * Format time (seconds → readable string)
 */
export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "∞";
  if (seconds === 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Format a Unix timestamp
 */
export function formatTimestamp(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Torrent state → human-readable
 */
export function torrentStateLabel(state: string): string {
  // English is the canonical term base (matching the qBT English UI);
  // Chinese translations are looked up by key in i18n entries
  const map: Record<string, string> = {
    error: "Error",
    missingFiles: "Missing Files",
    uploading: "Seeding",
    pausedUP: "Paused (Seeding)",
    stoppedUP: "Paused (Seeding)",
    queuedUP: "Queued (Seeding)",
    stalledUP: "Stalled (Seeding)",
    checkingUP: "Checking (Seeding)",
    forcedUP: "Force Seeding",
    allocating: "Allocating",
    downloading: "Downloading",
    metaDL: "Metadata",
    pausedDL: "Paused",
    stoppedDL: "Paused",
    queuedDL: "Queued",
    stalledDL: "Stalled",
    checkingDL: "Checking",
    forcedDL: "Force Download",
    checkingResumeData: "Resume Data",
    moving: "Moving",
  };
  const label = map[state] ?? state;
  // Go through i18n: the English entry is the source text, the Chinese entry
  // is a reviewed translation
  const translated = i18n.t(label);
  return translated || label;
}
