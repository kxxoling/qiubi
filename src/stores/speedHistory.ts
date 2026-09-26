/**
 * Global speed history (in-memory ring buffer)
 *
 * Written exclusively by the useMainDataSync polling loop (one sample per
 * serverState update); the StatusBar speed popup and Dashboard charts share
 * the same data. qBT's API has no speed-history endpoint, so this client-side
 * buffer is the only source.
 *
 * Deliberately not persisted: a restored segment renders a distorted timeline
 * (the charts space points by index, so a reload gap appears as one sample
 * interval), and serializing the buffer to localStorage on every sample cost
 * measurable CPU/GC churn. A reload simply restarts collection — the chart
 * refills within its window.
 *
 * Background-tab timer throttling still thins samples (Chrome ~1/min); that
 * is unavoidable without a server-side recorder.
 */
import { create } from "zustand";

export type SpeedPoint = { t: number; dl: number; up: number };

/** One sample per maindata poll (1s cadence), keeping at most 15 minutes */
const MAX_SAMPLES = 900;
const MIN_SAMPLE_GAP_MS = 600;

type SpeedHistoryState = {
  points: SpeedPoint[];
  push: (p: SpeedPoint) => void;
};

export const useSpeedHistory = create<SpeedHistoryState>()((set, get) => ({
  points: [],
  push: (p) => {
    const last = get().points[get().points.length - 1];
    if (last && p.t - last.t < MIN_SAMPLE_GAP_MS) return; // guard against duplicate samples
    set({ points: [...get().points, p].slice(-MAX_SAMPLES) });
  },
}));
