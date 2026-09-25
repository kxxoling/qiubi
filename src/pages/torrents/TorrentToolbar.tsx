/**
 * Torrent list toolbar: status filter select + keyword input (left),
 * scoped pause/resume + delete (right, hover shows scope explanation).
 */
import { Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatusSelect } from "@/components/torrent/StatusSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TorrentToolbar({
  status,
  onStatusChange,
  search,
  onSearchChange,
  selectedCount,
  onPauseAll,
  onResumeAll,
  onDelete,
}: {
  status: string;
  onStatusChange: (v: string | null) => void;
  search: string;
  onSearchChange: (v: string) => void;
  selectedCount: number;
  /** Scoped: selection if any, otherwise everything matching current filters */
  onPauseAll: () => void;
  onResumeAll: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <StatusSelect value={status} onValueChange={onStatusChange} />
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`${t("Filter")}...`}
        className="w-48"
      />
      {/* Pause/resume: scope follows selection — none selected = everything
          matching current filters, selected = only the selection (hover explains) */}
      <div className="ml-auto flex items-center gap-1">
        {selectedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedCount} {t("selected")}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" onClick={onPauseAll} />}>
            <Pause className="mr-1 h-3.5 w-3.5" />
            {selectedCount ? t("Pause") : t("Pause All")}
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{t("help.scope_pause_resume")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" onClick={onResumeAll} />}>
            <Play className="mr-1 h-3.5 w-3.5" />
            {selectedCount ? t("Resume") : t("Resume All")}
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{t("help.scope_pause_resume")}</TooltipContent>
        </Tooltip>
        {/* Always rendered (disabled when empty): the button appearing on
            selection caused a layout jump that could cancel an in-progress
            long-press on mobile */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="disabled:pointer-events-auto disabled:opacity-40"
        >
          {t("Delete")}
        </Button>
      </div>
    </div>
  );
}
