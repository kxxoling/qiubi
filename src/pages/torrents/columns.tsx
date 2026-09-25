/**
 * Torrent table column definitions (TanStack Table)
 *
 * Column widths follow qBT's rough proportions; widths are user-resizable
 * via the header handle (double-click resets to default).
 */
import type { CellContext, useReactTable } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { statePill } from "@/lib/torrentStatus";
import { cn } from "@/lib/utils";
import { formatBytes, formatEta, formatSpeed, torrentStateLabel } from "@/lib/utils.format";
import type { TorrentInfo } from "@/types/qbt";

type CellCtx = CellContext<TorrentInfo, unknown>;

/** Default visibility: shown unless toggled off via the header context menu */
export const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  name: true,
  size: true,
  progress: true,
  dlspeed: true,
  upspeed: true,
  eta: true,
  state: true,
  ratio: false,
  category: false,
  tags: false,
  completed: false,
  downloaded: false,
  uploaded: false,
  num_complete: false,
  num_incomplete: false,
  availability: false,
  added_on: false,
  time_elapsed: false,
  save_path: false,
  tracker: false,
};

/** Columns below the default set are hidden until toggled via header context menu */
export function useTorrentColumns() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: { table: ReturnType<typeof useReactTable<TorrentInfo>> }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          />
        ),
        cell: ({
          row,
        }: {
          row: { getIsSelected: () => boolean; toggleSelected: (v: boolean) => void };
        }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableResizing: false,
      },
      {
        accessorKey: "name",
        header: t("Name"),
        size: 320,
        minSize: 140,
        cell: ({ row }: CellCtx) => (
          <div className="truncate font-medium">{row.getValue("name") as string}</div>
        ),
      },
      {
        accessorKey: "size",
        header: t("Size"),
        size: 90,
        minSize: 70,
        cell: ({ row }: CellCtx) => formatBytes(row.getValue("size") as number),
      },
      {
        accessorKey: "progress",
        size: 150,
        minSize: 100,
        header: t("Progress"),
        cell: ({ row }: CellCtx) => {
          const p = (row.getValue("progress") as number) * 100;
          return (
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full w-(--p) rounded-full bg-primary transition-all"
                  style={{ "--p": `${p}%` } as React.CSSProperties}
                />
              </div>
              <span className="text-xs tabular-nums">{p.toFixed(1)}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "dlspeed",
        header: t("Download Speed"),
        size: 110,
        minSize: 80,
        cell: ({ row }: CellCtx) => {
          const v = row.getValue("dlspeed") as number;
          return v > 0 ? formatSpeed(v) : "-";
        },
      },
      {
        accessorKey: "upspeed",
        header: t("Upload Speed"),
        size: 110,
        minSize: 80,
        cell: ({ row }: CellCtx) => {
          const v = row.getValue("upspeed") as number;
          return v > 0 ? formatSpeed(v) : "-";
        },
      },
      {
        accessorKey: "eta",
        header: t("ETA"),
        size: 90,
        minSize: 70,
        cell: ({ row }: CellCtx) => formatEta(row.getValue("eta") as number),
      },
      {
        accessorKey: "state",
        header: t("Status"),
        size: 110,
        minSize: 80,
        cell: ({ row }: CellCtx) => (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              statePill(row.getValue("state") as string),
            )}
          >
            {torrentStateLabel(row.getValue("state") as string)}
          </span>
        ),
      },
      /* ---- Optional columns, hidden by default (toggle via header right-click, like qBT) ---- */
      {
        accessorKey: "ratio",
        header: t("Share Ratio"),
        size: 80,
        minSize: 60,
        cell: ({ row }: CellCtx) => (row.getValue("ratio") as number).toFixed(2),
      },
      {
        accessorKey: "category",
        header: t("Category"),
        size: 110,
        minSize: 80,
        cell: ({ row }: CellCtx) => (
          <span className="truncate text-xs">{(row.getValue("category") as string) || "-"}</span>
        ),
      },
      {
        accessorKey: "tags",
        header: t("Tags"),
        size: 110,
        minSize: 70,
        cell: ({ row }: CellCtx) => (
          <span className="truncate text-xs">{(row.getValue("tags") as string) || "-"}</span>
        ),
      },
      {
        accessorKey: "completed",
        header: t("Completed"),
        size: 90,
        minSize: 70,
        cell: ({ row }: CellCtx) => formatBytes(row.getValue("completed") as number),
      },
      {
        accessorKey: "downloaded",
        header: t("Total Downloaded"),
        size: 100,
        minSize: 70,
        cell: ({ row }: CellCtx) => formatBytes(row.getValue("downloaded") as number),
      },
      {
        accessorKey: "uploaded",
        header: t("Total Uploaded"),
        size: 100,
        minSize: 70,
        cell: ({ row }: CellCtx) => formatBytes(row.getValue("uploaded") as number),
      },
      {
        accessorKey: "num_complete",
        header: t("Seeds"),
        size: 70,
        minSize: 55,
        cell: ({ row }: CellCtx) => String(row.getValue("num_complete") as number),
      },
      {
        accessorKey: "num_incomplete",
        header: t("Peers"),
        size: 70,
        minSize: 55,
        cell: ({ row }: CellCtx) => String(row.getValue("num_incomplete") as number),
      },
      {
        accessorKey: "availability",
        header: t("Availability"),
        size: 90,
        minSize: 70,
        cell: ({ row }: CellCtx) => (row.getValue("availability") as number).toFixed(2),
      },
      {
        accessorKey: "added_on",
        header: t("Added On"),
        size: 140,
        minSize: 110,
        cell: ({ row }: CellCtx) => {
          const ts = row.getValue("added_on") as number;
          return (
            <span className="text-xs tabular-nums text-muted-foreground">
              {ts > 0 ? new Date(ts * 1000).toLocaleString() : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "time_elapsed",
        header: t("Time Active"),
        size: 100,
        minSize: 75,
        cell: ({ row }: CellCtx) => {
          const sec = row.getValue("time_elapsed") as number;
          if (!sec) return "-";
          const d = Math.floor(sec / 86400);
          const h = Math.floor((sec % 86400) / 3600);
          return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h` : `${Math.floor(sec / 60)}m`;
        },
      },
      {
        accessorKey: "save_path",
        header: t("Save Path"),
        size: 200,
        minSize: 120,
        cell: ({ row }: CellCtx) => (
          <span className="truncate text-xs text-muted-foreground">
            {row.getValue("save_path") as string}
          </span>
        ),
      },
      {
        accessorKey: "tracker",
        header: t("Tracker"),
        size: 160,
        minSize: 100,
        cell: ({ row }: CellCtx) => {
          const u = row.getValue("tracker") as string;
          return <span className="truncate text-xs">{u ? new URL(u).host : "-"}</span>;
        },
      },
    ],
    [t],
  );
}
