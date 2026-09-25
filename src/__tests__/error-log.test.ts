/**
 * Unit tests for the persistent client-side error log (localStorage ring buffer).
 */
import { afterEach, describe, expect, test } from "vitest";
import { appendErrorLog, clearErrorLog, getErrorLog, logError } from "@/lib/errorLog";

afterEach(() => {
  clearErrorLog();
});

describe("errorLog", () => {
  test("logError stores entries that survive a (simulated) reload", () => {
    logError("ui", new Error("boom"), "snail toggle failed");
    // localStorage is the persistence layer: re-reading goes through it
    expect(localStorage.getItem("qiubi-error-log")).toBeTruthy();
    const entries = getErrorLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].scope).toBe("ui");
    expect(entries[0].message).toContain("boom");
    expect(entries[0].detail).toBe("snail toggle failed");
    expect(typeof entries[0].time).toBe("string");
  });

  test("appendErrorLog joins multiple parts into message + detail", () => {
    appendErrorLog("api", ["403 forbidden", "body text"]);
    const [entry] = getErrorLog();
    expect(entry.message).toBe("403 forbidden");
    expect(entry.detail).toBe("body text");
  });

  test("ring buffer is capped and clearErrorLog empties it", () => {
    for (let i = 0; i < 130; i++) logError("test", `e${i}`);
    expect(getErrorLog()).toHaveLength(100);
    // Oldest entries dropped, newest kept
    expect(getErrorLog().at(-1)?.message).toBe("e129");
    clearErrorLog();
    expect(getErrorLog()).toHaveLength(0);
  });

  test("non-Error values are stringified without throwing", () => {
    logError("x", "plain string");
    logError("x", { weird: Symbol.for("s") });
    expect(getErrorLog()).toHaveLength(2);
    expect(getErrorLog()[0].message).toBe("plain string");
  });
});
