/**
 * Regression tests for the shared maindata sync query.
 *
 * The header speed and the tab-title speed both read this one query; TanStack
 * pauses interval refetches while the window is unfocused unless
 * refetchIntervalInBackground is set, which froze the speeds in a background
 * tab.
 *
 * The API is stubbed at the client-method level (vi.spyOn, like api.test.ts
 * spies on fetch) so everything except getSyncMainData stays real.
 */
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { qbtClient } from "@/api/qbt";
import { useMainDataSync } from "@/hooks/useMainDataSync";
import { useTitleSpeed } from "@/hooks/useTitleSpeed";
import { useSpeedHistory } from "@/stores/speedHistory";

/** Stub getSyncMainData: every call returns a fresh rid (like the server) with
 *  constant speeds; returns a call counter. Restored by afterEach. */
function stubMaindata() {
  let calls = 0;
  vi.spyOn(qbtClient, "getSyncMainData").mockImplementation(async () => ({
    rid: ++calls,
    full_update: true,
    server_state: {
      dl_info_speed: 1024 * 1024,
      up_info_speed: 512 * 1024,
      connection_status: "connected" as const,
    },
  }));
  return () => calls;
}

const createWrapper =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

afterEach(() => {
  focusManager.setFocused(true);
  vi.restoreAllMocks();
});

describe("useMainDataSync background polling", () => {
  test("speed history samples only present, changed server_state speeds", async () => {
    useSpeedHistory.setState({ points: [] });
    const responses = [
      { rid: 1, full_update: true, server_state: { dl_info_speed: 100, up_info_speed: 50 } },
      // delta without speed fields → no sample (absence must not become 0)
      { rid: 2, server_state: { dht_nodes: 5 } },
      // identical speeds re-sent → still one sample
      { rid: 3, server_state: { dl_info_speed: 100, up_info_speed: 50 } },
      // changed → second sample
      { rid: 4, server_state: { dl_info_speed: 120, up_info_speed: 50 } },
    ];
    let i = 0;
    const spy = vi.spyOn(qbtClient, "getSyncMainData").mockImplementation(async () => {
      const res = responses[Math.min(i, responses.length - 1)];
      i += 1;
      return {
        ...res,
        torrents: {},
        categories: {},
        tags: [],
        trackers: {},
      } as Awaited<ReturnType<typeof qbtClient.getSyncMainData>>;
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // 250ms cadence keeps consecutive samples past the store's 600ms gap guard
    const { unmount } = renderHook(() => useMainDataSync(250), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThanOrEqual(4), { timeout: 4000 });
    await act(async () => {
      await Promise.resolve();
    });
    const pts = useSpeedHistory.getState().points;
    expect(pts).toHaveLength(2);
    expect(pts[0]).toMatchObject({ dl: 100, up: 50 });
    expect(pts[1]).toMatchObject({ dl: 120, up: 50 });

    unmount();
    client.clear();
  });

  test("keeps polling after the window loses focus (background tab)", async () => {
    const callCount = stubMaindata();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(() => useMainDataSync(20), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(callCount()).toBeGreaterThanOrEqual(2));

    await act(async () => {
      focusManager.setFocused(false); // simulate switching to another tab
    });

    const atBlur = callCount();
    await waitFor(() => expect(callCount()).toBeGreaterThan(atBlur), { timeout: 1000 });

    unmount();
    client.clear();
  });

  test("useTitleSpeed exposes the speeds in document.title", async () => {
    stubMaindata();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(() => useTitleSpeed(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(document.title).toContain("↓"));

    unmount();
    client.clear();
  });
});
