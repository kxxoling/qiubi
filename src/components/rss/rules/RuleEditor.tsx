import { useQuery } from "@tanstack/react-query";
import { Calendar, FolderOpen, Tag, Zap } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { RssAutoDownloadingRule } from "@/types/qbt";

interface RuleEditorProps {
  feedNames: string[];
  draft: RssAutoDownloadingRule;
  newName: string;
  selectedName: string | null;
  onUpdate: (patch: Partial<RssAutoDownloadingRule>) => void;
  onNewNameChange: (value: string) => void;
  onSave: () => void;
}

/** Right column: full edit form for the selected rule (match rules / feeds / save settings) */
export function RuleEditor({
  feedNames,
  draft,
  newName,
  selectedName,
  onUpdate,
  onNewNameChange,
  onSave,
}: RuleEditorProps) {
  const { t } = useTranslation();
  const catListId = useId();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => qbtClient.getCategories(),
    staleTime: 30_000,
  });

  const toggleFeed = (url: string) => {
    onUpdate({
      affectedFeeds: draft.affectedFeeds.includes(url)
        ? draft.affectedFeeds.filter((f) => f !== url)
        : [...draft.affectedFeeds, url],
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {/* Rule name */}
        <div className="space-y-1.5">
          <label htmlFor="rule-name" className="text-xs font-medium text-muted-foreground">
            {t("Rule Name")}
          </label>
          <Input
            id="rule-name"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder={t("Rule Name")}
            disabled={!!selectedName}
          />
        </div>

        {/* Enabled */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="rule-enabled"
            checked={draft.enabled}
            onCheckedChange={(v) => onUpdate({ enabled: v === true })}
          />
          <label htmlFor="rule-enabled" className="cursor-pointer text-sm">
            {t("Enabled")}
          </label>
        </div>

        <Separator />

        {/* ── Match rules ── */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <Zap className="size-3.5 text-muted-foreground" />
            {t("Match Rules")}
          </h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="rule-must" className="text-xs text-muted-foreground">
                {t("Must Contain")}
              </label>
              <Input
                id="rule-must"
                value={draft.mustContain}
                onChange={(e) => onUpdate({ mustContain: e.target.value })}
                placeholder={draft.useRegex ? "S\\d+E\\d+" : "1080p"}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rule-not" className="text-xs text-muted-foreground">
                {t("Must Not Contain")}
              </label>
              <Input
                id="rule-not"
                value={draft.mustNotContain}
                onChange={(e) => onUpdate({ mustNotContain: e.target.value })}
                placeholder="720p"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="rule-episode" className="text-xs text-muted-foreground">
                {t("Episode Filter")}
              </label>
              <Input
                id="rule-episode"
                value={draft.episodeFilter}
                onChange={(e) => onUpdate({ episodeFilter: e.target.value })}
                placeholder="S01E01-S01E12"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("e.g. S01E01-S01E12, S01E01-S01E12E2, ...")}
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rule-ignore" className="text-xs text-muted-foreground">
                {t("Ignore Days")}
              </label>
              <Input
                id="rule-ignore"
                type="number"
                min={0}
                value={draft.ignoreDays}
                onChange={(e) => onUpdate({ ignoreDays: Number.parseInt(e.target.value, 10) || 0 })}
              />
              <p className="text-[11px] text-muted-foreground">
                {t("Skip articles published within N days")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rule-regex"
                checked={draft.useRegex}
                onCheckedChange={(v) => onUpdate({ useRegex: v === true })}
              />
              <label htmlFor="rule-regex" className="cursor-pointer text-xs">
                {t("Use Regex")}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="rule-smart"
                checked={draft.smartFilter}
                onCheckedChange={(v) => onUpdate({ smartFilter: v === true })}
              />
              <label htmlFor="rule-smart" className="cursor-pointer text-xs">
                {t("Smart Filter")}
              </label>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Affected feeds ── */}
        <section className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="size-3.5 text-muted-foreground" />
            {t("Affected Feeds")}
          </h4>
          {feedNames.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("No feeds")}</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {feedNames.map((name) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={draft.affectedFeeds.includes(name)}
                    onCheckedChange={() => toggleFeed(name)}
                  />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {t("Leave empty to apply to all feeds")}
          </p>
        </section>

        <Separator />

        {/* ── Save settings ── */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold">
            <FolderOpen className="size-3.5 text-muted-foreground" />
            {t("Save Settings")}
          </h4>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="rule-cat"
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Tag className="size-3" />
                {t("Category")}
              </label>
              <Input
                id="rule-cat"
                list={catListId}
                value={draft.assignedCategory}
                onChange={(e) => onUpdate({ assignedCategory: e.target.value })}
                placeholder={t("Category")}
              />
              <datalist id={catListId}>
                {(categories ?? []).map((c) => (
                  <option key={c.name} value={c.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rule-path" className="text-xs text-muted-foreground">
                {t("Save Path")}
              </label>
              <Input
                id="rule-path"
                value={draft.savePath}
                onChange={(e) => onUpdate({ savePath: e.target.value })}
                placeholder="/downloads"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="rule-paused"
              checked={draft.addPaused}
              onCheckedChange={(v) => onUpdate({ addPaused: v === true })}
            />
            <label htmlFor="rule-paused" className="cursor-pointer text-xs">
              {t("Add Paused")}
            </label>
          </div>
        </section>
      </div>

      {/* Bottom save bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-background px-5 py-3">
        <Button size="sm" onClick={onSave} disabled={!newName.trim()}>
          {t("Save")}
        </Button>
      </div>
    </div>
  );
}
