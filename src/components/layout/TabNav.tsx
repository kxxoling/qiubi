/**
 * Global tab navigation —— same as the official qBT Web UI
 *
 * Transfers / Search / RSS / Execution Log / Settings: five peer-level tabs,
 * always visible, current page highlighted, click to switch (URL-driven).
 * Left end: global search (⌘K); right end: add torrent (⌘J, with text + shortcut hint).
 * Style: underline tabs (consistent with the detail panel tabs).
 */
import { Link, useLocation } from "@tanstack/react-router";
import { Download, Logs, Plus, Rss, Search, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { openCommandPalette } from "@/components/CommandPalette";
import { Shortcut } from "@/components/Shortcut";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", icon: Download, labelKey: "Torrents" },
  { to: "/search", icon: Search, labelKey: "Search" },
  { to: "/rss", icon: Rss, labelKey: "RSS" },
  { to: "/log", icon: Logs, labelKey: "Execution Log" },
  { to: "/settings", icon: Settings, labelKey: "Settings" },
] as const;

export function TabNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="flex h-11 shrink-0 items-center gap-0 border-b bg-card px-2">
      {/* Left end: tab pages */}
      {TABS.map((tab) => {
        const isActive =
          tab.to === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "relative flex h-full shrink-0 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors",
              isActive
                ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="size-3.5" />
            {t(tab.labelKey)}
          </Link>
        );
      })}

      {/* Dead center of the middle gap: global search (equal-width flex spacers on both sides) */}
      <div className="min-w-4 flex-1" />
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 gap-1.5 text-muted-foreground"
        onClick={openCommandPalette}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">{t("Global Search")}</span>
        <Shortcut keys={["meta", "k"]} />
      </Button>
      <div className="min-w-4 flex-1" />

      {/* Right end: add torrent (text + hover shortcut hint) */}
      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => openAddTorrentDialog()}
              />
            }
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">{t("Add Torrent")}</span>
          </TooltipTrigger>
          <TooltipContent>
            <span>{t("Add Torrent")}</span>
            <Shortcut keys={["meta", "j"]} className="ml-1.5" />
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
