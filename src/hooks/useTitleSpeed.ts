/**
 * Live transfer speed in the browser tab title
 *
 * Following qBT WebUI convention, speeds are prepended to document.title so
 * the transfer state is visible at a glance even in a background tab;
 * ↓/↑ arrows indicate direction. The prefix is removed at zero speed to
 * avoid noise.
 */
import { useEffect } from "react";
import { useMainDataSync } from "@/hooks/useMainDataSync";
import { formatSpeed } from "@/lib/utils.format";

/** Strip a possibly existing speed prefix (from the arrow up to the base title
 *  "qiubi"; also tolerates the old square-bracket format) */
const SPEED_PREFIX = /^(\[[^\]]*\]\s*|[↑↓].*(?=qiubi))/;

export function useTitleSpeed() {
  const { data } = useMainDataSync(2000);
  const dl = data?.serverState?.dl_info_speed ?? 0;
  const up = data?.serverState?.up_info_speed ?? 0;

  useEffect(() => {
    const base = document.title.replace(SPEED_PREFIX, "");
    if (dl > 0 || up > 0) {
      document.title = `↓ ${formatSpeed(dl)} ↑ ${formatSpeed(up)} ${base}`;
    } else {
      document.title = base;
    }
  }, [dl, up]);
}
