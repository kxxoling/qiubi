import { ArrowDown, ArrowUp, HardDrive } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SpeedChartTip } from "@/components/layout/SpeedChartPopover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTorrentList } from "@/hooks/useMainDataSync";
import { formatBytes, formatSpeed } from "@/lib/utils.format";
import { useSpeedHistory } from "@/stores/speedHistory";

const SAMPLE_MS = 2000;

/**
 * Dashboard — global speed stats + real-time speed chart
 *
 * Speed history comes from a shared store (sampled uniformly by useMainDataSync),
 * the same source as the status bar popup, so data survives page switches. Supports time range selection.
 */

export function Dashboard() {
  const { t } = useTranslation();
  const history = useSpeedHistory((s) => s.points);
  const [rangeMin, setRangeMin] = useState(5);

  const { torrents, serverState: transfer } = useTorrentList(SAMPLE_MS);

  // Filter displayed data by time range
  const chartData = useMemo(() => {
    const cutoff = Date.now() - rangeMin * 60_000;
    return history
      .filter((p) => p.t >= cutoff)
      .map((p) => ({
        ...p,
        time: new Date(p.t).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));
  }, [rangeMin, history]);

  // Disk space (low-frequency polling)

  const stats = {
    downloading:
      torrents?.filter((tr) =>
        ["downloading", "metaDL", "stalledDL", "forcedDL", "queuedDL"].includes(tr.state),
      ).length ?? 0,
    uploading:
      torrents?.filter((tr) => ["uploading", "stalledUP", "forcedUP"].includes(tr.state)).length ??
      0,
    paused: torrents?.filter((tr) => tr.state.startsWith("paused")).length ?? 0,
    error:
      torrents?.filter((tr) => tr.state === "error" || tr.state === "missingFiles").length ?? 0,
  };

  // Cumulative stats
  const totalDownloaded = transfer?.dl_info_data ?? 0;
  const totalUploaded = transfer?.up_info_data ?? 0;

  const cards = [
    {
      title: t("Download Speed"),
      value: formatSpeed(transfer?.dl_info_speed ?? 0),
      icon: ArrowDown,
      color: "text-green-500",
    },
    {
      title: t("Upload Speed"),
      value: formatSpeed(transfer?.up_info_speed ?? 0),
      icon: ArrowUp,
      color: "text-blue-500",
    },
    {
      title: t("Total Downloaded"),
      value: formatBytes(totalDownloaded),
      icon: HardDrive,
      color: "text-emerald-500",
    },
    {
      title: t("Total Uploaded"),
      value: formatBytes(totalUploaded),
      icon: HardDrive,
      color: "text-sky-500",
    },
    {
      title: t("Active Downloads"),
      value: String(stats.downloading),
      icon: ArrowDown,
      color: "text-emerald-500",
    },
    {
      title: t("Active Uploads"),
      value: String(stats.uploading),
      icon: ArrowUp,
      color: "text-sky-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("Dashboard")}</h2>
        <div className="flex items-center gap-0 text-xs">
          {[1, 5, 15].map((min) => (
            <button
              key={min}
              type="button"
              className={`relative px-2.5 py-1 font-medium transition-colors ${
                rangeMin === min
                  ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setRangeMin(min)}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Speed chart (area chart conveys traffic better than a line chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t("Speed")} — {chartData.length} {t("entries")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `${formatBytes(v)}/s`}
                width={80}
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
                fill="url(#dlGrad)"
                name="dl"
              />
              <Area
                type="monotone"
                dataKey="up"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#upGrad)"
                name="up"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom info row */}
      {transfer && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            DHT: {transfer.dht_nodes ?? 0} {t("nodes")}
          </span>
          <span>
            {t("Connection Status")}: {t(transfer.connection_status ?? "")}
          </span>
          {stats.paused > 0 && (
            <span>
              {t("Paused")}: {stats.paused}
            </span>
          )}
          {stats.error > 0 && (
            <span className="text-red-500">
              {t("Error")}: {stats.error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
