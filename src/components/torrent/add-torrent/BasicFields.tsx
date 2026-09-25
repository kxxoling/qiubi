/**
 * Basic section of the add-torrent dialog: links textarea, .torrent file
 * dropzone + picked file list (with the selective-download list) and the
 * category / tags / save path fields.
 */

import { useQueryClient } from "@tanstack/react-query";
import { FileUp, FolderOpen, Link2, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedTorrent } from "@/lib/torrentParse";
import type { Category } from "@/types/qbt";
import type { AddTorrentForm, SetFormField } from "./form";
import { SelectiveFiles } from "./SelectiveFiles";

export type BasicFieldsProps = {
  form: AddTorrentForm;
  set: SetFormField;
  categories: Category[] | undefined;
  tagsPlaceholder: string;
  savePathPlaceholder: string;
  dragOver: boolean;
  setDragOver: (over: boolean) => void;
  onAddFiles: (incoming: FileList | File[] | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  parsedTorrents: Map<string, ParsedTorrent>;
  skippedFiles: Map<string, Set<number>>;
  setSkippedFiles: React.Dispatch<React.SetStateAction<Map<string, Set<number>>>>;
};

export function BasicFields({
  form: f,
  set,
  categories,
  tagsPlaceholder,
  savePathPlaceholder,
  dragOver,
  setDragOver,
  onAddFiles,
  fileInputRef,
  parsedTorrents,
  skippedFiles,
  setSkippedFiles,
}: BasicFieldsProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [categoryQuery, setCategoryQuery] = useState("");
  // plain React filtering (declarative <ComboboxItem> children don't go
  // through Base UI's filter hook); the create-new entry always stays listed
  const catQuery = categoryQuery.trim().toLowerCase();
  const visibleCategories: Category[] = (categories ?? []).filter(
    (c) => !catQuery || c.name.toLowerCase().includes(catQuery),
  );
  const singleParsed = f.files.length === 1 ? parsedTorrents.get(f.files[0].name) : undefined;

  /** Create the typed-in category and apply it to the form */
  const createCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await qbtClient.addCategory(trimmed);
      await qc.invalidateQueries({ queryKey: ["categories"] });
      set("category", trimmed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      {/* ── Links ── */}
      <div className="space-y-2">
        <label htmlFor="add-urls" className="flex items-center gap-1.5 text-sm font-medium">
          <Link2 className="size-4 text-muted-foreground" />
          {t("Links")}
        </label>
        <Textarea
          id="add-urls"
          value={f.urls}
          onChange={(e) => set("urls", e.target.value)}
          placeholder={"magnet:?xt=urn:btih:…\nhttps://example.com/file.torrent"}
          rows={4}
          className="resize-none font-mono text-xs"
        />
      </div>

      <Separator className="my-3" />

      {/* ── Files (multi-select) ── */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <FileUp className="size-4 text-muted-foreground" />
          {t("Torrent files")}
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onAddFiles(e.dataTransfer.files);
          }}
          className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-all ${
            dragOver
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-ring/50 hover:bg-accent/40"
          }`}
        >
          <FileUp className="size-5" />
          <span className="text-sm">{t("Click to choose or drop .torrent files")}</span>
          {f.files.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              {t("(multiple select supported)")}
            </span>
          ) : (
            <span className="text-xs font-medium text-primary">
              {f.files.length} {t("files selected")}
            </span>
          )}
        </button>
        {f.files.length > 0 && (
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2">
            {f.files.map((file, i) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center gap-2 py-0.5 text-xs"
              >
                <FileUp className="size-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {parsedTorrents.get(file.name)?.name ?? file.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    set(
                      "files",
                      f.files.filter((_, j) => j !== i),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selective file checkbox list for a single-file torrent (shown once parsed) */}
        {singleParsed && (
          <SelectiveFiles
            torrentName={f.files[0].name}
            parsed={singleParsed}
            skippedFiles={skippedFiles}
            setSkippedFiles={setSkippedFiles}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".torrent,application/x-bittorrent"
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <Separator className="my-3" />

      {/* ── Basic: category / path / tags ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="add-cat"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Tag className="size-3" />
            {t("Category")}
          </label>
          <Combobox
            value={f.category}
            onValueChange={(v) => {
              if (v === "__new__") {
                void createCategory(categoryQuery);
                return;
              }
              set("category", v ?? "");
            }}
            onInputValueChange={(input) => setCategoryQuery(input)}
          >
            <ComboboxInput
              id="add-cat"
              placeholder={t("Uncategorized")}
              className="w-full text-xs"
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>
                  {t("New Category")} “{categoryQuery}”
                </ComboboxEmpty>
                {/* empty value = leave the torrent uncategorized */}
                <ComboboxItem value="">{t("Uncategorized")}</ComboboxItem>
                {visibleCategories.map((c) => (
                  <ComboboxItem key={c.name} value={c.name}>
                    {c.name}
                  </ComboboxItem>
                ))}
                <ComboboxSeparator />
                {/* always available: type a name (any text) and pick this */}
                <ComboboxItem value="__new__" className="text-primary">
                  <Plus className="size-3.5" />
                  {categoryQuery.trim()
                    ? `${t("New Category")} “${categoryQuery.trim()}”`
                    : t("New Category")}
                </ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="add-tags" className="text-xs text-muted-foreground">
            {t("Tags")}
          </label>
          <Input
            id="add-tags"
            value={f.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder={tagsPlaceholder}
            className="text-xs"
          />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <label htmlFor="add-path" className="flex items-center gap-1 text-xs text-muted-foreground">
          <FolderOpen className="size-3" />
          {t("Download Directory")}
        </label>
        <Input
          id="add-path"
          value={f.savePath}
          onChange={(e) => set("savePath", e.target.value)}
          placeholder={savePathPlaceholder}
          className="w-full text-xs"
        />
      </div>
    </>
  );
}
