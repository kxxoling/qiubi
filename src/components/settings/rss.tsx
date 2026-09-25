/**
 * Settings section: RSS (maps to the RSS page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Rss } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, NumField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function RssSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Rss className="inline size-4 text-muted-foreground" />
          RSS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CheckField
          label={t("Enable fetching RSS feeds")}
          field="rss_processing_enabled"
          form={form}
          update={update}
          help={t("help.rss_processing")}
        />
        <CheckField
          label={t("Enable auto-downloading of RSS torrents")}
          field="rss_auto_downloading_enabled"
          form={form}
          update={update}
          help={t("help.rss_auto")}
        />
        <NumField
          label={t("Feeds refresh interval")}
          field="rss_refresh_interval"
          form={form}
          update={update}
          hint="min"
        />
        <NumField
          label={t("Maximum number of articles per feed")}
          field="rss_max_articles_per_feed"
          form={form}
          update={update}
        />
        <CheckField
          label={t("Download REPACK/PROPER episodes")}
          field="rss_download_repack_proper_episodes"
          form={form}
          update={update}
          help={t("help.repack")}
        />
      </CardContent>
    </Card>
  );
}
