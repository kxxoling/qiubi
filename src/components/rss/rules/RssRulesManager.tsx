/**
 * RSS auto-download rules manager (master–detail core, no container chrome).
 *
 * Rendered by the /rss/rules page: a drawer was too cramped for the editor,
 * so the page owns the layout and this component owns the logic —
 * - Left: rule list (click to select, create at the bottom, delete on hover)
 * - Right: full edit form for the selected rule (RuleEditor)
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RssAutoDownloadingRule } from "@/types/qbt";
import { RuleEditor } from "./RuleEditor";

export function emptyRule(): RssAutoDownloadingRule {
  return {
    enabled: true,
    mustContain: "",
    mustNotContain: "",
    useRegex: false,
    episodeFilter: "",
    smartFilter: false,
    previouslyMatchedEpisodes: [],
    affectedFeeds: [],
    ignoreDays: 0,
    lastMatch: "",
    addPaused: false,
    assignedCategory: "",
    savePath: "",
  };
}

export function RssRulesManager({ feedNames }: { feedNames: string[] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [draft, setDraft] = useState<RssAutoDownloadingRule>(emptyRule());
  const [newName, setNewName] = useState("");

  const { data: rules } = useQuery({
    queryKey: ["rss-rules"],
    queryFn: () => qbtClient.getRssRules(),
  });
  const ruleEntries = rules ? Object.entries(rules) : [];

  // Load the selected rule into the draft
  useEffect(() => {
    if (selectedName && rules?.[selectedName]) {
      setDraft({ ...rules[selectedName] });
      setNewName(selectedName);
    } else if (!selectedName) {
      setDraft(emptyRule());
      setNewName("");
    }
  }, [selectedName, rules]);

  const update = (patch: Partial<RssAutoDownloadingRule>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await qbtClient.setRssRule(name, draft);
      toast.success(t("Saved"));
      await qc.invalidateQueries({ queryKey: ["rss-rules"] });
      setSelectedName(name);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await qbtClient.removeRssRule(name);
      toast.success(t("Deleted"));
      if (selectedName === name) setSelectedName(null);
      await qc.invalidateQueries({ queryKey: ["rss-rules"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const startNew = () => {
    setSelectedName(null);
    setDraft(emptyRule());
    setNewName("");
  };

  const ruleList = (
    <>
      {ruleEntries.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">{t("No rules")}</div>
      ) : (
        ruleEntries.map(([name, rule]) => (
          <div
            key={name}
            className={cn(
              "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
              selectedName === name ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
            )}
            onClick={() => setSelectedName(name)}
          >
            <Filter className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {!rule.enabled && (
              <Badge variant="secondary" className="px-1 text-[9px]">
                off
              </Badge>
            )}
            <button
              type="button"
              aria-label={t("Delete rule confirm", { name })}
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(name);
              }}
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))
      )}
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      {/* ── Left: rule list (a card column on desktop, a compact strip on mobile) ── */}
      <div className="flex min-h-0 shrink-0 flex-col rounded-lg border bg-card md:w-60">
        <div className="hidden min-h-0 flex-1 overflow-y-auto p-2 md:block">{ruleList}</div>
        {/* mobile: horizontal chips instead of the column */}
        <div className="flex gap-2 overflow-x-auto p-2 md:hidden">
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-md border px-2 py-1 text-xs"
          >
            <Plus className="mr-1 inline size-3" />
            {t("New Rule")}
          </button>
          {ruleEntries.map(([name, rule]) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedName(name)}
              className={cn(
                "max-w-40 shrink-0 truncate rounded-md border px-2 py-1 text-xs",
                selectedName === name ? "border-primary text-primary" : "text-muted-foreground",
                !rule.enabled && "opacity-50",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="hidden shrink-0 border-t p-2 md:block">
          <Button size="sm" variant="outline" className="w-full" onClick={startNew}>
            <Plus className="mr-1 size-3.5" />
            {t("New Rule")}
          </Button>
        </div>
      </div>

      {/* ── Right: edit form ── */}
      <RuleEditor
        feedNames={feedNames}
        draft={draft}
        newName={newName}
        selectedName={selectedName}
        onUpdate={update}
        onNewNameChange={setNewName}
        onSave={handleSave}
      />
    </div>
  );
}
