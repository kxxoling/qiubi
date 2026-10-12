import { buildTorrent } from "../factories";
import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Sidebar (FilterSidebar) E2E tests — row context menus + section collapsing
 *
 * Every row carries the qBT torrent ops scoped to its torrents, including the
 * pseudo rows (All/Uncategorized/Untagged/Trackerless); custom category/tag
 * rows additionally offer remove-unused management. Section headers
 * collapse/expand their rows (the tracker list especially can grow long).
 * The sync/maindata poll answers with a constant payload so the DOM is stable.
 */

const trackerUrl = "https://tracker.example.com/announce";

// Torrent bodies come from the shared typed factory; only the fields the
// sidebar logic reads (hash/category/tags/tracker + the row label) are set
const mockTorrents = [
  buildTorrent({
    hash: "hash1",
    name: "Movie One",
    state: "uploading",
    progress: 1,
    category: "movies",
    tags: "",
    tracker: trackerUrl,
  }),
  buildTorrent({
    hash: "hash2",
    name: "Movie Two",
    state: "downloading",
    progress: 0.4,
    category: "movies",
    tags: "",
    tracker: trackerUrl,
  }),
  // uncategorized / untagged / trackerless: exercises the pseudo-row scopes
  buildTorrent({
    hash: "hash3",
    name: "Standalone",
    state: "pausedUP",
    progress: 1,
    category: "",
    tags: "",
    tracker: "",
  }),
];

const maindataPayload = {
  rid: 1,
  full_update: true,
  torrents: Object.fromEntries(mockTorrents.map((t) => [t.hash, t])),
  categories: {
    movies: { name: "movies", savePath: "/downloads/movies" },
    empty: { name: "empty", savePath: "" },
  },
  tags: [],
  // tracker URL → member hashes: drives the tracker sidebar rows
  trackers: { [trackerUrl]: ["hash1", "hash2"] },
  server_state: {
    dl_info_speed: 0,
    up_info_speed: 0,
    dl_info_data: 0,
    up_info_data: 0,
    dht_nodes: 0,
    connection_status: "connected",
  },
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(maindataPayload),
    }),
  );
  await page.goto("/#/");
});

/** The sidebar row button for a filter label (icon + label + count inside one button) */
const sidebarRow = (page: import("@playwright/test").Page, label: string) =>
  page.getByRole("button", { name: new RegExp(`^${label}`) });

/** maindata payload variant where hash1 carries the tag "anime" and an unused tag exists */
const taggedMaindataPayload = {
  ...maindataPayload,
  tags: ["anime", "unused"],
  torrents: {
    hash1: { ...mockTorrents[0], tags: "anime" },
    hash2: { ...mockTorrents[1], tags: "" },
  },
};

test("category row menu lists torrent ops and category management", async ({ page }) => {
  await sidebarRow(page, "movies").dispatchEvent("contextmenu");
  await expect(page.getByRole("menuitem", { name: "Resume Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Pause Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Remove Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Remove Unused Categories" })).toBeVisible();
});

test("pause from category menu posts the category's hashes", async ({ page }) => {
  const bodies: string[] = [];
  // pauseTorrents prefers the 5.x /torrents/stop endpoint (unknown server version)
  await page.route("**/api/v2/torrents/stop", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });

  await sidebarRow(page, "movies").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Pause Torrents" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("hashes=hash1%7Chash2");
});

test("remove torrents opens the shared delete confirmation", async ({ page }) => {
  await sidebarRow(page, "movies").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Remove Torrents" }).click();
  await expect(page.getByText("Delete 2 torrent(s)?")).toBeVisible();
});

test("remove unused categories posts only the empty ones", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/v2/torrents/removeCategories", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });

  await sidebarRow(page, "movies").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Remove Unused Categories" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("categories=empty");
});

