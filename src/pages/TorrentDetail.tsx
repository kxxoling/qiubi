/**
 * Torrent detail page (mobile / Enter key entry)
 *
 * The main desktop entry is the detail panel at the bottom of the list page; this page reuses the same TorrentDetailPanel component.
 */
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TorrentDetailPanel } from "@/components/torrent/TorrentDetailPanel";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useUiStore } from "@/stores/ui";

/**
 * Torrent detail page (mobile fullscreen view)
 *
 * On desktop, the detail entry is the panel at the bottom of the list; if this route is opened
 * at desktop width (small window maximized, or URL entered directly), automatically redirect back
 * to the list and expand the corresponding panel so the same torrent renders consistently at both window sizes.
 */
export function TorrentDetail() {
  const { hash } = useParams({ strict: false }) as { hash: string };
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setDetailHash = useUiStore((s) => s.setDetailHash);
  const setDetailPanelOpen = useUiStore((s) => s.setDetailPanelOpen);

  useEffect(() => {
    if (!isMobile) {
      setDetailHash(hash);
      setDetailPanelOpen(true);
      navigate({ to: "/" });
    }
  }, [isMobile, hash, setDetailHash, setDetailPanelOpen, navigate]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("Back")}
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">{t("Torrent Details")}</h2>
      </div>
      <div className="min-h-0 flex-1">
        <TorrentDetailPanel hash={hash} />
      </div>
    </div>
  );
}
