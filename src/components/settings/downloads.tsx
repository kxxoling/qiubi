/**
 * Settings section: Downloads (maps to the Downloads page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { Download, FolderCog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, PathField, TextField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

export function DownloadSection({ form, update }: P) {
  const { t } = useTranslation();
  return (
    <>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Download className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("When adding a torrent")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PathField
            label={t("Default Save Path")}
            field="save_path"
            form={form}
            update={update}
            help={t("help.save_path")}
          />
          <CheckField
            label={t("Do not start download automatically")}
            field="add_stopped_enabled"
            form={form}
            update={update}
            help={t("help.add_stopped")}
          />
          <CheckField
            label={t("Copy .torrent files to")}
            field="export_dir_enabled"
            form={form}
            update={update}
            help={t("help.export_dir")}
          />
          {form.export_dir_enabled ? (
            <PathField label="　" field="export_dir" form={form} update={update} />
          ) : null}
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <FolderCog className="mr-1.5 inline size-4 text-muted-foreground" />
            {t("Saving Management")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckField
            label={t("Keep incomplete torrents in")}
            field="temp_path_enabled"
            form={form}
            update={update}
            help={t("help.temp_path")}
          />
          {form.temp_path_enabled ? (
            <PathField label="　" field="temp_path" form={form} update={update} />
          ) : null}
          <CheckField
            label={t("Run external program on torrent completion")}
            field="autorun_enabled"
            form={form}
            update={update}
            help={t("help.autorun")}
          />
          {form.autorun_enabled ? (
            <TextField label="　" field="autorun_program" form={form} update={update} />
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
