/**
 * Settings section: Behavior (maps to the Behavior page of the qBT options dialog)
 * Field names follow the official qBittorrent Web API preferences keys.
 */
import { MousePointerClick } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useAppStore } from "@/stores/app";
import type { AppPreferences } from "@/types/qbt";
import { CheckField, type FieldUpdater, Row, SelectField } from "./fields";

type P = { form: AppPreferences; update: FieldUpdater };

/** Locale codes qBittorrent itself accepts (locale pref) */
const QBT_LOCALES = [
  "en",
  "en_AU",
  "en_GB",
  "ar",
  "be",
  "bg",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "es",
  "es_AR",
  "et",
  "eu",
  "fa",
  "fi",
  "fr",
  "gl",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "is",
  "it",
  "ja",
  "ka",
  "ko",
  "lt",
  "lv",
  "mk",
  "ms",
  "nb",
  "nl",
  "oc",
  "pl",
  "pt_BR",
  "pt_PT",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "th",
  "tr",
  "uk",
  "uz",
  "vi",
  "zh",
  "zh_TW",
  "zh_HK",
];

const UI_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "ru", label: "Русский" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
] as const;

export function BehaviorSection({ form, update }: P) {
  const { t } = useTranslation();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  return (
    <Card className="transition-all duration-200 hover:border-ring/40 hover:shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MousePointerClick className="mr-1.5 inline size-4 text-muted-foreground" />
          {t("Behavior")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* qiubi UI language (independent from qBT's own locale preference) */}
        <Row label={t("UI Language")}>
          <Select value={locale} onValueChange={(v) => v && setLocale(v as typeof locale)}>
            <SelectTrigger className="w-40" aria-label={t("UI Language")}>
              <span className="truncate">
                {UI_LANGUAGES.find((l) => l.value === locale)?.label ?? locale}
              </span>
            </SelectTrigger>
            <SelectContent>
              {UI_LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <SelectField
          label={t("qBittorrent Language")}
          field="locale"
          form={form}
          update={update}
          options={QBT_LOCALES.map((l) => ({ value: l, label: l }))}
          help={undefined}
        />
        <CheckField
          label={t("Create subfolder for torrents with multiple files")}
          field="create_subfolder_enabled"
          form={form}
          update={update}
          help={t("help.create_subfolder")}
        />
        <SelectField
          label={t("Auto delete mode")}
          field="auto_delete_mode"
          form={form}
          update={update}
          help={t("help.auto_delete_mode")}
          options={[
            { value: 0, label: t("Never remove") },
            { value: 1, label: t("Remove if .torrent file exists") },
          ]}
        />
        <CheckField
          label={t("Pre-allocate disk space")}
          field="preallocate_all"
          form={form}
          update={update}
          help={t("help.preallocate")}
        />
        <CheckField
          label={t("Append .!qB extension to incomplete files")}
          field="incomplete_files_ext"
          form={form}
          update={update}
          help={t("help.incomplete_ext")}
        />
        <CheckField
          label={t("Automatic Torrent Management")}
          field="auto_tmm_enabled"
          form={form}
          update={update}
          help={t("help.auto_tmm")}
        />
      </CardContent>
    </Card>
  );
}
