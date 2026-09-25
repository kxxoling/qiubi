/**
 * Top menu bar —— aligned with the qBittorrent native layout
 *
 * File / Edit / View / Tools / Help, composed from the existing DropdownMenu (Base UI),
 * reducing the learning curve for longtime qBT users. Menu items map one-to-one to the qBT desktop version wherever possible.
 */

import { useNavigate } from "@tanstack/react-router";
import { Info, LogOut, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { AboutDialog } from "@/components/layout/AboutDialog";
import { AppearanceMenu } from "@/components/layout/ThemeToggle";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAltSpeed } from "@/hooks/useAltSpeed";
import { logError } from "@/lib/errorLog";
import { COLOR_THEMES, type ColorTheme, useAppStore } from "@/stores/app";
import { clearSavedAuth } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

/**
 * A single menu title + dropdown content —— desktop menu bar semantics:
 * open on hover (120ms delay to avoid accidental triggers); when a menu is already open, sliding across an adjacent title switches immediately;
 * auto-collapse 200ms after the pointer leaves the title/menu; click/keyboard behavior stays unchanged.
 * (The openMenu state is held by MenuBar as a whole, ensuring "only one menu open at a time")
 */
function Menu({
  id,
  label,
  openMenu,
  setOpenMenu,
  children,
}: {
  id: string;
  label: string;
  openMenu: string | null;
  setOpenMenu: React.Dispatch<React.SetStateAction<string | null>>;
  children: React.ReactNode;
}) {
  const open = openMenu === id;
  const openTimer = useRef<number>(0);
  const closeTimer = useRef<number>(0);
  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(o) => {
        clearTimers();
        setOpenMenu(o ? id : (cur) => (cur === id ? null : cur));
      }}
    >
      <DropdownMenuTrigger
        className="rounded px-2.5 py-0.5 text-sm outline-none select-none data-open:bg-accent focus-visible:ring-1 focus-visible:ring-ring"
        onMouseEnter={() => {
          if (open) return;
          clearTimers();
          if (openMenu) {
            // A menu is already open → switch on slide-over (desktop menu bar behavior)
            setOpenMenu(id);
          } else {
            openTimer.current = window.setTimeout(() => setOpenMenu(id), 120);
          }
        }}
        onMouseLeave={() => {
          // Leaving the title: cancel the pending-open timer and start the collapse grace period (cancelled if the pointer enters the menu body)
          window.clearTimeout(openTimer.current);
          closeTimer.current = window.setTimeout(
            () => setOpenMenu((cur) => (cur === id ? null : cur)),
            200,
          );
        }}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={2}
        className="min-w-44"
        onMouseEnter={() => window.clearTimeout(closeTimer.current)}
        onMouseLeave={() => {
          closeTimer.current = window.setTimeout(
            () => setOpenMenu((cur) => (cur === id ? null : cur)),
            200,
          );
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenuBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  /** Currently open menu (id = File/Edit/...), only one open at a time */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { theme, setTheme, colorTheme, setColorTheme } = useAppStore();
  const { sidebarVisible, statusBarVisible, toggleSidebar, toggleStatusBar } = useUiStore();

  const pauseAll = async () => {
    try {
      await qbtClient.pauseTorrents(["all"]);
      toast.success(t("Pause All"));
    } catch (e) {
      logError("ui", e, "pauseTorrents(all) failed");
      toast.error(t("Something went wrong"), {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };
  const resumeAll = async () => {
    try {
      await qbtClient.resumeTorrents(["all"]);
      toast.success(t("Resume All"));
    } catch (e) {
      logError("ui", e, "resumeTorrents(all) failed");
      toast.error(t("Something went wrong"), {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };
  const { toggleAltSpeed } = useAltSpeed();
  const logout = async () => {
    // Also clear remembered credentials on logout, otherwise the login page would immediately auto-reconnect and logging out would be pointless
    clearSavedAuth();
    await qbtClient.logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b bg-card px-2">
      {/* File */}
      <Menu id="File" label={t("File")} openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <DropdownMenuItem onClick={() => openAddTorrentDialog()}>
          <Plus />
          {t("Add Torrent...")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          {t("Logout")}
        </DropdownMenuItem>
      </Menu>

      {/* Edit */}
      <Menu id="Edit" label={t("Edit")} openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <DropdownMenuItem onClick={pauseAll}>{t("Pause All")}</DropdownMenuItem>
        <DropdownMenuItem onClick={resumeAll}>{t("Resume All")}</DropdownMenuItem>
      </Menu>

      {/* View */}
      <Menu id="View" label={t("View")} openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <DropdownMenuCheckboxItem checked={sidebarVisible} onCheckedChange={toggleSidebar}>
          {t("Show Filter Sidebar")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={statusBarVisible} onCheckedChange={toggleStatusBar}>
          {t("Show Status Bar")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={theme === "dark"}
          onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {t("Dark Theme")}
        </DropdownMenuCheckboxItem>
        {/* Color theme: orthogonal to Dark/Light; each palette has both dark and light variants */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t("Color Theme")}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={colorTheme}
              onValueChange={(v) => setColorTheme(v as ColorTheme)}
            >
              {COLOR_THEMES.map((name) => (
                <DropdownMenuRadioItem key={name} value={name}>
                  {t(name)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
          {t("Speed Statistics")}
        </DropdownMenuItem>
      </Menu>

      {/* Tools */}
      <Menu id="Tools" label={t("Tools")} openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <DropdownMenuItem onClick={() => navigate({ to: "/search" })}>
          {t("Search")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/rss" })}>{t("RSS")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/categories" })}>
          {t("Manage Categories")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleAltSpeed}>{t("Toggle Alt Speed")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/log" })}>
          {t("Execution Log")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          {t("Options")}
        </DropdownMenuItem>
      </Menu>

      {/* Help: keep only About (qiubi/qBT version + project links) */}
      <Menu id="Help" label={t("Help")} openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <DropdownMenuItem onClick={() => setAboutOpen(true)}>
          <Info />
          {t("About")}
        </DropdownMenuItem>
      </Menu>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Right end: single appearance menu (light/dark + color theme) */}
      <div className="ml-auto flex items-center gap-0.5">
        <AppearanceMenu />
      </div>
    </div>
  );
}
