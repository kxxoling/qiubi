/**
 * Settings section: Speed (maps to the Speed page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Gauge, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField, Row, SelectField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

/** Pad the schedule hours/minutes to two digits */
const pad = (n: unknown) => String(n ?? 0).padStart(2, "0");

export function SpeedSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Gauge className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Global Speed Limits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumField
            label={t("Global Download Limit")}
            field="dl_limit"
            form={form}
            update={update}
            hint="KiB/s, 0 = ∞"
            help={t("help.global_limit")}
          />
          <NumField
            label={t("Global Upload Limit")}
            field="up_limit"
            form={form}
            update={update}
            hint="KiB/s, 0 = ∞"
          />
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Zap className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Alternative Speed Limits")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumField
            label={t("Global Download Limit")}
            field="alt_dl_limit"
            form={form}
            update={update}
            hint="KiB/s"
          />
          <NumField
            label={t("Global Upload Limit")}
            field="alt_up_limit"
            form={form}
            update={update}
            hint="KiB/s"
          />
          <p className="text-xs text-muted-foreground">{t("Alt speed desc")}</p>
          <CheckField
            label={t("Schedule the use of alternative rate limits")}
            field="scheduler_enabled"
            form={form}
            update={update}
            help={t("help.scheduler")}
          />

          <div className="space-y-3 pl-6">
            <Row inset label={t("From")}>
              <Input
                type="number"
                min={0}
                max={23}
                className="w-20"
                value={pad(form.schedule_from_hour)}
                onChange={(e) => update("schedule_from_hour", Number(e.target.value))}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                className="w-20"
                value={pad(form.schedule_from_min)}
                onChange={(e) => update("schedule_from_min", Number(e.target.value))}
              />
            </Row>
            <Row inset label={t("To")}>
              <Input
                type="number"
                min={0}
                max={23}
                className="w-20"
                value={pad(form.schedule_to_hour)}
                onChange={(e) => update("schedule_to_hour", Number(e.target.value))}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                className="w-20"
                value={pad(form.schedule_to_min)}
                onChange={(e) => update("schedule_to_min", Number(e.target.value))}
              />
            </Row>
            <SelectField
              inset
              label={t("When")}
              field="scheduler_days"
              form={form}
              update={update}
              options={[
                { value: 0, label: t("Every day") },
                { value: 1, label: t("Weekdays") },
                { value: 2, label: t("Weekends") },
                { value: 3, label: t("Monday") },
                { value: 4, label: t("Tuesday") },
                { value: 5, label: t("Wednesday") },
                { value: 6, label: t("Thursday") },
                { value: 7, label: t("Friday") },
                { value: 8, label: t("Saturday") },
                { value: 9, label: t("Sunday") },
              ]}
            />
          </div>

          <CheckField
            label={t("Apply rate limit to utp protocol")}
            field="limit_utp_rate"
            form={form}
            update={update}
            help={t("help.limit_utp")}
          />
          <CheckField
            label={t("Apply rate limit to transport overhead")}
            field="limit_tcp_overhead"
            form={form}
            update={update}
            help={t("help.limit_overhead")}
          />
          <CheckField
            label={t("Apply rate limit to peers on LAN")}
            field="limit_lan_peers"
            form={form}
            update={update}
            help={t("help.limit_lan")}
          />
        </CardContent>
      </Card>
    </>
  );
}
