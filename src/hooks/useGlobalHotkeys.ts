/**
 * Global hotkeys hook
 *
 * Cmd+K command palette, Cmd+1~7 page switching, Cmd+Shift+N add torrent
 */

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { openCommandPalette } from "@/components/CommandPalette";

// Cmd+1~8 page switching (qBT layout: torrent list is the main view)
const pageRoutes = ["/", "/dashboard", "/categories", "/rss", "/search", "/log", "/settings"];

/** Callback to open the add-torrent dialog, registered by AddTorrentDialog */
let addTorrentOpener: (() => void) | null = null;

/** Register the add-torrent dialog opener function */
export function registerAddTorrentOpener(fn: (() => void) | null) {
  addTorrentOpener = fn;
}

export function useGlobalHotkeys() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+K command palette
      if (mod && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
        return;
      }

      // Cmd+Shift+N add torrent
      // Cmd/Ctrl+J: add torrent (Shift+Cmd+N collided with browser new-window)
      if (mod && !e.shiftKey && e.key === "j") {
        e.preventDefault();
        addTorrentOpener?.();
        return;
      }

      // Cmd+1~7 switch page
      if (mod && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const idx = Number.parseInt(e.key, 10) - 1;
        if (pageRoutes[idx]) {
          navigate({ to: pageRoutes[idx] });
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
