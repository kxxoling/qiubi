/**
 * Top-level appearance quick toggles (same level as Light/System/Dark)
 *
 * - AppearanceMenu: light/dark/follow-system radio group + color theme dropdown,
 *   trigger is a monitor icon (it's about the whole machine's look)
 * - 19 palettes consistent with the shadcn theme system, each item has a
 *   matching color dot, the active palette is checked
 */
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, type ColorTheme, useAppStore } from "@/stores/app";

/** Color dot for each color theme (Tailwind palette colors close to the theme's primary) */
const THEME_SWATCH: Record<ColorTheme, string> = {
  zinc: "bg-zinc-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
  yellow: "bg-yellow-500",
  solarized: "bg-[#268bd2]",
  catppuccin: "bg-[#89b4fa]",
  nord: "bg-[#88c0d0]",
  rosepine: "bg-[#c4a7e7]",
  gruvbox: "bg-[#fabd2f]",
  moegi: "bg-[#ff8787]",
  dracula: "bg-[#bd93f9]",
};

/**
 * Single appearance menu: Light / Follow system / Dark radio group + color
 * theme group (replaces the old one-item light/dark toggle). The trigger is
 * a monitor icon; hover text explains the whole menu.
 */
export function AppearanceMenu({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const colorTheme = useAppStore((s) => s.colorTheme);
  const setColorTheme = useAppStore((s) => s.setColorTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-7", className)}
            aria-label={t("Appearance: light/dark and color theme")}
            title={t("Appearance: light/dark and color theme")}
          />
        }
      >
        <Monitor className={cn("size-4", iconClassName)} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-44">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
        >
          <DropdownMenuRadioItem value="light">
            <Sun />
            {t("Light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor />
            {t("Follow system")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            {t("Dark")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* Plain label (Base UI's Menu.Label must live inside a group) */}
        <div className="px-2 pt-1.5 pb-1 text-xs text-muted-foreground select-none">
          {t("Color Theme")}
        </div>
        <DropdownMenuRadioGroup
          value={colorTheme}
          onValueChange={(v) => setColorTheme(v as ColorTheme)}
        >
          {COLOR_THEMES.map((name) => (
            <DropdownMenuRadioItem key={name} value={name}>
              <span
                className={cn("size-2.5 shrink-0 rounded-full", THEME_SWATCH[name])}
                aria-hidden="true"
              />
              {t(name)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
