/**
 * Shared torrent-status filter select (desktop toolbar + mobile drawer).
 *
 * Options carry a lucide icon and a text color matching the state pills used
 * on cards/table rows, so the filter and the data speak the same visual
 * language. When `counts` is provided (official-UI behavior), every option
 * shows that status's torrent count, and the trigger repeats the selected
 * status's count. The count renders in its own sibling element after the
 * label — only the label truncates, so long labels or big numbers never
 * ellipsize the number away.
 */
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleCheck,
  Hourglass,
  List,
  type LucideIcon,
  Moon,
  Pause,
  Play,
  ScanLine,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { STATUS_OPTIONS } from "@/lib/torrentStatus";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  list: List,
  "arrow-down-to-line": ArrowDownToLine,
  "arrow-up-from-line": ArrowUpFromLine,
  "circle-check": CircleCheck,
  play: Play,
  pause: Pause,
  zap: Zap,
  moon: Moon,
  "scan-line": ScanLine,
  hourglass: Hourglass,
  "triangle-alert": TriangleAlert,
};

export function StatusSelect({
  value,
  onValueChange,
  counts,
  className,
}: {
  value: string;
  onValueChange: (v: string | null) => void;
  /** Per-status torrent counts (statusCounts()); omit to hide numbers */
  counts?: Record<string, number>;
  className?: string;
}) {
  const { t } = useTranslation();
  const current = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];
  const CurrentIcon = ICONS[current.icon] ?? List;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className={cn("w-40 gap-1.5", className)} aria-label={t("Status")}>
        <CurrentIcon className={cn("size-3.5 shrink-0", current.color)} />
        {/* Only the label truncates; the count is a sibling element that hugs
            the label (natural width, no flex-1), and a flex-1 spacer keeps
            the chevron pinned to the right edge */}
        <span className="min-w-0 truncate text-left">{t(current.label)}</span>
        {counts?.[current.value] !== undefined && <CountSpan n={counts[current.value]} />}
        <span className="min-w-0 flex-1" aria-hidden />
      </SelectTrigger>
      <SelectContent className="w-56">
        {STATUS_OPTIONS.map((o) => {
          const Icon = ICONS[o.icon] ?? List;
          // ItemText's stock `shrink-0` stops flex shrinking, so long labels
          // run into the right edge — override from here instead of editing
          // the shared ui/ component
          return (
            <SelectItem
              key={o.value}
              value={o.value}
              className="[&>*]:min-w-0 [&>*]:shrink [&>*]:overflow-hidden [&>*]:text-ellipsis [&>*]:items-center"
            >
              <Icon className={cn("size-3.5 shrink-0", o.color)} />
              <span className={cn("min-w-0 truncate", o.color)}>{t(o.label)}</span>
              {counts?.[o.value] !== undefined && <CountSpan n={counts[o.value]} />}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/** The count element: a sibling of the label so label-truncation can never
 *  reach it. The leading space inside keeps the accessible name
 *  ("Seeding (1)") intact — JSX drops whitespace between adjacent nodes. */
function CountSpan({ n }: { n: number }) {
  return <span className="shrink-0! text-xs text-muted-foreground tabular-nums"> ({n})</span>;
}