test("tracker row menu has the torrent ops only", async ({ page }) => {
  await sidebarRow(page, "tracker.example.com").dispatchEvent("contextmenu");
  await expect(page.getByRole("menuitem", { name: "Resume Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Pause Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Remove Torrents" })).toBeVisible();
  // management items belong to category/tag rows, not tracker rows
  await expect(page.getByRole("menuitem", { name: "Remove Unused Categories" })).toHaveCount(0);
});

test("resume from tracker menu posts the tracker's hashes", async ({ page }) => {
  const bodies: string[] = [];
  // resumeTorrents prefers the 5.x /torrents/start endpoint
  await page.route("**/api/v2/torrents/start", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });

  await sidebarRow(page, "tracker.example.com").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Resume Torrents" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("hashes=hash1%7Chash2");
});

test("tracker section collapses and expands via header click", async ({ page }) => {
  const trackerRow = sidebarRow(page, "tracker.example.com");
  await expect(trackerRow).toBeVisible();

  // Collapsing hides the tracker rows while the other sections stay put
  await page.getByRole("button", { name: "Tracker", exact: true }).click();
  await expect(trackerRow).toHaveCount(0);
  await expect(sidebarRow(page, "movies")).toBeVisible();

  await page.getByRole("button", { name: "Tracker", exact: true }).click();
  await expect(trackerRow).toBeVisible();
});

test("tags section renders even without any tags", async ({ page }) => {
  // Shared payload has tags: []; the section must still show (All/Untagged)
  await expect(page.getByRole("button", { name: "Tags", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Untagged/ })).toBeVisible();
});

test("pseudo rows (All/Uncategorized/Untagged/Trackerless) have torrent-ops menus", async ({
  page,
}) => {
  const rows: [section: string, row: RegExp][] = [
    ["Category", /^All/],
    ["Category", /^Uncategorized/],
    ["Tags", /^All/],
    ["Tags", /^Untagged/],
    ["Tracker", /^All/],
    ["Tracker", /^Trackerless/],
  ];
  for (const [sectionName, row] of rows) {
    const section = page.locator("aside > div").filter({
      has: page.getByRole("button", { name: sectionName, exact: true }),
    });
    await section.getByRole("button", { name: row }).dispatchEvent("contextmenu");
    await expect(page.getByRole("menuitem", { name: "Resume Torrents" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Pause Torrents" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Remove Torrents" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("pause from trackerless row posts only the trackerless torrent's hash", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/v2/torrents/stop", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });

  const trackerSection = page.locator("aside > div").filter({
    has: page.getByRole("button", { name: "Tracker", exact: true }),
  });
  await trackerSection.getByRole("button", { name: /^Trackerless/ }).dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Pause Torrents" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("hashes=hash3");
});

test("tag row menu lists tag management above the torrent ops", async ({ page }) => {
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(taggedMaindataPayload),
    }),
  );
  await page.reload();

  await sidebarRow(page, "anime").dispatchEvent("contextmenu");
  await expect(page.getByRole("menuitem", { name: "Delete Unused Tags" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Resume Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Pause Torrents" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Remove Torrents" })).toBeVisible();
});

test("pause from tag row posts only that tag's hashes", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/v2/torrents/stop", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(taggedMaindataPayload),
    }),
  );
  await page.reload();

  await sidebarRow(page, "anime").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Pause Torrents" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("hashes=hash1");
});

test("delete unused tags posts only the unused ones", async ({ page }) => {
  const bodies: string[] = [];
  await page.route("**/api/v2/torrents/deleteTags", (route) => {
    bodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, body: "Ok." });
  });
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(taggedMaindataPayload),
    }),
  );
  await page.reload();

  await sidebarRow(page, "anime").dispatchEvent("contextmenu");
  await page.getByRole("menuitem", { name: "Delete Unused Tags" }).click();
  await expect.poll(() => bodies.length).toBeGreaterThan(0);
  expect(bodies[0]).toBe("tags=unused");
});
