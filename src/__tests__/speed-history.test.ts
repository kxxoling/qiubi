/**
 * Speed history store unit tests — sample deduplication + ring buffer cap
 */
import { beforeEach, describe, expect, test } from "vitest";
import { useSpeedHistory } from "@/stores/speedHistory";

/** Realistic wall-clock anchor: t values are real timestamps (consumers filter
 *  by them, e.g. the Dashboard time-range cutoff), so tests anchor near now —
 *  the store itself only ever compares deltas. */
const T0 = Date.now() - 16 * 60_000;

describe("useSpeedHistory", () => {
  beforeEach(() => {
    useSpeedHistory.setState({ points: [] });
  });

  test("push appends samples", () => {
    const { push } = useSpeedHistory.getState();
    push({ t: T0, dl: 10, up: 5 });
    push({ t: T0 + 2000, dl: 20, up: 8 });
    expect(useSpeedHistory.getState().points).toHaveLength(2);
    expect(useSpeedHistory.getState().points[1]).toEqual({ t: T0 + 2000, dl: 20, up: 8 });
  });

  test("drops samples closer than the dedupe gap", () => {
    const { push } = useSpeedHistory.getState();
    push({ t: T0, dl: 10, up: 5 });
    push({ t: T0 + 400, dl: 99, up: 99 }); // 0.4s gap < 0.6s threshold, should be dropped
    push({ t: T0 + 700, dl: 20, up: 8 }); // 0.7s after the first, kept
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(2);
    expect(pts[1].dl).toBe(20);
  });

  test("caps history at 900 samples (15 min @ 1s)", () => {
    const { push } = useSpeedHistory.getState();
    for (let i = 0; i < 1000; i++) push({ t: T0 + i * 1000, dl: i, up: 0 });
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(900);
    // The newest 900 are kept (the earliest 100 are dropped)
    expect(pts[0].t).toBe(T0 + 100 * 1000);
    expect(pts[pts.length - 1].t).toBe(T0 + 999 * 1000);
  });
});
