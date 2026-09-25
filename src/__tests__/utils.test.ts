import { describe, expect, test } from "vitest";
import { formatBytes, formatEta, formatSpeed, torrentStateLabel } from "@/lib/utils.format";

describe("formatBytes", () => {
  test("0 bytes", () => expect(formatBytes(0)).toBe("0 B"));
  test("1024 bytes → 1 KB", () => expect(formatBytes(1024)).toBe("1.0 KB"));
  test("1048576 bytes → 1 MB", () => expect(formatBytes(1048576)).toBe("1.0 MB"));
  test("NaN → 0 B", () => expect(formatBytes(Number.NaN)).toBe("0 B"));
});

describe("formatSpeed", () => {
  test("formats with /s suffix", () => {
    expect(formatSpeed(1024)).toBe("1.0 KB/s");
  });
});

describe("formatEta", () => {
  test("infinity", () => expect(formatEta(-1)).toBe("∞"));
  test("seconds only", () => expect(formatEta(30)).toBe("30s"));
  test("minutes + seconds", () => expect(formatEta(125)).toBe("2m 5s"));
  test("hours + minutes", () => expect(formatEta(3665)).toBe("1h 1m"));
  test("days + hours", () => expect(formatEta(90061)).toBe("1d 1h"));
});

describe("torrentStateLabel", () => {
  test("known states", () => {
    expect(torrentStateLabel("downloading")).toBe("Downloading");
    expect(torrentStateLabel("uploading")).toBe("Seeding");
    expect(torrentStateLabel("pausedDL")).toBe("Paused");
    expect(torrentStateLabel("error")).toBe("Error");
  });
  test("unknown state passes through", () => {
    expect(torrentStateLabel("custom")).toBe("custom");
  });
});
