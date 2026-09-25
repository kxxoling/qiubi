/** Shared log-page helpers: level config + timestamp formatting */
export type LogLevel = "normal" | "info" | "warning" | "critical";

export const levelConfig: Record<LogLevel, { value: number; color: string }> = {
  normal: { value: 1, color: "bg-secondary text-secondary-foreground" },
  info: { value: 2, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  warning: { value: 4, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  critical: { value: 8, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function getLevelLabel(type: number): LogLevel {
  if (type === 2) return "info";
  if (type === 4) return "warning";
  if (type === 8) return "critical";
  return "normal";
}

export const formatTime = (timestamp: number): string =>
  new Date(timestamp * 1000).toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
