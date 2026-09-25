/**
 * Torrent content file tree (qBT Content tab)
 *
 * Rebuilds the flat paths returned by /torrents/files into a tree:
 * - Folders are collapsible and aggregate child file sizes/progress
 * - Every file and folder can be assigned a priority (0 skip / 1 normal / 6 high / 7 max),
 *   and a folder setting is batch-applied to all child files (qBT filePrio repeated id params)
 */
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils.format";
import type { TorrentFiles } from "@/types/qbt";

type TreeNode = {
  name: string;
  path: string;
  dir: boolean;
  children: TreeNode[];
  file?: TorrentFiles;
  size: number;
  /** Completed bytes (sum of child files for folders) */
  done: number;
  priority: number | "mixed";
  /** List of API indexes of descendant files */
  indexes: number[];
};

function newDir(name: string, path: string): TreeNode {
  return { name, path, dir: true, children: [], size: 0, done: 0, priority: "mixed", indexes: [] };
}

/** Flat file list → tree, aggregating size/progress/priority bottom-up */
function buildTree(files: TorrentFiles[]): TreeNode {
  const root = newDir("", "");
  for (const f of files) {
    const parts = f.name.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts.slice(0, i + 1).join("/");
      let child = node.children.find((c) => c.dir && c.name === parts[i]);
      if (!child) {
        child = newDir(parts[i], p);
        node.children.push(child);
      }
      node = child;
    }
    node.children.push({
      name: parts[parts.length - 1],
      path: f.name,
      dir: false,
      children: [],
      file: f,
      size: f.size,
      done: f.size * f.progress,
      priority: f.priority,
      indexes: [f.index],
    });
  }
  const aggregate = (n: TreeNode) => {
    if (!n.dir) return;
    n.size = 0;
    n.done = 0;
    n.indexes = [];
    const prios = new Set<number>();
    for (const c of n.children) {
      aggregate(c);
      n.size += c.size;
      n.done += c.done;
      n.indexes.push(...c.indexes);
      if (c.priority !== "mixed") prios.add(c.priority);
    }
    n.priority = prios.size === 1 ? [...prios][0] : "mixed";
  };
  aggregate(root);
  // Folders first, sorted by name, matching the qBT Content page
  const sortNode = (n: TreeNode) => {
    n.children.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
    n.children.forEach(sortNode);
  };
  sortNode(root);
  return root;
}

const PRIORITY_OPTIONS = [0, 1, 6, 7] as const;

function PrioritySelect({
  value,
  disabled,
  onChange,
}: {
  value: number | "mixed";
  disabled?: boolean;
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <select
      aria-label={t("Priority")}
      disabled={disabled}
      value={value === "mixed" ? "" : value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="shrink-0 rounded border bg-background px-1 py-0.5 text-xs text-muted-foreground disabled:opacity-50"
    >
      {value === "mixed" && (
        <option value="" disabled>
          {t("Mixed")}
        </option>
      )}
      {PRIORITY_OPTIONS.map((p) => (
        <option key={p} value={p}>
          {p === 0 ? t("Do not download") : p === 1 ? t("Normal") : p === 6 ? t("High") : t("Max")}
        </option>
      ))}
    </select>
  );
}

export function FileTree({ hash, files }: { hash: string; files: TorrentFiles[] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const root = useMemo(() => buildTree(files), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const setPriority = async (node: TreeNode, p: number) => {
    try {
      await qbtClient.setFilePriority(hash, node.indexes, p);
      await qc.invalidateQueries({ queryKey: ["torrent-files", hash] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const rows: React.ReactNode[] = [];
  const walk = (node: TreeNode, depth: number) => {
    for (const c of node.children) {
      const isCollapsed = collapsed.has(c.path);
      rows.push(
        <div
          key={c.path}
          className="flex items-center gap-2 rounded py-1 pr-1 pl-(--d) text-sm hover:bg-accent/40"
          style={{ "--d": `${depth * 16 + 4}px` } as React.CSSProperties}
        >
          {c.dir ? (
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(c.path)) next.delete(c.path);
                  else next.add(c.path);
                  return next;
                })
              }
            >
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground transition-transform",
                  !isCollapsed && "rotate-90",
                )}
              />
              {isCollapsed ? (
                <Folder className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate font-medium">{c.name}</span>
            </button>
          ) : (
            <span className="flex min-w-0 flex-1 items-center gap-1.5 pl-5">
              <File className="size-4 shrink-0 text-muted-foreground/60" />
              <span className="truncate">{c.name}</span>
            </span>
          )}
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatBytes(c.size)}
          </span>
          <span className="flex w-24 shrink-0 items-center gap-1.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full w-(--p) rounded-full bg-primary"
                style={{ "--p": `${c.size ? (c.done / c.size) * 100 : 0}%` } as React.CSSProperties}
              />
            </span>
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
              {c.size ? Math.round((c.done / c.size) * 100) : 0}%
            </span>
          </span>
          <PrioritySelect value={c.priority} onChange={(p) => setPriority(c, p)} />
        </div>,
      );
      if (c.dir && !isCollapsed) walk(c, depth + 1);
    }
  };
  walk(root, 0);

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">{t("No results found")}</div>
    );
  }
  return (
    <div className="text-[13px]">
      {/* Root-level quick actions: set everything to the same priority */}
      <div className="mb-1 flex items-center gap-2 border-b pb-1.5 text-xs text-muted-foreground">
        <span>
          {files.length} {t("Files")}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {t("Set all")}:
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              className="rounded border px-1.5 py-0.5 hover:bg-accent"
              onClick={() => setPriority(root, p)}
            >
              {p === 0
                ? t("Do not download")
                : p === 1
                  ? t("Normal")
                  : p === 6
                    ? t("High")
                    : t("Max")}
            </button>
          ))}
        </span>
      </div>
      {rows}
    </div>
  );
}
