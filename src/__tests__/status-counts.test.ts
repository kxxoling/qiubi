/**
 * statusCounts — per-status torrent counts for the filter select. Overlapping
 * filters (an uploading torrent is Seeding + Completed + Active + Resumed)
 * must each count it; "all" is the whole list.
 */
import { describe, expect, test } from "vitest";
import { buildTorrent } from "@/__tests__/factories";
import { STATUS_OPTIONS, statusCounts } from "@/lib/torrentStatus";

describe("statusCounts", () => {
  test("counts every overlapping status bucket", () => {
    const counts = statusCounts([
      buildTorrent({ state: "downloading" }),
      buildTorrent({ state: "uploading" }),
      buildTorrent({ state: "stalledDL" }),
      buildTorrent({ state: "stoppedDL" }),
      buildTorrent({ state: "error" }),
    ]);
    expect(counts.all).toBe(5);
    expect(counts.downloading).toBe(2); // downloading + stalledDL
    expect(counts.seeding).toBe(1); // uploading
    expect(counts.completed).toBe(1); // uploading
    expect(counts.stalled).toBe(1); // stalledDL
    expect(counts.paused).toBe(1); // stoppedDL
    expect(counts.pausedDL).toBe(1); // stoppedDL
    expect(counts.active).toBe(2); // downloading + uploading
    expect(counts.inactive).toBe(3);
    expect(counts.resumed).toBe(4); // everything not paused/stopped
    expect(counts.checking).toBe(0);
    expect(counts.error).toBe(1);
  });

  test("returns 0 for every option when there is no data yet", () => {
    const counts = statusCounts(undefined);
    expect(counts.all).toBe(0);
    for (const o of STATUS_OPTIONS) expect(counts[o.value]).toBe(0);
  });
});
