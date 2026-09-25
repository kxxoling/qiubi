/**
 * Shared torrent-status filter select (desktop toolbar + mobile drawer).
 *
 * Options carry a lucide icon and a text color matching the state pills used
 * on cards/table rows, so the filter and the data speak the same visual
 * language. The trigger truncates with ellipsis and keeps inner padding so
 * overflowing labels never touch the border.
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
  className,
}: {
  value: string;
  onValueChange: (v: string | null) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const current = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];
  const CurrentIcon = ICONS[current.icon] ?? List;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" className={cn("w-40 gap-1.5", className)} aria-label={t("Status")}>
        <CurrentIcon className={cn("size-3.5 shrink-0", current.color)} />
        {/* Truncate + padding: overflowing labels ellipsize instead of
            touching the chevron/border */}
        <span className="min-w-0 flex-1 truncate pr-1 text-left">{t(current.label)}</span>
      </SelectTrigger>
      <SelectContent>
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
              <span className={cn("min-w-0 flex-1 truncate", o.color)}>{t(o.label)}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
