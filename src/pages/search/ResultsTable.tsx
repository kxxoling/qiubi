import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/utils.format";
import type { SearchResult } from "@/types/qbt";

interface ResultsTableProps {
  results: SearchResult[];
  isMobile: boolean;
  isRunning: boolean;
  hasActiveSearch: boolean;
  onDownload: (r: SearchResult) => void;
}

/** Search results: mobile cards / desktop table, with download buttons */
export function ResultsTable({
  results,
  isMobile,
  isRunning,
  hasActiveSearch,
  onDownload,
}: ResultsTableProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Results: mobile cards / desktop table */}
      {results.length > 0 && isMobile ? (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.fileUrl} className="rounded-lg border bg-card p-3">
              <button
                type="button"
                className="w-full truncate text-left text-sm font-medium"
                onClick={() => onDownload(r)}
              >
                {r.fileName}
              </button>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{r.fileSize > 0 ? formatBytes(r.fileSize) : "-"}</span>
                <span className="text-green-600 dark:text-green-400">S:{r.nbSeeders}</span>
                <span>P:{r.nbLeechers}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="h-8 flex-1 text-xs" onClick={() => onDownload(r)}>
                  <Download className="mr-1 h-3 w-3" />
                  {t("Download")}
                </Button>
                {r.descrLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => window.open(r.descrLink, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {results.length > 0 && !isMobile ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name")}</TableHead>
                <TableHead className="w-24">{t("Size")}</TableHead>
                <TableHead className="w-20">{t("Seeds")}</TableHead>
                <TableHead className="w-20">{t("Peers")}</TableHead>
                <TableHead className="w-24">{t("Site")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.fileUrl}>
                  <TableCell className="max-w-md truncate font-medium">{r.fileName}</TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {r.fileSize > 0 ? formatBytes(r.fileSize) : "-"}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-green-600">
                    {r.nbSeeders}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">{r.nbLeechers}</TableCell>
                  <TableCell className="truncate text-xs text-muted-foreground">
                    {r.siteUrl}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onDownload(r)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t("Download")}
                      </Button>
                      {r.descrLink && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => window.open(r.descrLink, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {results.length} {t("results")}
            {isRunning && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
          </div>
        </div>
      ) : hasActiveSearch && !isRunning ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("No results found")}
        </div>
      ) : null}
    </>
  );
}
