/**
 * Settings section: BitTorrent (maps to the BitTorrent page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { ListOrdered, RadioTower, ShieldCheck, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField, SelectField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function BitTorrentSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <ShieldCheck className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Privacy")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label="DHT (Distributed Hash Table)"
            field="dht"
            form={form}
            update={update}
            help={t("help.dht")}
          />
          <CheckField
            label="PeX (Peer Exchange)"
            field="pex"
            form={form}
            update={update}
            help={t("help.pex")}
          />
          <CheckField
            label="LSD (Local Service Discovery)"
            field="lsd"
            form={form}
            update={update}
            help={t("help.lsd")}
          />
          <SelectField
            label={t("Encryption")}
            field="encryption"
            form={form}
            update={update}
            help={t("help.encryption")}
            options={[
              { value: 0, label: t("Encryption: Disable") },
              { value: 1, label: t("Encryption: Prefer") },
              { value: 2, label: t("Encryption: Require") },
            ]}
          />
          <CheckField
            label={t("Anonymous mode")}
            field="anonymous_mode"
            form={form}
            update={update}
            help={t("help.anonymous")}
          />
          <SelectField
            label={t("BitTorrent protocol")}
            field="bittorrent_protocol"
            form={form}
            update={update}
            help={t("help.utp")}
            options={[
              { value: 0, label: "TCP & μTP" },
              { value: 1, label: "TCP" },
              { value: 2, label: "μTP" },
            ]}
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <ListOrdered className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Torrent Queueing")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Torrent Queueing")}
            field="queueing_enabled"
            form={form}
            update={update}
            help={t("help.queueing")}
          />

          <div className="space-y-3 pl-6">
            <NumField
              inset
              label={t("Max active downloads")}
              field="max_active_downloads"
              form={form}
              update={update}
              help={t("help.max_active_downloads")}
            />
            <NumField
              inset
              label={t("Max active uploads")}
              field="max_active_uploads"
              form={form}
              update={update}
            />
            <NumField
              inset
              label={t("Max active torrents")}
              field="max_active_torrents"
              form={form}
              update={update}
            />
            <CheckField
              label={t("Do not count slow torrents in these limits")}
              field="dont_count_slow_torrents"
              form={form}
              update={update}
              help={t("help.slow_torrents")}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <UploadCloud className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Seeding Limits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Stop seeding at ratio")}
            field="max_ratio_enabled"
            form={form}
            update={update}
            help={t("help.max_ratio")}
          />

          <div className="pl-6 space-y-3">
            <NumField inset label="　" field="max_ratio" form={form} update={update} step={0.1} />
            <SelectField
              inset
              label={t("Then")}
              field="max_ratio_act"
              form={form}
              update={update}
              options={[
                { value: 0, label: t("Pause torrent") },
                { value: 1, label: t("Remove torrent") },
              ]}
            />
          </div>

          <CheckField
            label={t("Stop seeding after")}
            field="max_seeding_time_enabled"
            form={form}
            update={update}
            help={t("help.max_seeding_time")}
          />

          <div className="pl-6">
            <NumField
              inset
              label={t("Minutes")}
              field="max_seeding_time"
              form={form}
              update={update}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <RadioTower className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Automatically add these trackers to new downloads")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-24 w-full rounded-md border bg-background p-2 font-mono text-xs"
            value={String(form.add_trackers ?? "")}
            onChange={(e) => update("add_trackers", e.target.value)}
            placeholder={"https://tracker.example.com/announce\nOne per line"}
            aria-label={t("Automatically add these trackers to new downloads")}
          />
          <p className="text-xs text-muted-foreground">{t("help.add_trackers")}</p>
          <div className="pt-2">
            <CheckField
              label={t("Enable")}
              field="add_trackers_enabled"
              form={form}
              update={update}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
