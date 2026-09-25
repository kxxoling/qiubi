/**
 * Regression tests for the shared maindata sync query.
 *
 * The header speed and the tab-title speed both read this one query; TanStack
 * pauses interval refetches while the window is unfocused unless
 * refetchIntervalInBackground is set, which froze the speeds in a background
 * tab.
 */
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { qbtClient } from "@/api/qbt";
import { useMainDataSync } from "@/hooks/useMainDataSync";
import { useTitleSpeed } from "@/hooks/useTitleSpeed";

vi.mock("@/api/qbt", () => ({
  qbtClient: { getSyncMainData: vi.fn() },
}));

const getSyncMainData = vi.mocked(qbtClient.getSyncMainData);

let calls = 0;
getSyncMainData.mockImplementation(async () => {
  calls += 1;
  return {
    rid: calls,
    full_update: true,
    server_state: {
      dl_info_speed: 1024 * 1024,
      up_info_speed: 512 * 1024,
      connection_status: "connected",
    },
  };
});

const createWrapper =
  (client: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

afterEach(() => {
  focusManager.setFocused(true);
});

describe("useMainDataSync background polling", () => {
  test("keeps polling after the window loses focus (background tab)", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(() => useMainDataSync(20), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(2));

    await act(async () => {
      focusManager.setFocused(false); // simulate switching to another tab
    });

    const atBlur = calls;
    await waitFor(() => expect(calls).toBeGreaterThan(atBlur), { timeout: 1000 });

    unmount();
    client.clear();
  });

  test("useTitleSpeed exposes the speeds in document.title", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(() => useTitleSpeed(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(document.title).toContain("↓"));

    unmount();
    client.clear();
  });
});
