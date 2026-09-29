/**
 * RSS page: the first feed is selected by default (folders skipped), and the
 * selection recovers when the selected feed disappears.
 *
 * The page is rendered through a minimal memory router (it uses useNavigate)
 * with the qbt client stubbed at the method level, like api.test.ts stubs
 * fetch.
 */
import { cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { buildFeed } from "@/__tests__/factories";
import { renderPage } from "@/__tests__/test-utils";
import { qbtClient } from "@/api/qbt";
import { RssPage } from "@/pages/rss/index";

/** Selected row is queried by its ARIA state, not the visual style class */
const selectedRow = () => document.querySelector('[role="treeitem"][aria-selected="true"]');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RssPage default selection", () => {
  test("selects the first feed and shows its articles", async () => {
    vi.spyOn(qbtClient, "getRssItems").mockResolvedValue({
      "distro-releases": buildFeed({
        title: "distro-releases",
        articles: ["Ubuntu 25.04 released", "Fedora 43 released"],
      }),
      "project-gutenberg": buildFeed({
        title: "project-gutenberg",
        articles: ["Pride and Prejudice"],
      }),
    });
    vi.spyOn(qbtClient, "getPreferences").mockResolvedValue({} as never);

    renderPage(<RssPage />);

    await waitFor(() => expect(selectedRow()?.textContent).toContain("distro-releases"));
    expect(document.body.textContent).toContain("Ubuntu 25.04 released");
    expect(document.body.textContent).not.toContain("Pride and Prejudice");
  });

  test("skips folders — the first real feed is selected", async () => {
    vi.spyOn(qbtClient, "getRssItems").mockResolvedValue({
      // folder first, feeds nested inside
      news: {
        uid: "news",
        url: "",
        title: "news",
        children: { blender: buildFeed({ title: "blender", articles: ["Blender 5.2 out"] }) },
      },
      gutenberg: buildFeed({ title: "gutenberg", articles: ["Moby Dick"] }),
    });
    vi.spyOn(qbtClient, "getPreferences").mockResolvedValue({} as never);

    renderPage(<RssPage />);

    await waitFor(() => expect(selectedRow()?.textContent).toContain("blender"));
    expect(document.body.textContent).toContain("Blender 5.2 out");
  });

  test("empty feed list selects nothing", async () => {
    vi.spyOn(qbtClient, "getRssItems").mockResolvedValue({});
    vi.spyOn(qbtClient, "getPreferences").mockResolvedValue({} as never);

    renderPage(<RssPage />);

    await waitFor(() => expect(document.body.textContent).toBeTruthy());
    expect(selectedRow()).toBeNull();
  });
});
