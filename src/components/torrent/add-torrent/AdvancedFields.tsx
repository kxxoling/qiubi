/**
 * Collapsible advanced section of the add-torrent dialog: rename / cookie /
 * speed & ratio limits and the download option checkboxes.
 */
import { ChevronDown, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { AddTorrentForm, SetFormField } from "./form";

export type AdvancedFieldsProps = {
  form: AddTorrentForm;
  set: SetFormField;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
};

export function AdvancedFields({
  form: f,
  set,
  showAdvanced,
  onToggleAdvanced,
}: AdvancedFieldsProps) {
  const { t } = useTranslation();

  const numField = (
    key: "dlLimit" | "upLimit" | "ratioLimit" | "seedingTimeLimit",
    label: string,
    placeholder: string,
    suffix?: string,
  ) => (
    <div className="space-y-1">
      <label htmlFor={`adv-${key}`} className="text-xs text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={`adv-${key}`}
          type="number"
          min={0}
          value={f[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
          className="pr-10 text-xs"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  const checkField = (key: keyof AddTorrentForm, label: string) => (
    <div className="flex cursor-pointer items-center gap-2">
      <Checkbox
        id={`chk-${String(key)}`}
        checked={f[key] as boolean}
        onCheckedChange={(v) => set(key, v === true)}
      />
      <label htmlFor={`chk-${String(key)}`} className="cursor-pointer text-xs">
        {label}
      </label>
    </div>
  );

  return (
    <>
      {/* ── Advanced (collapsible) toggle ── */}
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="mt-3 flex w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Settings2 className="size-3.5" />
        {t("Advanced")}
        <ChevronDown
          className={`ml-auto size-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
        />
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-3 rounded-md border p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="adv-rename" className="text-xs text-muted-foreground">
                {t("Rename")}
              </label>
              <Input
                id="adv-rename"
                value={f.rename}
                onChange={(e) => set("rename", e.target.value)}
                placeholder={t("Original name")}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="adv-cookie" className="text-xs text-muted-foreground">
                {t("Cookie")}
              </label>
              <Input
                id="adv-cookie"
                value={f.cookie}
                onChange={(e) => set("cookie", e.target.value)}
                placeholder="uid=…;pass=…"
                className="font-mono text-xs"
              />
            </div>

            {numField("dlLimit", t("Download Limit"), "0", "KiB/s")}
            {numField("upLimit", t("Upload Limit"), "0", "KiB/s")}
            {numField("ratioLimit", t("Share Ratio Limit"), "—")}
            {numField("seedingTimeLimit", t("Seeding Time Limit"), "—", "min")}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {checkField("rootFolder", t("Create subfolder"))}
            {checkField("sequential", t("Sequential Download"))}
            {checkField("firstLast", t("First/Last Priority"))}
            {checkField("skipChecking", t("Skip hash check"))}
            {checkField("autoTMM", t("Automatic Torrent Management"))}
            {checkField("paused", t("Pause"))}
          </div>
        </div>
      )}
    </>
  );
}
