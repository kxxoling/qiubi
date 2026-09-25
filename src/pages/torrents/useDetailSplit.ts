/**
 * Detail-panel split state: collapsed flag + flex ratio + custom mousemove
 * drag (more reliable than the library's Separator for this vertical split).
 * Both values persist to localStorage.
 */
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDetailSplit() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("qiubi-detail-collapsed") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem("qiubi-detail-collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const [flex, setFlex] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qiubi-detail-flex") || "null");
      return typeof saved === "number" ? Math.min(Math.max(saved, 15), 85) : 65;
    } catch {
      return 65;
    }
  });
  const flexRef = useRef(flex);
  flexRef.current = flex;
  const splitRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      const pct = Math.min(Math.max(((ev.clientY - rect.top) / rect.height) * 100, 12), 88);
      setFlex(pct);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      localStorage.setItem("qiubi-detail-flex", JSON.stringify(flexRef.current));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, []);

  return { collapsed, setCollapsed, flex, splitRef, startDrag };
}
