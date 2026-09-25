/**
 * Global command palette (⌘K) — prefix command system.
 *
 * Prefixes (parsed in ./searchMode):
 *   /xxx quick commands (actions), #xxx online torrent search, @xxx local
 *   torrents, >xxx page navigation, bare input = mixed mode (everything).
 *
 * Each mode has a different result structure and rendering; the bottom is a
 * dynamic status bar: current mode hint + result count + prefix legend.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardPaste,
  Download,
  Languages,
  Moon,
  Plus,
  Search as SearchIcon,
  Server,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAltSpeed } from "@/hooks/useAltSpeed";
import { useTorrentList } from "@/hooks/useMainDataSync";
import { COLOR_THEMES, useAppStore } from "@/stores/app";
import { useUiStore } from "@/stores/ui";
import type { TorrentInfo } from "@/types/qbt";
import { PaletteFooter } from "./footer";
import { LocalTorrentsSection } from "./localTorrents";
import {
  buildCommandItems,
  buildNavItems,
  CommandSection,
  LANGUAGES,
  NavSection,
} from "./pageActions";
import { parseMode } from "./searchMode";

// Palette open state is lifted to module level so useGlobalHotkeys can control it
let setOpenExternal: ((open: boolean) => void) | null = null;

/** Open the command palette from the outside */
export function openCommandPalette() {
  setOpenExternal?.(true);
}

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, setTheme, colorTheme, setColorTheme, locale, setLocale } = useAppStore();
  const {
    sidebarVisible,
    statusBarVisible,
    toggleSidebar,
    toggleStatusBar,
    setDetailHash,
    setDetailPanelOpen,
  } = useUiStore();
  const { torrents } = useTorrentList(4000);
  // The first polling tick may not have returned yet; fall back to an empty array
  const torrentsList: TorrentInfo[] = torrents ?? [];

  const close = useCallback(() => {
    setOpen(false);
    setInput("");
  }, []);

  useEffect(() => {
    setOpenExternal = setOpen;
    return () => {
      setOpenExternal = null;
    };
  }, []);

  const { mode, query } = parseMode(input);

  const handleNavigate = useCallback(
    (to: string) => {
      navigate({ to });
      close();
    },
    [navigate, close],
  );

  const downloadUrl = useCallback(
    async (url: string) => {
      try {
        await qbtClient.addTorrent({ urls: url });
        toast.success(t("Added"));
        await qc.invalidateQueries({ queryKey: ["sync", "maindata"] });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    },
    [qc, t],
  );

  // "@" mode: open the torrent detail panel and jump to the torrent list
  const openLocalTorrent = (hash: string) => {
    setDetailHash(hash);
    setDetailPanelOpen(true);
    navigate({ to: "/" });
    close();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    close();
  };

  const { toggleAltSpeed } = useAltSpeed();

  const commandItems = buildCommandItems({
    t,
    theme,
    locale,
    sidebarVisible,
    statusBarVisible,
    setLocale,
    toggleSidebar,
    toggleStatusBar,
    toggleTheme,
    toggleAltSpeed,
    navigate: handleNavigate,
    close,
  });

  const navItems = buildNavItems(t);

  return (
    <CommandDialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      {/* CommandDialog no longer hosts the cmdk root itself; the <Command>
          wrapper provides it. In prefix modes cmdk would filter against the
          full input (prefix included) and drop everything — those modes
          filter by query in their sections instead, so filtering stays off. */}
      <Command shouldFilter={mode === "mixed"}>
        <CommandInput
          placeholder={t("Search torrents, pages, actions...")}
          value={input}
          onValueChange={setInput}
        />
        <CommandList>
          <CommandEmpty>{t("No results found")}</CommandEmpty>

          {/* ================ / quick commands (filtered by keyword) ================ */}
          {mode === "command" && <CommandSection items={commandItems} query={query} />}

          {/* ================ > page navigation ================ */}
          {mode === "nav" && (
            <NavSection items={navItems} query={query} onNavigate={handleNavigate} />
          )}

          {/* ================ @ local torrents ================ */}
          {mode === "local" && (
            <LocalTorrentsSection
              torrents={torrentsList}
              query={query}
              onOpenTorrent={openLocalTorrent}
            />
          )}

          {/* ================ mixed mode (bare input) ================ */}
          {mode === "mixed" && (
            <>
              {(input.startsWith("magnet:") || input.startsWith("http")) && (
                <CommandGroup heading={t("Download")}>
                  <CommandItem
                    value={`download ${input}`}
                    onSelect={() => {
                      downloadUrl(input);
                      close();
                    }}
                  >
                    <ClipboardPaste />
                    <span className="truncate">
                      {t("Download this link")}: {input}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
              {query && (
                <CommandGroup heading={t("Search online")}>
                  <CommandItem
                    value={`online ${query}`}
                    onSelect={() => handleNavigate(`/search?q=${encodeURIComponent(query)}`)}
                  >
                    <SearchIcon />
                    {t("Search online for")} “{query}”
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup heading={t("Torrents")}>
                {torrentsList.slice(0, 6).map((tr) => (
                  <CommandItem
                    key={tr.hash}
                    value={`torrent ${tr.name}`}
                    onSelect={() => {
                      setDetailHash(tr.hash);
                      setDetailPanelOpen(true);
                      close();
                    }}
                  >
                    <Download />
                    <span className="truncate">{tr.name}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="add torrent"
                  onSelect={() => {
                    openAddTorrentDialog();
                    close();
                  }}
                >
                  <Plus />
                  {t("Add Torrent")}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("Navigation")}>
                {navItems.map((item) => (
                  <CommandItem
                    key={item.to}
                    value={`nav ${item.label}`}
                    onSelect={() => handleNavigate(item.to)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("Appearance")}>
                <CommandItem value="toggle theme" onSelect={toggleTheme}>
                  {theme === "dark" ? <Sun /> : <Moon />}
                  {t("Toggle Theme")}
                </CommandItem>
                {COLOR_THEMES.map((name) => (
                  <CommandItem
                    key={name}
                    value={`theme ${name}`}
                    onSelect={() => {
                      setColorTheme(name);
                      close();
                    }}
                  >
                    <Server />
                    <span>{t(name)}</span>
                    {colorTheme === name && <span className="ml-auto text-xs">✓</span>}
                  </CommandItem>
                ))}
                {/* Every target language except the current one; the value
                  carries all keywords so cmdk matches "english", "russian",
                  "Русский", "俄语" etc. in mixed mode */}
                {LANGUAGES.filter((l) => l.value !== locale).map((l) => (
                  <CommandItem
                    key={l.value}
                    value={`language ${l.value} ${l.keywords.join(" ")}`}
                    onSelect={() => {
                      setLocale(l.value);
                      close();
                    }}
                  >
                    <Languages />
                    <span>{l.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>

      {/* ================ bottom dynamic status bar: per-mode info ================ */}
      <PaletteFooter mode={mode} query={query} torrents={torrentsList} />
    </CommandDialog>
  );
}
