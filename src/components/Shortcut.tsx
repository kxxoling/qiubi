/**
 * Keyboard shortcut hint: one Kbd chip per key with comfortable spacing.
 *
 * Rules (matching desktop-app conventions):
 * - Letters are always lowercase so nobody reads "N" as "switch to
 *   uppercase input" — the hotkey itself matches lowercase keys.
 * - "meta" is platform-aware: ⌘ on macOS, Ctrl elsewhere; "shift"/"alt"/
 *   "ctrl" render as symbols on macOS and words elsewhere.
 * - Modifier symbols (⇧⌘⌥⌃) render optically smaller than letters at the
 *   same font size, so symbol chips get a slightly larger font to match.
 */
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

/** macOS replacement glyphs for modifier/special keys */
const MAC_SYMBOLS: Record<string, string> = {
  meta: "⌘",
  shift: "⇧",
  alt: "⌥",
  ctrl: "⌃",
  enter: "↩",
};

export function Shortcut({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1", className)} data-slot="shortcut">
      {keys.map((raw, i) => {
        const key = raw.toLowerCase();
        const label = isMac ? (MAC_SYMBOLS[key] ?? key) : key === "meta" ? "ctrl" : key;
        const isSymbol = isMac && key in MAC_SYMBOLS;
        return (
          <Kbd key={`${key}-${i}`} className={isSymbol ? "text-[11.5px] leading-none" : undefined}>
            {label}
          </Kbd>
        );
      })}
    </span>
  );
}
