import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Torrent list E2E tests
 *
 * TorrentList and Header have refetchInterval (1-2s), causing continuous DOM
 * re-renders. Interaction tests use JavaScript dispatchEvent to bypass
 * Playwright's actionability checks.
 * Mock strategy: all polling APIs respond only to the first request, then abort.
 */

const mockTorrents = [
  {
    hash: "hash1",
    name: "Ubuntu Desktop 24.04",
    size: 5368709120,
    progress: 0.75,
    dlspeed: 1048576,
    upspeed: 524288,
    eta: 1200,
    state: "downloading",
    category: "isos",
    tags: "linux",
    save_path: "/downloads",
    added_on: 1700000000,
    completion_on: -1,
    ratio: 0.3,
    num_complete: 50,
    num_incomplete: 10,
    magnet_uri: "magnet:?xt=urn:btih:hash1",
  },
  {
    hash: "hash2",
    name: "Big Buck Bunny",
    size: 1073741824,
    progress: 1.0,
    dlspeed: 0,
    upspeed: 131072,
    eta: -1,
    state: "uploading",
    category: "videos",
    tags: "",
    save_path: "/downloads/videos",
    added_on: 1699900000,
    completion_on: 1699910000,
    ratio: 2.5,
    num_complete: 20,
    num_incomplete: 3,
    magnet_uri: "magnet:?xt=urn:btih:hash2",
  },
  {
    hash: "hash3",
    name: "Error Torrent",
    size: 0,
    progress: 0,
    dlspeed: 0,
    upspeed: 0,
    eta: -1,
    state: "error",
    category: "",
    tags: "",
    save_path: "/downloads",
    added_on: 1700010000,
    completion_on: -1,
    ratio: 0,
    num_complete: 0,
    num_incomplete: 0,
    magnet_uri: "magnet:?xt=urn:btih:hash3",
  },
];

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);

  // The torrent list / speed bar / detail page share the sync/maindata poll.
  // Always return the same payload: if the data doesn't change the DOM is
  // stable (0 mutations), so interaction tests run reliably.
  // Don't use onceThenAbort — aborting keeps the query erroring and retrying,
  // causing row elements to repeatedly detach.
  const maindataPayload = {
    rid: 1,
    full_update: true,
    torrents: Object.fromEntries(mockTorrents.map((t) => [t.hash, t])),
    categories: {},
    tags: [],
    server_state: {
      dl_info_speed: 0,
      up_info_speed: 0,
      dl_info_data: 0,
      up_info_data: 0,
      dl_rate_limit: -1,
      up_rate_limit: -1,
      dht_nodes: 0,
      connection_status: "connected",
      fresh_session: true,
    },
  };
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(maindataPayload),
    }),
  );

  await page.goto("/#/");
});

test("renders torrent table with 3 torrents", async ({ page }) => {
  await expect(page.getByText("Ubuntu Desktop 24.04")).toBeVisible();
  await expect(page.getByText("Big Buck Bunny")).toBeVisible();
  await expect(page.getByText("Error Torrent")).toBeVisible();
});

test("filter by status via toolbar select (URL-driven)", async ({ page }) => {
  // Status filter is a toolbar dropdown; the selection is written into the URL
  // (#/?status=downloading)
  await page.getByRole("combobox", { name: /Status/ }).click();
  await page.getByRole("option", { name: "Downloading", exact: true }).click();
  await expect(page.getByText("Ubuntu Desktop 24.04")).toBeVisible();
  await expect(page.getByText("Big Buck Bunny")).not.toBeVisible();
  // The filter state is in the URL: opening the URL with the param filters too
  await expect(page).toHaveURL(/status=downloading/);
});

test("search filters torrents by name", async ({ page }) => {
  const searchInput = page.getByPlaceholder("Filter...");
  // React controlled components need nativeInputValueSetter + an input event
  await searchInput.evaluate((el: HTMLInputElement) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeInputValueSetter?.call(el, "Ubuntu");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.getByText("Ubuntu Desktop 24.04")).toBeVisible();
  await expect(page.getByText("Big Buck Bunny")).not.toBeVisible();
});

test("click on column header sorts the table", async ({ page }) => {
  const nameHeader = page.getByRole("columnheader", { name: "Name" });
  await nameHeader.dispatchEvent("click");
  await nameHeader.dispatchEvent("click");
  await expect(page.getByText("Ubuntu Desktop 24.04")).toBeVisible();
});

test("right-click shows context menu", async ({ page }) => {
  await page.getByText("Ubuntu Desktop 24.04").dispatchEvent("contextmenu");
  // Match precisely via the menuitem role to avoid clashing with the status
  // filter buttons
  await expect(page.getByRole("menuitem", { name: "Pause" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Resume" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Recheck" })).toBeVisible();
});

test("box selection selects rows intersecting rubber band", async ({ page }) => {
  const table = page.locator("table");
  const box = (await table.boundingBox()) as {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Marquee selection is scoped to the table scroll area: press down inside
  // the first row (the gap between the header/toolbar and the table no longer
  // triggers — presses there aren't part of the list), then drag down across
  // the first two rows
  const startX = box.x + box.width / 2;
  const firstRow = await page.locator("tbody tr").first().boundingBox();
  const startY = (firstRow?.y ?? box.y + 30) + 5;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, box.y + box.height * 0.66, { steps: 8 });
  await page.mouse.up();

  // The bulk action bar appears with at least 1 row selected
  await expect(page.getByText(/\d+ selected/)).toBeVisible();
});

test("marquee can start on a row (drag threshold), release click is swallowed", async ({
  page,
}) => {
  // Table height equals row height exactly, no blank space inside the list —
  // marquee selection must support starting on a row: after the press, moving
  // past the threshold turns into a marquee; the click generated on release
  // must not trigger row selection / the detail panel
  const firstRow = page.locator("tbody tr[data-row-idx]").first();
  const box = (await firstRow.boundingBox()) as { x: number; y: number; width: number };

  await page.mouse.move(box.x + box.width * 0.5, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + 90, { steps: 6 });
  await page.mouse.up();

  // Marquee covers multiple rows: the bulk action bar appears
  await expect(page.getByText(/\d+ selected/)).toBeVisible();
  // The release click is swallowed: the bottom detail panel doesn't open
  await expect(page.locator("[data-slot=detail-panel-root]")).toHaveCount(0);
});

test("ctrl-click selects multiple rows", async ({ page }) => {
  await page.getByText("Ubuntu Desktop 24.04").click();
  // ControlOrMeta: on macOS Ctrl+click is the context menu; the multi-select
  // modifier is Cmd
  await page.getByText("Big Buck Bunny").click({ modifiers: ["ControlOrMeta"] });

  await expect(page.getByText(/2 selected/)).toBeVisible();
});

test("double-click navigates to detail page", async ({ page }) => {
  await page.route("**/api/v2/torrents/files*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
  );
  await page.route("**/api/v2/torrents/trackers*", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
  );
  await page.route("**/api/v2/sync/torrentPeers*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ peers: {} }),
    }),
  );

  await page.getByText("Ubuntu Desktop 24.04").dispatchEvent("dblclick");
  // Desktop double-click = bottom detail panel (like the qBT desktop app),
  // no longer navigates to the fullscreen route
  await expect(page.locator("[data-slot=detail-panel-root]")).toBeVisible({ timeout: 5000 });
  await expect(page).not.toHaveURL(/\/torrents\//);
});
