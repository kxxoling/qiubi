import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Gauge,
  Globe,
  type LucideIcon,
  Magnet,
  MousePointerClick,
  Network,
  Rss,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import {
  AdvancedSection,
  BehaviorSection,
  BitTorrentSection,
  ConnectionSection,
  DownloadSection,
  RssSection,
  SpeedSection,
  WebUiSection,
} from "@/components/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppPreferences } from "@/types/qbt";

/**
 * Settings page — aligned with the official qBittorrent WebUI sections
 *
 * Behavior/Downloads/Connection/Speed/BitTorrent/RSS/Web UI/Advanced, with a vertical left nav.
 * On save, only fields that differ from the initial values are submitted; an empty password is not submitted.
 * Section components live in components/settings/; fields map to the official Web API preference keys.
 */

type Section =
  | "behavior"
  | "downloads"
  | "connection"
  | "speed"
  | "bittorrent"
  | "rss"
  | "webui"
  | "advanced";

const SECTIONS: { id: Section; labelKey: string; icon: LucideIcon }[] = [
  { id: "behavior", labelKey: "Behavior", icon: MousePointerClick },
  { id: "downloads", labelKey: "Downloads", icon: Download },
  { id: "connection", labelKey: "Connection", icon: Network },
  { id: "speed", labelKey: "Speed", icon: Gauge },
  { id: "bittorrent", labelKey: "BitTorrent", icon: Magnet },
  { id: "rss", labelKey: "RSS", icon: Rss },
  { id: "webui", labelKey: "Web UI", icon: Globe },
  { id: "advanced", labelKey: "Advanced", icon: Wrench },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("behavior");
  const [saving, setSaving] = useState(false);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => qbtClient.getPreferences(),
  });

  const [form, setForm] = useState<AppPreferences>({});

  // Merge 4.x start_paused_enabled into the 5.x add_stopped_enabled semantics
  useEffect(() => {
    if (prefs && Object.keys(form).length === 0) {
      const { web_ui_password: _pw, ...rest } = prefs;
      setForm({
        ...rest,
        add_stopped_enabled: prefs.add_stopped_enabled ?? prefs.start_paused_enabled,
      });
    }
  }, [prefs, form]);

  const update = (key: keyof AppPreferences, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const changed: AppPreferences = {};
      for (const [k, v] of Object.entries(form)) {
        if (prefs && v !== prefs[k]) changed[k] = v;
      }
      if (form.web_ui_password) changed.web_ui_password = form.web_ui_password;
      if (Object.keys(changed).length > 0) {
        await qbtClient.setPreferences(changed);
        await qc.invalidateQueries({ queryKey: ["preferences"] });
        toast.success(t("Settings saved"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">{t("Connecting...")}</div>;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-6">
      {/* Section nav: sticky vertical left column on desktop (stays in view
          while the long right column scrolls), horizontally scrollable strip on mobile */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:sticky md:top-0 md:block md:h-fit md:w-40 md:shrink-0 md:space-y-1 md:self-start md:overflow-visible md:pb-0">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all md:w-full md:text-left",
              section === s.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <s.icon
              className={cn(
                "size-4 shrink-0 transition-transform group-hover:scale-110",
                section === s.id ? "text-primary" : "text-muted-foreground/70",
              )}
            />
            {t(s.labelKey)}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-4 md:min-h-0 md:overflow-y-auto md:pr-1">
        <h2 className="text-2xl font-bold tracking-tight">{t("Settings")}</h2>

        {section === "behavior" && <BehaviorSection form={form} update={update} />}
        {section === "downloads" && <DownloadSection form={form} update={update} />}
        {section === "connection" && <ConnectionSection form={form} update={update} />}
        {section === "speed" && <SpeedSection form={form} update={update} />}
        {section === "bittorrent" && <BitTorrentSection form={form} update={update} />}
        {section === "rss" && <RssSection form={form} update={update} />}
        {section === "webui" && <WebUiSection form={form} update={update} />}
        {section === "advanced" && <AdvancedSection form={form} update={update} />}

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? t("Connecting...") : t("Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
