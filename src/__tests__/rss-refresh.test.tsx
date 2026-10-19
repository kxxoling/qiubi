/**
 * RSS refresh outcome reporting: qBT's refreshItem is fire-and-forget, so the
 * page must poll rss/items until the feed settles and then surface hasError
 * instead of toasting success for fetches that failed server-side. hasError
 * is a bare boolean — qBT exposes no machine-readable reason, so the failure
 * toasts are titles only.
 *
 * The page is driven through its real wiring (the "r" hotkey calls
 * refreshOne on the selected feed), with qbtClient stubbed at the method
 * level like rss-select.test.tsx and sonner mocked so toasts are assertable.
 */
import { cleanup, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildFeed } from "@/__tests__/factories";
import { renderPage } from "@/__tests__/test-utils";
import { qbtClient } from "@/api/qbt";
import { RssPage } from "@/pages/rss/index";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

/** Selected row is queried by its ARIA state, not the visual style class */
const selectedRow = () => document.querySelector('[role="treeitem"][aria-selected="true"]');

afterEach(() => {
  cleanup();
  // clearAllMocks also wipes the sonner factory mocks' call history, which
  // restoreAllMocks (spies only) leaves behind between tests
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

/** Wire the page against a feed whose refresh goes loading → final state,
 *  flipping the final state shortly after refreshItem (like the server-side
 *  fetch finishing). */
function stubRefreshFlow(opts: { final: "error" | "healthy" }) {
  let phase: "idle" | "loading" | "final-pending" = "idle";
  const feed = () => {
    const base = buildFeed({ articles: [] });
    if (phase === "loading") return { ...base, isLoading: true };
    if (phase === "final-pending")
      return opts.final === "error" ? { ...base, isLoading: false, hasError: true } : base;
    return base;
  };
  vi.spyOn(qbtClient, "getRssItems").mockImplementation(async () => ({ TechBlog: feed() }));
  vi.spyOn(qbtClient, "getPreferences").mockResolvedValue({} as never);
  vi.spyOn(qbtClient, "refreshRssItem").mockImplementation(async () => {
    phase = "loading";
    setTimeout(() => {
      phase = "final-pending";
    }, 10);
  });
  return { pressRefresh: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" })) };
}

describe("RssPage refresh outcome", () => {
  test("toasts failure when the feed settles with hasError", async () => {
    const { pressRefresh } = stubRefreshFlow({ final: "error" });
    // the loading toast's id is what swaps the spinner into the result
    vi.mocked(toast.loading).mockReturnValueOnce(7);

    renderPage(<RssPage />);
    await waitFor(() => expect(selectedRow()?.textContent).toContain("TechBlog"));

    pressRefresh();
    // spinner toast fires immediately, then resolves into the failure
    expect(toast.loading).toHaveBeenCalledWith("Refreshing…");
    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Refresh failed", { id: 7 }),
    );
    // the settled error state also marks the row (tooltip, like the official UI)
    await waitFor(() =>
      expect(selectedRow()?.getAttribute("title")).toBe(
        "Feed failed to refresh — see the server execution log",
      ),
    );
  });

  test("still toasts success when the feed refreshes cleanly", async () => {
    const { pressRefresh } = stubRefreshFlow({ final: "healthy" });
    vi.mocked(toast.loading).mockReturnValueOnce(3);

    renderPage(<RssPage />);
    await waitFor(() => expect(selectedRow()?.textContent).toContain("TechBlog"));

    pressRefresh();
    await waitFor(() =>
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Refreshed", { id: 3 }),
    );
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });
});
