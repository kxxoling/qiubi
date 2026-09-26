/**
 * Speed history store unit tests — sample deduplication + ring buffer cap
 */
import { beforeEach, describe, expect, test } from "vitest";
import { useSpeedHistory } from "@/stores/speedHistory";

describe("useSpeedHistory", () => {
  beforeEach(() => {
    useSpeedHistory.setState({ points: [] });
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
    push({ t: 1400, dl: 99, up: 99 }); // 0.4s gap < 0.6s threshold, should be dropped
    push({ t: 1700, dl: 20, up: 8 }); // 0.7s after the first, kept
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(2);
    expect(pts[1].dl).toBe(20);
  });

  test("caps history at 900 samples (15 min @ 1s)", () => {
    const { push } = useSpeedHistory.getState();
    for (let i = 0; i < 1000; i++) push({ t: i * 1000, dl: i, up: 0 });
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(900);
    // The newest 900 are kept (the earliest 100 are dropped)
    expect(pts[0].t).toBe(100 * 1000);
    expect(pts[pts.length - 1].t).toBe(999 * 1000);
  });
});
