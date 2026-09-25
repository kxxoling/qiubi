import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Settings page E2E tests — sectioned layout (same as the qBT desktop app)
 */

const mockPrefs = {
  listen_port: 6881,
  upnp: true,
  dl_limit: 0,
  up_limit: 0,
  max_connec: 500,
  max_connec_per_torrent: 100,
  dht: true,
  pex: true,
  save_path: "/downloads",
  add_stopped_enabled: false,
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/app/preferences", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockPrefs),
    }),
  );
  await page.goto("/#/settings");
});

test("displays section navigation", async ({ page }) => {
  // Five section nav entries on the left
  for (const name of ["Downloads", "Connection", "Speed", "BitTorrent", "Web UI"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
});

test("behavior section shows by default", async ({ page }) => {
  await expect(page.getByText("UI Language")).toBeVisible();
  await expect(page.getByText("qBittorrent Language")).toBeVisible();
});

test("shows listening port value", async ({ page }) => {
  // Switch to the Connection section
  await page.getByRole("button", { name: "Connection", exact: true }).click();
  const portInput = page.locator('input[type="number"]').first();
  await expect(portInput).toHaveValue("6881");
});

test("shows save path input", async ({ page }) => {
  await page.getByRole("button", { name: "Downloads", exact: true }).click();
  const savePathInput = page.locator('input[value="/downloads"]');
  await expect(savePathInput).toBeVisible();
});

test("webui section has username field", async ({ page }) => {
  await page.getByRole("button", { name: "Web UI", exact: true }).click();
  await expect(page.getByText("Username").locator("..").locator("input")).toBeVisible();
});

test("save button exists", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Save/i })).toBeVisible();
});

test("sub-options stay visible when parent toggle is unchecked", async ({ page }) => {
  await page.getByRole("button", { name: "BitTorrent", exact: true }).click();
  // Sub-options are always visible (like qBT), no longer tied to the parent toggle
  await expect(page.getByText("Max active downloads")).toBeVisible();
  const row = page.locator("label", { hasText: /queueing/i }).first();
  const box = row.locator('input[type="checkbox"]');
  if ((await box.count()) > 0) await box.uncheck();
  await expect(page.getByText("Max active downloads")).toBeVisible();
});
