/**
 * Status bar speed chart popover content
 *
 * Opens on clicking the ↑↓ speeds in the status bar, showing recent speed history (shared store,
 * same source as the Dashboard, data survives page switches). The classic downloader "click the speed to see the curve".
 *
 * Desktop: Popover; mobile: bottom Sheet (see StatusBar).
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { formatBytes, formatSpeed } from "@/lib/utils.format";
import { useSpeedHistory } from "@/stores/speedHistory";

/**
 * Themed tooltip for the recharts speed charts (shared with the Dashboard):
 * popover background/border from the active color theme, dl = green dot,
 * up = blue dot, values right-aligned tabular numerals.
 */
export function SpeedChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; dataKey?: string | number }>;
  label?: string;
}) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-mono text-[10px] text-muted-foreground">{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-1.5 text-popover-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "size-2 shrink-0 rounded-full",
              p.dataKey === "dl" ? "bg-green-500" : "bg-blue-500",
            )}
          />
          <span className="text-muted-foreground">
            {p.dataKey === "dl" ? t("Download Speed") : t("Upload Speed")}
          </span>
          <span className="ml-auto pl-4 font-medium tabular-nums">
            {formatSpeed(Number(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

const RANGES = [
  { label: "1m", minutes: 1 },
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
] as const;

export function SpeedChartContent({ className }: { className?: string }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const points = useSpeedHistory((s) => s.points);
  const [rangeIdx, setRangeIdx] = useState(1);

  const chartData = useMemo(() => {
    const cutoff = Date.now() - RANGES[rangeIdx].minutes * 60_000;
    return points
      .filter((p) => p.t >= cutoff)
      .map((p) => ({
        ...p,
        time: new Date(p.t).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));
  }, [points, rangeIdx]);

  const last = points[points.length - 1];
  const chartHeight = isMobile ? 160 : 220;

  return (
    <div className={cn("w-[min(92vw,520px)] p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs font-medium tabular-nums">
          <span className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-green-500" />
            {formatSpeed(last?.dl ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-blue-500" />
            {formatSpeed(last?.up ?? 0)}
          </span>
        </div>
        <div className="flex items-center gap-0 text-xs">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              type="button"
              className={cn(
                "relative rounded px-1.5 py-0.5 transition-colors",
                i === rangeIdx ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setRangeIdx(i)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {chartData.length < 2 ? (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: chartHeight }}
        >
          {t("Collecting speed data…")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sbDlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sbUpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={48}
            />
            {/* Axis labels use the compact format (no /s; the unit lives in the tooltip) to avoid squeezing the chart area */}
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => formatBytes(v)}
              width={56}
              domain={[0, (max: number) => Math.max(max * 1.1, 1024)]}
            />
            <Tooltip
              content={<SpeedChartTip />}
              cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="dl"
              stroke="#22c55e"
              strokeWidth={1.5}
              fill="url(#sbDlGrad)"
              name="dl"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="up"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#sbUpGrad)"
              name="up"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
