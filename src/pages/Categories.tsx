import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Category management page
 *
 * Category list + create/edit/delete + click to filter torrents
 */

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPath, setFormPath] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => qbtClient.getCategories(),
  });

  const { data: torrents } = useQuery({
    queryKey: ["torrents"],
    queryFn: () => qbtClient.getTorrentsInfo(),
    refetchInterval: 5000,
  });

  // Torrent count per category
  const countByCategory: Record<string, number> = {};
  for (const t of torrents ?? []) {
    if (t.category) {
      countByCategory[t.category] = (countByCategory[t.category] ?? 0) + 1;
    }
  }

  const openCreate = () => {
    setEditMode(false);
    setFormName("");
    setFormPath("");
    setDialogOpen(true);
  };

  const openEdit = (name: string, savePath: string) => {
    setEditMode(true);
    setFormName(name);
    setFormPath(savePath);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await qbtClient.editCategory(formName, formPath);
        toast.success(t("Saved"));
      } else {
        await qbtClient.addCategory(formName, formPath || undefined);
        toast.success(t("Saved"));
      }
      setDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await qbtClient.removeCategories([name]);
      toast.success(t("Deleted"));
      setDeleteTarget(null);
      await qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const goToCategory = (category: string) => {
    navigate({ to: "/", search: { category } });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">{t("Connecting...")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{t("Categories")}</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          {t("New Category")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories?.map((cat) => (
          <Card
            key={cat.name}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => goToCategory(cat.name)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">{cat.name}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(cat.name, cat.savePath);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(cat.name);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">{cat.savePath || t("Default")}</span>
              </div>
              <div className="mt-2 text-sm">
                <span className="font-medium tabular-nums">{countByCategory[cat.name] ?? 0}</span>{" "}
                {t("Torrents")}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!categories || categories.length === 0) && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            {t("No results found")}
          </div>
        )}
      </div>

      {/* Create/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? t("Edit Category") : t("New Category")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">{t("Name")}</div>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={editMode}
                placeholder={t("Name")}
              />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">{t("Save Path")}</div>
              <Input
                value={formPath}
                onChange={(e) => setFormPath(e.target.value)}
                placeholder={t("Save Path")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {t("Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("Delete category confirm", { name: deleteTarget ?? "" })}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {t("Delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
