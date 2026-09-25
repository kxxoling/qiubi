/**
 * Global speed history (ring buffer, persisted)
 *
 * Written exclusively by the useMainDataSync polling loop (one sample per
 * serverState update); the StatusBar speed popup and Dashboard charts share
 * the same data. qBT's API has no speed-history endpoint, so this client-side
 * buffer is the only source — persisting it to localStorage keeps the last
 * 15 minutes across page reloads (a reload used to wipe the chart to zero).
 * Background-tab timer throttling still thins samples (Chrome ~1/min); that
 * is unavoidable without a server-side recorder.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SpeedPoint = { t: number; dl: number; up: number };

/** One sample every 2 seconds, keeping at most 15 minutes */
const MAX_SAMPLES = 450;
const MIN_SAMPLE_GAP_MS = 1200;

type SpeedHistoryState = {
  points: SpeedPoint[];
  push: (p: SpeedPoint) => void;
};

export const useSpeedHistory = create<SpeedHistoryState>()(
  persist(
    (set, get) => ({
      points: [],
      push: (p) => {
        const last = get().points[get().points.length - 1];
        if (last && p.t - last.t < MIN_SAMPLE_GAP_MS) return; // guard against duplicate samples
        set({ points: [...get().points, p].slice(-MAX_SAMPLES) });
      },
    }),
    {
      name: "qiubi-speed-history",
      partialize: (s) => ({ points: s.points }),
      // Drop samples older than the buffer window when restoring, so a long
      // absence doesn't stitch a flat line across the gap
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const cutoff = Date.now() - MAX_SAMPLES * 2000;
        state.points = state.points.filter((p) => p.t >= cutoff);
      },
    },
  ),
);
