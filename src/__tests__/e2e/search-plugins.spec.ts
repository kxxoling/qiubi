import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Search plugin management E2E tests
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/#/search");
});

test("search page renders", async ({ page }) => {
  await expect(page.getByPlaceholder(/Search torrents/i)).toBeVisible();
});

test("manage plugins button opens dialog", async ({ page }) => {
  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  await expect(page.getByRole("heading", { name: /Manage Plugins/i })).toBeVisible();
});

test("plugin list shows installed plugins", async ({ page }) => {
  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  // Plugin names inside the dialog
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("The Pirate Bay")).toBeVisible();
  await expect(dialog.getByText("Legit Torrents")).toBeVisible();
});

test("enabled/disabled badges visible", async ({ page }) => {
  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Enabled", { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText("Disabled", { exact: true })).toBeVisible();
});

test("install plugin input exists", async ({ page }) => {
  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  await expect(page.getByPlaceholder(/Plugin URL/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Install/i })).toBeVisible();
});

test("uninstall plugin button works", async ({ page }) => {
  await page.route("**/api/v2/search/uninstallPlugin", (route) =>
    route.fulfill({ status: 200, body: "Ok." }),
  );

  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  const dialog = page.getByRole("dialog");
  const uninstallButtons = dialog.locator("button:has(.lucide-trash-2)");
  await expect(uninstallButtons.first()).toBeVisible();
});
