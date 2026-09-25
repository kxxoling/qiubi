/**
 * Torrent row context menu (full operations, same as the qBT desktop version)
 *
 * Desktop semantics: the menu acts on the whole selection (when right-clicking a selected row).
 */
import type { Row } from "@tanstack/react-table";
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
import type { TorrentInfo } from "@/types/qbt";

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
        <ContextMenuItem onClick={act("pause")}>{t("Pause")}</ContextMenuItem>
        <ContextMenuItem onClick={act("resume")}>{t("Resume")}</ContextMenuItem>
        <ContextMenuItem onClick={act("forceStart")}>{t("Force Start")}</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Check/announce */}
        <ContextMenuItem onClick={act("recheck")}>{t("Recheck")}</ContextMenuItem>
        <ContextMenuItem onClick={act("reannounce")}>{t("Reannounce")}</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem className="text-destructive" onClick={act("delete")}>
          {t("Delete")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Copy */}
        <ContextMenuItem onClick={act("copyMagnet")}>{t("Copy Magnet URI")}</ContextMenuItem>
        <ContextMenuItem onClick={act("copyHash")}>{t("Copy Hash")}</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Download mode */}
        <ContextMenuItem onClick={act("sequential")}>{t("Sequential Download")}</ContextMenuItem>
        <ContextMenuItem onClick={act("firstLast")}>{t("First/Last Priority")}</ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            qbtClient.setSuperSeeding(ctxHashes, !row.original.super_seeding).catch(() => {})
          }
        >
          {t("Super Seeding")}
        </ContextMenuItem>
        <ContextMenuSeparator />

        {/* Priority */}
        <ContextMenuItem onClick={act("topPrio")}>{t("Top Priority")}</ContextMenuItem>
        <ContextMenuItem onClick={act("upPrio")}>{t("Priority Up")}</ContextMenuItem>
        <ContextMenuItem onClick={act("downPrio")}>{t("Priority Down")}</ContextMenuItem>
        <ContextMenuItem onClick={act("bottomPrio")}>{t("Bottom Priority")}</ContextMenuItem>
        <ContextMenuSeparator />

        {/* Category */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t("Set Category")}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={() => qbtClient.setTorrentCategory(ctxHashes, "").catch(() => {})}
            >
              {t("All")}
            </ContextMenuItem>
            {categories?.map((c) => (
              <ContextMenuItem
                key={c.name}
                onClick={() => qbtClient.setTorrentCategory(ctxHashes, c.name).catch(() => {})}
              >
                {c.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Tags: existing tags are checked, clicking toggles add/remove */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t("Set Tag")}</ContextMenuSubTrigger>
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
                  {has ? "✓ " : ""}
                  {tag}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        {/* Speed limits */}
        <ContextMenuItem onClick={act("setDlLimit")}>{t("Set Download Limit")}</ContextMenuItem>
        <ContextMenuItem onClick={act("setUpLimit")}>{t("Set Upload Limit")}</ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem onClick={act("rename")}>{t("Rename")}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Desktop-semantics right-click targets: unselected row → just that row; selected → the whole selection */
export function ctxHashesFor(row: Row<TorrentInfo>, selectedHashes: string[]): string[] {
  return row.getIsSelected() && selectedHashes.length > 1 ? selectedHashes : [row.original.hash];
}
