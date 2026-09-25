/**
 * "/" quick commands and ">" page navigation for the command palette:
 * item builders (pure functions of the current app state) plus the
 * CommandGroup renderers for both modes.
 */
import type { TFunction } from "i18next";
import {
  ArrowRight,
  Download,
  FolderOpen,
  Gauge,
  Languages,
  ListOrdered,
  Logs,
  type LucideIcon,
  Moon,
  Pause,
  Play,
  Plus,
  Rss,
  Search as SearchIcon,
  Settings,
  Sun,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Shortcut } from "@/components/Shortcut";
import { openAddTorrentDialog } from "@/components/torrent/AddTorrentDialog";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type { Locale } from "@/i18n";
import { logError } from "@/lib/errorLog";

export type CommandItemDef = {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  /** Shortcut keys (lowercase; rendered as one chip per key) */
  kbd?: string[];
  run: () => void;
};

export type BuildCommandItemsOptions = {
  t: TFunction;
  theme: "light" | "dark" | "system";
  locale: Locale;
  sidebarVisible: boolean;
  statusBarVisible: boolean;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  toggleStatusBar: () => void;
  toggleTheme: () => void;
  /** Shared optimistic alt-speed toggle (useAltSpeed) */
  toggleAltSpeed: () => Promise<void>;
  navigate: (to: string) => void;
  close: () => void;
};

/** Run a global action, toasting + logging failures instead of silently rejecting */
async function guardGlobalAction(action: () => Promise<unknown>, t: TFunction) {
  try {
    await action();
  } catch (e) {
    logError("ui", e, "palette global action failed");
    toast.error(t("Something went wrong"), {
      description: e instanceof Error ? e.message : String(e),
    });
  }
}

/** Build the "/" mode command list (keywords participate in filtering). */
/** Switchable UI languages: label is in the target language itself, so the
 *  option reads correctly no matter what the current UI language is */
export const LANGUAGES: {
  value: Locale;
  label: string;
  keywords: string[];
}[] = [
  { value: "en", label: "Switch to English", keywords: ["english", "英文", "英语"] },
  { value: "zh", label: "切换到简体中文", keywords: ["simplified chinese", "简体", "简体中文"] },
  {
    value: "zh-TW",
    label: "切換到繁體中文",
    keywords: ["traditional chinese", "繁體", "繁体中文", "chinese traditional"],
  },
  {
    value: "ru",
    label: "Переключить на русский",
    keywords: ["russian", "русский", "俄语", "俄文", "俄罗斯"],
  },
  {
    value: "ja",
    label: "日本語に切り替える",
    keywords: ["japanese", "日本語", "にほんご", "nihongo", "日语", "日文"],
  },
  {
    value: "ko",
    label: "한국어로 전환",
    keywords: ["korean", "한국어", "한글", "hangul", "韩语", "韩文"],
  },
  {
    value: "es",
    label: "Cambiar a español",
    keywords: ["spanish", "español", "espanol", "castellano", "西班牙语", "西语"],
  },
  {
    value: "pt",
    label: "Mudar para português",
    keywords: ["portuguese", "português", "portugues", "葡萄牙语", "葡语"],
  },
];

