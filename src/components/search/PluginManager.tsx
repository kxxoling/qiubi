/**
 * Search plugin manager dialog
 *
 * View/enable/disable/install/uninstall search plugins
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SearchPlugin } from "@/types/qbt";

export function PluginManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [installUrl, setInstallUrl] = useState("");

  const { data: plugins } = useQuery({
    queryKey: ["search-plugins"],
    queryFn: () => qbtClient.getSearchPlugins(),
    enabled: open,
  });

  const togglePlugin = async (plugin: SearchPlugin) => {
    try {
      await qbtClient.enableSearchPlugin([plugin.name], !plugin.enabled);
      await qc.invalidateQueries({ queryKey: ["search-plugins"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const installPlugin = async () => {
    if (!installUrl.trim()) return;
    try {
      await qbtClient.installSearchPlugin(installUrl.trim());
      toast.success(t("Added"));
      setInstallUrl("");
      await qc.invalidateQueries({ queryKey: ["search-plugins"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const uninstallPlugin = async (name: string) => {
    try {
      await qbtClient.uninstallSearchPlugin([name]);
      toast.success(t("Deleted"));
      await qc.invalidateQueries({ queryKey: ["search-plugins"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Manage Plugins")}</DialogTitle>
        </DialogHeader>

        {/* Install a new plugin */}
        <div className="flex items-center gap-2">
          <Input
            value={installUrl}
            onChange={(e) => setInstallUrl(e.target.value)}
            placeholder={t("Plugin URL")}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") installPlugin();
            }}
          />
          <Button size="sm" onClick={installPlugin} disabled={!installUrl.trim()}>
            <Download className="mr-1 h-4 w-4" />
            {t("Install")}
          </Button>
        </div>

        {/* Plugin list */}
        <div className="rounded-md border max-h-80 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name")}</TableHead>
                <TableHead className="w-20">{t("Version")}</TableHead>
                <TableHead className="w-20">{t("Status")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!plugins?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                    {t("No results found")}
                  </TableCell>
                </TableRow>
              ) : (
                plugins.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{p.fullName || p.name}</div>
                        {p.url && (
                          <div className="truncate text-xs text-muted-foreground">{p.url}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{p.version}</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.enabled ? "default" : "secondary"}
                        className="cursor-pointer text-[10px]"
                        onClick={() => togglePlugin(p)}
                      >
                        {p.enabled ? t("Enabled") : t("Disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => uninstallPlugin(p.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
