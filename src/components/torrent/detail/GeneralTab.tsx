import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import { formatBytes, formatSpeed, torrentStateLabel } from "@/lib/utils.format";
import type { TorrentInfo, TorrentProperties } from "@/types/qbt";

const fmtDate = (ts: number) => (ts > 0 ? new Date(ts * 1000).toLocaleString() : "-");
const fmtDuration = (s: number) => {
  if (!s || s < 0) return "-";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="truncate text-sm tabular-nums"
        title={typeof value === "string" ? value : undefined}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}

interface GeneralTabProps {
  info: TorrentInfo | undefined;
  properties: TorrentProperties | undefined;
}

/** General tab: property grid (qBT General tab) */
export function GeneralTab({ info, properties: props }: GeneralTabProps) {
  const { t } = useTranslation();

  return (
    <TabsContent value="general" className="min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 p-3 md:grid-cols-3 xl:grid-cols-4">
        <Field label={t("Status")} value={info ? torrentStateLabel(info.state) : "…"} />
        <Field label={t("Progress")} value={info ? `${(info.progress * 100).toFixed(1)}%` : "…"} />
        <Field label={t("Size")} value={formatBytes(info?.size ?? props?.total_size ?? 0)} />
        <Field label={t("Download Speed")} value={formatSpeed(info?.dlspeed ?? 0)} />
        <Field label={t("Upload Speed")} value={formatSpeed(info?.upspeed ?? 0)} />
        <Field label={t("ETA")} value={info?.eta ? fmtDuration(info.eta) : "-"} />
        <Field label={t("Share Ratio")} value={info?.ratio?.toFixed(2) ?? "-"} />
        <Field label={t("Total Downloaded")} value={formatBytes(info?.completed ?? 0)} />
        <Field label={t("Total Uploaded")} value={formatBytes(info?.uploaded ?? 0)} />
        <Field
          label={t("Seeds")}
          value={`${info?.num_complete ?? props?.seeds ?? 0} / ${info?.num_complete ?? props?.seeds_total ?? 0}`}
        />
        <Field
          label={t("Peers")}
          value={`${info?.num_incomplete ?? props?.peers ?? 0} / ${info?.num_incomplete ?? props?.peers_total ?? 0}`}
        />
        <Field label={t("Time Active")} value={fmtDuration(props?.time_elapsed ?? 0)} />
        <Field label={t("Save Path")} value={props?.save_path ?? info?.save_path} />
        <Field label={t("Created On")} value={fmtDate(props?.creation_date ?? 0)} />
        <Field label={t("Added On")} value={fmtDate(props?.addition_date ?? 0)} />
        <Field label={t("Completed On")} value={fmtDate(props?.completion_date ?? 0)} />
        <Field label={t("Created By")} value={props?.created_by || "-"} />
        <Field label={t("Piece Size")} value={props ? formatBytes(props.piece_size) : "-"} />
        <Field
          label={t("Pieces")}
          value={props ? `${props.pieces_have} / ${props.pieces_num}` : "-"}
        />
        <Field label={t("Comment")} value={props?.comment || "-"} />
        <Field
          label="InfoHash v1"
          value={props?.infohash_v1 ? `${props.infohash_v1.slice(0, 24)}…` : "-"}
        />
      </div>
    </TabsContent>
  );
}
