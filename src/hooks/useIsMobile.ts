/**
 * Mobile breakpoint detection (<768px, matching the Tailwind md breakpoint)
 *
 * Used for conditional rendering that pure CSS can't handle, such as
 * table/card and split-pane/drawer switches; purely stylistic differences
 * still use Tailwind's md: prefix.
 */
import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
