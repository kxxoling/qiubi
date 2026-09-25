/**
 * Shared field components for the settings forms
 *
 * Unifies form control styling across all sections, keeping Section components declarative and compact.
 * Complex fields attach HelpTip via the help prop (⺺ icon), showing beginner-friendly explanations on hover,
 * with wording based on the official qBittorrent documentation.
 */
import { CircleHelp, FolderOpen } from "lucide-react";
import { type ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AppPreferences } from "@/types/qbt";

export type FieldUpdater = (key: keyof AppPreferences, value: unknown) => void;

/** Small field-info icon: show the explanation on hover/keyboard focus/mobile tap */
export function HelpTip({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        /* Base UI defaults to a 600ms delay, barely noticeable when sweeping the mouse; lower it to 150ms */
        delay={150}
        render={
          <button
            type="button"
            /* aria-label must be short: using the whole explanation as the name pollutes the accessibility tree (screen readers/selectors would hit it) */
            aria-label={t("What is this?")}
            className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        }
      >
        <CircleHelp className="size-4" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-72 text-left text-xs leading-relaxed whitespace-normal"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function Row({
  label,
  children,
  hint,
  help,
  inset,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  help?: string;
  /** Sits inside a pl-6 sub-option block: shrink the label column by 24px to offset the container indent, keeping controls on the same axis */
  inset?: boolean;
}) {
  return (
    /* Fluid single line: label takes its natural width and the control fills
       the rest; only when the control can't keep a usable minimum (min-w-40)
       does it wrap below as a whole — no more label-owns-a-line stacking
       between the sm/md breakpoints. At md+ the label column is fixed again
       so all controls share one axis. */
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 text-sm text-muted-foreground",
          inset ? "md:w-[12.5rem]" : "md:w-56",
        )}
      >
        {label}
        {help && <HelpTip text={help} />}
      </div>
      {/* hint (unit/description) follows the control as a suffix, left-aligned; no longer pushed to the row end */}
      <div className="flex min-w-40 flex-1 flex-wrap items-center gap-2">
        {children}
        {hint && <span className="text-xs whitespace-nowrap text-muted-foreground/70">{hint}</span>}
      </div>
    </div>
  );
}

export function TextField({
  label,
  field,
  form,
  update,
  placeholder,
  type = "text",
  help,
  inset,
  datalist,
}: {
  label: string;
  field: keyof AppPreferences;
  form: AppPreferences;
  update: FieldUpdater;
  placeholder?: string;
  type?: string;
  help?: string;
  inset?: boolean;
  /** Selectable suggestions (still freely typeable) — for fields whose
      format users can't guess (bind addresses, interface names…) */
  datalist?: string[];
}) {
  const listId = useId();
  return (
    <Row label={label} help={help} inset={inset}>
      <Input
        type={type}
        /* Fixed sensible width: full-bleed inputs get absurdly long on wide
           screens (paths keep full width via PathField, which wants it) */
        className="w-72 max-w-full"
        list={datalist ? listId : undefined}
        value={String(form[field] ?? "")}
        placeholder={placeholder}
        onChange={(e) => update(field, type === "number" ? Number(e.target.value) : e.target.value)}
      />
      {datalist && (
        <datalist id={listId}>
          {datalist.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
    </Row>
  );
}

export function NumField({
  label,
  field,
  form,
  update,
  min,
  max,
  step,
  hint,
  className,
  help,
  inset,
}: {
  label: string;
  field: keyof AppPreferences;
  form: AppPreferences;
  update: FieldUpdater;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  className?: string;
  help?: string;
  inset?: boolean;
}) {
  return (
    <Row label={label} hint={hint} help={help} inset={inset}>
      <Input
        type="number"
        className={cn("w-32", className)}
        value={form[field] === undefined || form[field] === null ? "" : String(form[field])}
        min={min}
        max={max}
        step={step}
        onChange={(e) => update(field, Number(e.target.value))}
      />
    </Row>
  );
}

export function CheckField({
  label,
  field,
  form,
  update,
  help,
}: {
  label: string;
  field: keyof AppPreferences;
  form: AppPreferences;
  update: FieldUpdater;
  help?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        /* items-start keeps the box on the FIRST line when the label wraps;
           mt-0.5 (2px) then centers it in that line: (20px leading − 16px box) / 2.
           CJK labels made the old top-alignment obvious. */
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={!!form[field]}
        onChange={(e) => update(field, e.target.checked)}
      />
      <span className="flex flex-wrap items-center gap-1">
        {label}
        {help && <HelpTip text={help} />}
      </span>
    </label>
  );
}

export function SelectField({
  label,
  field,
  form,
  update,
  options,
  help,
  inset,
}: {
  label: string;
  field: keyof AppPreferences;
  form: AppPreferences;
  update: FieldUpdater;
  options: { value: number | string; label: string }[];
  help?: string;
  inset?: boolean;
}) {
  return (
    <Row label={label} help={help} inset={inset}>
      <select
        className="h-9 min-w-40 rounded-md border bg-background px-3 text-sm"
        value={String(form[field] ?? "")}
        onChange={(e) =>
          update(
            field,
            typeof options[0]?.value === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
}

/**
 * Filesystem path input (server-side paths: save dir, temp dir, export dir…).
 *
 * Standalone on purpose: path entry will get its own UX later (browse the
 * server's directories, autocomplete, existence hints) — everything path-
 * related should flow through this component so the redesign lands in one
 * place. Visual: folder affordance + monospace so paths read as paths.
 */
export function PathInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-40 flex-1", className)}>
      <FolderOpen
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60"
      />
      <Input
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        className="w-full pl-8 font-mono text-[13px]"
      />
    </div>
  );
}

/** Settings row for a filesystem path preference (see PathInput) */
export function PathField({
  label,
  field,
  form,
  update,
  placeholder,
  help,
  inset,
}: {
  label: string;
  field: keyof AppPreferences;
  form: AppPreferences;
  update: FieldUpdater;
  placeholder?: string;
  help?: string;
  inset?: boolean;
}) {
  return (
    <Row label={label} help={help} inset={inset}>
      <PathInput
        ariaLabel={label}
        value={String(form[field] ?? "")}
        placeholder={placeholder}
        onChange={(v) => update(field, v)}
      />
    </Row>
  );
}
