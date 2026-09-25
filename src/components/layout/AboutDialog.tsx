/**
 * About dialog —— qiubi version / qBittorrent version / project links
 */
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Globe } from "lucide-react";

/** GitHub mark (lucide dropped brand icons; path from the official
 *  simple-icons set, CC0) */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

import { useTranslation } from "react-i18next";
import { qbtClient } from "@/api/qbt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import pkg from "../../../package.json";

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data: qbtVersion } = useQuery({
    queryKey: ["app-version"],
    queryFn: () => qbtClient.getAppVersion(),
    enabled: open,
    staleTime: Infinity,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("About")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">qiubi</span>
              <span className="font-mono">v{pkg.version}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">qBittorrent</span>
              <span className="font-mono">{qbtVersion ?? "…"}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("A modern qBittorrent Web UI")}
          </p>
          <div className="flex flex-col gap-1.5 border-t pt-3 text-xs">
            <a
              className="flex items-center gap-2 text-primary hover:underline"
              href="https://github.com/kxxoling/qiubi"
              target="_blank"
              rel="noreferrer"
            >
              <GithubMark className="size-3.5 shrink-0" />
              github.com/kxxoling/qiubi
            </a>
            <a
              className="flex items-center gap-2 text-primary hover:underline"
              href="https://github.com/qbittorrent/qBittorrent"
              target="_blank"
              rel="noreferrer"
            >
              <GithubMark className="size-3.5 shrink-0" />
              github.com/qbittorrent/qBittorrent
            </a>
            <a
              className="flex items-center gap-2 text-primary hover:underline"
              href="https://www.qbittorrent.org/"
              target="_blank"
              rel="noreferrer"
            >
              <Globe className="size-3.5 shrink-0" />
              qbittorrent.org
            </a>
            <a
              className="flex items-center gap-2 text-primary hover:underline"
              href="https://qbittorrent.readthedocs.io/en/latest/api.html"
              rel="noreferrer"
              target="_blank"
            >
              <BookOpen className="size-3.5 shrink-0" />
              qBittorrent Web API
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
