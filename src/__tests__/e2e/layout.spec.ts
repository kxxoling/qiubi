import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Global layout E2E — tab navigation bar, About dialog, panel-drag isolation
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/");
});

test("tab nav has centered global search and add torrent on the right", async ({ page }) => {
  const nav = page.locator("nav").first();
  await expect(nav.getByRole("button", { name: /Global Search/ })).toBeVisible();
  await expect(nav.getByRole("button", { name: /New Download Task/ })).toBeVisible();
  // The five tabs sit to the left of the search button
  const lastTab = await nav.locator("a").last().boundingBox();
  const search = await nav.getByRole("button", { name: /Global Search/ }).boundingBox();
  expect(lastTab && search && lastTab.x + lastTab.width < search.x).toBe(true);
});

test("help menu opens About dialog with versions", async ({ page }) => {
  await page.getByText("Help", { exact: true }).click();
  await page.getByRole("menuitem", { name: /^About/ }).click();
  const dialog = page.locator("[role=dialog]");
  await expect(dialog).toBeVisible();
  // Both the qiubi and qBT versions look like v\d.\d.\d (the qBT version comes
  // from the API with a loading delay), so asserting one is enough
  await expect(dialog.getByText(/^v\d+\.\d+\.\d+$/).first()).toBeVisible();
  await expect(dialog.getByText(/github\.com\/kxxoling\/qiubi/)).toBeVisible();
});

test("dragging detail panel handle does not trigger row selection", async ({ page }) => {
  // The default mocked maindata has no torrents (empty-state row); override
  // with two entries and reload
  const torrents = {
    hash1: {
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
      num_incomplete: 3,
    },
    hash2: {
      hash: "hash2",
      name: "Sintel",
      size: 104857600,
      progress: 1,
      dlspeed: 0,
      upspeed: 204800,
      eta: 0,
      state: "uploading",
      category: "movies",
      tags: "",
      save_path: "/downloads",
      added_on: 1700000001,
      completion_on: 1700000500,
      ratio: 2.1,
      num_complete: 0,
      num_incomplete: 8,
    },
  };
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rid: 1,
        full_update: true,
        torrents,
        categories: {},
        tags: [],
        server_state: {
          dl_info_speed: 0,
          up_info_speed: 0,
          dht_nodes: 0,
          connection_status: "connected",
        },
      }),
    }),
  );
  await page.reload();
  await page.locator("tbody tr").first().waitFor({ timeout: 5000 });
  await page.locator("tbody tr").first().click();
  await page.locator("[data-slot=detail-panel-root]").waitFor({ timeout: 5000 });
  const baseline = await page.getByText(/\d+ selected/).innerText();

  const handle = page.locator(".cursor-row-resize").first();
  const hb = await handle.boundingBox();
  if (!hb) throw new Error("handle not visible");
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2, hb.y - 60, { steps: 5 });
  await page.mouse.up();

  // Selection count unchanged, no marquee-selection rectangle appears
  await expect(page.getByText(/\d+ selected/)).toHaveText(baseline);
  expect(await page.locator(".border-primary\\/60").count()).toBe(0);
});
