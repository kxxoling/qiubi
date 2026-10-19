/**
 * Torrent row context menu (full operations, same as the qBT desktop version)
 *
 * Desktop semantics: the menu acts on the whole selection (when right-clicking a selected row).
 *
 * Every item renders its icon in a fixed size-4 slot — items without a
 * fitting icon keep an empty placeholder box so all labels stay in one
 * aligned column. Icons reuse the app's semantic status colors (yellow
 * paused, sky resumed/seeding, violet active, cyan checking, red
 * destructive); non-semantic actions stay muted.
 */
import type { Row } from "@tanstack/react-table";
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  FolderOpen,
  Hash,
  ListOrdered,
  type LucideIcon,
  Magnet,
  Megaphone,
  Pause,
  Pencil,
  Play,
  ScanLine,
  Sprout,
  Tags,
  Trash2,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { TorrentInfo } from "@/types/qbt";

/** Icon slot shared by every menu item: renders the icon, or an invisible
 *  same-size box when the item has no icon, keeping labels aligned */
function MenuIcon({ icon: IconComp, className }: { icon?: LucideIcon; className?: string }) {
  if (!IconComp) return <span aria-hidden className="size-4 shrink-0" />;
  return <IconComp aria-hidden className={cn("size-4 shrink-0", className)} />;
}

export type CtxAction =
  | "pause"
  | "resume"
  | "forceStart"
  | "recheck"
  | "reannounce"
  | "delete"
  | "copyMagnet"
  | "copyHash"
  | "sequential"
  | "firstLast"
  | "topPrio"
  | "upPrio"
  | "downPrio"
  | "bottomPrio"
  | "rename"
  | "setDlLimit"
  | "setUpLimit";

export function TorrentContextMenu({
  row,
  /** The row element itself (<tr>), passed through to the Trigger via render */
  renderRow,
  /** The row's cells (td list) */
  cells,
  ctxHashes,
  categories,
  tags,
  onAction,
}: {
  row: Row<TorrentInfo>;
  renderRow: React.ReactElement;
  cells: React.ReactNode;
  /** Menu targets (the selection or this row) */
  ctxHashes: string[];
  categories: { name: string; savePath: string }[] | undefined;
  tags: string[] | undefined;
  onAction: (action: CtxAction, hashes: string[], row?: TorrentInfo) => void;
}) {
  const { t } = useTranslation();
  const act = (action: CtxAction) => () => onAction(action, ctxHashes, row.original);

  return (
    <ContextMenu key={row.id}>
      {/* render pass-through: the Trigger must not wrap extra elements, otherwise it produces an
          invalid div>tr table DOM and table-fixed column widths get broken by long content */}
      <ContextMenuTrigger render={renderRow}>{cells}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Basic actions */}
        <ContextMenuItem onClick={act("pause")}>
          <MenuIcon icon={Pause} className="text-yellow-700 dark:text-yellow-400" />
          {t("Pause")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("resume")}>
          <MenuIcon icon={Play} className="text-sky-600 dark:text-sky-400" />
          {t("Resume")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("forceStart")}>
          <MenuIcon icon={Zap} className="text-violet-600 dark:text-violet-400" />
          {t("Force Start")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Check/announce */}
        <ContextMenuItem onClick={act("recheck")}>
          <MenuIcon icon={ScanLine} className="text-cyan-600 dark:text-cyan-400" />
          {t("Recheck")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("reannounce")}>
          <MenuIcon icon={Megaphone} />
          {t("Reannounce")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem variant="destructive" onClick={act("delete")}>
          <MenuIcon icon={Trash2} />
          {t("Delete")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Copy */}
        <ContextMenuItem onClick={act("copyMagnet")}>
          <MenuIcon icon={Magnet} />
          {t("Copy Magnet URI")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("copyHash")}>
          <MenuIcon icon={Hash} />
          {t("Copy Hash")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Download mode */}
        <ContextMenuItem onClick={act("sequential")}>
          <MenuIcon icon={ListOrdered} />
          {t("Sequential Download")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("firstLast")}>
          <MenuIcon icon={ArrowDownUp} />
          {t("First/Last Priority")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            qbtClient.setSuperSeeding(ctxHashes, !row.original.super_seeding).catch(() => {})
          }
        >
          <MenuIcon icon={Sprout} className="text-sky-600 dark:text-sky-400" />
          {t("Super Seeding")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Priority */}
        <ContextMenuItem onClick={act("topPrio")}>
          <MenuIcon icon={ChevronsUp} />
          {t("Top Priority")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("upPrio")}>
          <MenuIcon icon={ChevronUp} />
          {t("Priority Up")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("downPrio")}>
          <MenuIcon icon={ChevronDown} />
          {t("Priority Down")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("bottomPrio")}>
          <MenuIcon icon={ChevronsDown} />
          {t("Bottom Priority")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Category */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <MenuIcon icon={FolderOpen} />
            {t("Set Category")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={() => qbtClient.setTorrentCategory(ctxHashes, "").catch(() => {})}
            >
              <MenuIcon />
              {t("All")}
            </ContextMenuItem>
            {categories?.map((c) => (
              <ContextMenuItem
                key={c.name}
                onClick={() => qbtClient.setTorrentCategory(ctxHashes, c.name).catch(() => {})}
              >
                <MenuIcon />
                {c.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Tags: existing tags are checked, clicking toggles add/remove */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <MenuIcon icon={Tags} />
            {t("Set Tag")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {tags?.map((tag) => {
              const rowTags = row.original.tags
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
              const has = rowTags.includes(tag);
              return (
                <ContextMenuItem
                  key={tag}
                  onClick={() => {
                    (has
                      ? qbtClient.removeTorrentTags(ctxHashes, [tag])
                      : qbtClient.addTorrentTags(ctxHashes, [tag])
                    ).catch(() => {});
                  }}
                >
                  <MenuIcon icon={has ? Check : undefined} />
                  {tag}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Speed limits */}
        <ContextMenuItem onClick={act("setDlLimit")}>
          <MenuIcon icon={ArrowDownToLine} />
          {t("Set Download Limit")}
        </ContextMenuItem>
        <ContextMenuItem onClick={act("setUpLimit")}>
          <MenuIcon icon={ArrowUpFromLine} />
          {t("Set Upload Limit")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem onClick={act("rename")}>
          <MenuIcon icon={Pencil} />
          {t("Rename")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Desktop-semantics right-click targets: unselected row → just that row; selected → the whole selection */
export function ctxHashesFor(row: Row<TorrentInfo>, selectedHashes: string[]): string[] {
  return row.getIsSelected() && selectedHashes.length > 1 ? selectedHashes : [row.original.hash];
}
