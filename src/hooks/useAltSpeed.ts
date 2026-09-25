/**
 * Alt-speed (snail) state + toggle.
 *
 * The toggle is optimistic — the amber lock shows immediately — and on API
 * failure it reverts, toasts the reason and writes the persistent error log,
 * instead of silently doing nothing like it used to.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { pollWithBackoff } from "@/hooks/useMainDataSync";
import { logError } from "@/lib/errorLog";

export function useAltSpeed() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data: altSpeed } = useQuery({
    queryKey: ["alt-speed"],
    queryFn: () => qbtClient.getSpeedLimitsMode(),
    refetchInterval: pollWithBackoff(5000),
    select: (v) => Number(v) === 1,
  });

  const toggleAltSpeed = useCallback(async () => {
    const current = Number(qc.getQueryData<string>(["alt-speed"])) === 1;
    // Optimistic flip; the invalidate below reconciles with the server
    qc.setQueryData(["alt-speed"], current ? "0" : "1");
    try {
      await qbtClient.toggleSpeedLimitsMode();
      await qc.invalidateQueries({ queryKey: ["alt-speed"] });
    } catch (e) {
      qc.setQueryData(["alt-speed"], current ? "1" : "0");
      logError("ui", e, "toggleSpeedLimitsMode failed");
      toast.error(t("Something went wrong"), {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  }, [qc, t]);

  return { altSpeed, toggleAltSpeed };
}