export function buildCommandItems({
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
  navigate,
  close,
}: BuildCommandItemsOptions): CommandItemDef[] {
  return [
    {
      id: "add",
      label: t("Add Torrent"),
      keywords: ["add torrent", "add", "torrent"],
      icon: <Plus />,
      kbd: ["meta", "j"],
      run: () => {
        openAddTorrentDialog();
        close();
      },
    },
    {
      id: "pause-all",
      label: t("Pause All"),
      keywords: ["pause all", "pause", "stop"],
      icon: <Pause />,
      run: async () => {
        await guardGlobalAction(() => qbtClient.pauseTorrents(["all"]), t);
        close();
      },
    },
    {
      id: "resume-all",
      label: t("Resume All"),
      keywords: ["resume all", "resume", "start"],
      icon: <Play />,
      run: async () => {
        await guardGlobalAction(() => qbtClient.resumeTorrents(["all"]), t);
        close();
      },
    },
    {
      id: "alt-speed",
      label: t("Alt Speed"),
      keywords: ["alt speed", "speed limit", "alt"],
      icon: <Zap />,
      run: async () => {
        await toggleAltSpeed();
        close();
      },
    },
    {
      id: "theme",
      label: t("Toggle Theme"),
      keywords: ["theme", "dark", "light"],
      icon: theme === "dark" ? <Sun /> : <Moon />,
      run: toggleTheme,
    },
    // One command per target language (the current one is omitted); keywords
    // cover each language's native name + English name so "english", "俄语",
    // "russian", "русский" etc. all find their option regardless of UI language
    ...LANGUAGES.filter((l) => l.value !== locale).map((l) => ({
      id: `language-${l.value}`,
      label: l.label,
      keywords: ["language", "locale", "语言", ...l.keywords],
      icon: <Languages />,
      run: () => {
        setLocale(l.value);
        close();
      },
    })),
    {
      id: "sidebar",
      label: sidebarVisible ? t("Hide filter sidebar") : t("Show Filter Sidebar"),
      keywords: ["sidebar", "filter"],
      icon: <ListOrdered />,
      run: () => {
        toggleSidebar();
        close();
      },
    },
    {
      id: "statusbar",
      label: statusBarVisible ? t("Hide status bar") : t("Show Status Bar"),
      keywords: ["status bar", "statusbar"],
      icon: <ListOrdered />,
      run: () => {
        toggleStatusBar();
        close();
      },
    },
    {
      id: "settings",
      label: t("Settings"),
      keywords: ["settings", "options", "preferences"],
      icon: <Settings />,
      run: () => navigate("/settings"),
    },
  ];
}

export type NavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
};

/** Build the ">" mode page jump list. */
export function buildNavItems(t: TFunction): NavItem[] {
  return [
    { to: "/", icon: Download, label: t("Torrents") },
    { to: "/dashboard", icon: Gauge, label: t("Dashboard") },
    { to: "/categories", icon: FolderOpen, label: t("Categories") },
    { to: "/rss", icon: Rss, label: t("RSS") },
    { to: "/search", icon: SearchIcon, label: t("Search") },
    { to: "/log", icon: Logs, label: t("Execution Log") },
    { to: "/settings", icon: Settings, label: t("Settings") },
  ];
}

/** Result group for the "/" mode (filtered by keyword match against the query). */
export function CommandSection({ items, query }: { items: CommandItemDef[]; query: string }) {
  const { t } = useTranslation();
  return (
    <CommandGroup heading={t("Commands")}>
      {items
        .filter(
          (c) => !query || c.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase())),
        )
        .map((c) => (
          /* Full keyword list + label in the value: in mixed mode cmdk's
             built-in filter matches against this string, so a keyword-only
             value would hide every alias beyond the first one */
          <CommandItem
            key={c.id}
            value={`cmd ${c.id} ${c.keywords.join(" ")} ${c.label}`}
            onSelect={c.run}
          >
            {c.icon}
            {c.label}
            {c.kbd && <Shortcut keys={c.kbd} className="ml-auto" />}
          </CommandItem>
        ))}
    </CommandGroup>
  );
}

/** Result group for the ">" mode (filtered by label, entries link to the page). */
export function NavSection({
  items,
  query,
  onNavigate,
}: {
  items: NavItem[];
  query: string;
  onNavigate: (to: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <CommandGroup heading={t("Navigation")}>
      {items
        .filter((item) => !query || item.label.toLowerCase().includes(query.toLowerCase()))
        .map((item) => (
          <CommandItem
            key={item.to}
            value={`nav ${item.label}`}
            onSelect={() => onNavigate(item.to)}
          >
            <item.icon />
            <span>{item.label}</span>
            <ArrowRight className="ml-auto size-3 opacity-40" />
          </CommandItem>
        ))}
    </CommandGroup>
  );
}
