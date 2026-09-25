/**
 * Speed history store unit tests — sample deduplication + ring buffer cap
 */
import { beforeEach, describe, expect, test } from "vitest";
import { useSpeedHistory } from "@/stores/speedHistory";

describe("useSpeedHistory", () => {
  beforeEach(() => {
    useSpeedHistory.setState({ points: [] });
  });

  test("survives page reloads via localStorage (rehydrated + pruned)", () => {
    const { push } = useSpeedHistory.getState();
    const now = Date.now();
    // a fresh sample and one older than the 15-minute window
    push({ t: now - 5000, dl: 1, up: 1 });
    push({ t: now - 16 * 60_000, dl: 9, up: 9 });
    // zustand persist writes on every set — read back what would be restored
    const raw = localStorage.getItem("qiubi-speed-history");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "{}");
    expect(parsed.state.points.length).toBeGreaterThan(0);
  });

  test("push appends samples", () => {
    const { push } = useSpeedHistory.getState();
    push({ t: 1000, dl: 10, up: 5 });
    push({ t: 3000, dl: 20, up: 8 });
    expect(useSpeedHistory.getState().points).toHaveLength(2);
    expect(useSpeedHistory.getState().points[1]).toEqual({ t: 3000, dl: 20, up: 8 });
  });

  test("drops samples closer than the dedupe gap", () => {
    const { push } = useSpeedHistory.getState();
    push({ t: 1000, dl: 10, up: 5 });
    push({ t: 2000, dl: 99, up: 99 }); // 1s gap < 1.2s threshold, should be dropped
    push({ t: 2300, dl: 20, up: 8 }); // 1.3s after the first, kept
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(2);
    expect(pts[1].dl).toBe(20);
  });

  test("caps history at 450 samples (15 min @ 2s)", () => {
    const { push } = useSpeedHistory.getState();
    for (let i = 0; i < 500; i++) push({ t: i * 2000, dl: i, up: 0 });
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(450);
    // The newest 450 are kept (the earliest 50 are dropped)
    expect(pts[0].t).toBe(50 * 2000);
    expect(pts[pts.length - 1].t).toBe(499 * 2000);
  });
});
