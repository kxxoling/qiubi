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

test("plugins select lists special options separated from individual plugins", async ({ page }) => {
  const trigger = page.getByRole("combobox", { name: "Plugins" });
  await expect(trigger).toHaveText(/Only enabled/i);
  await trigger.click();
  await expect(page.getByRole("option", { name: "Only enabled", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "All plugins", exact: true })).toBeVisible();
  // Enabled plugins only, alphabetically
  await expect(page.getByRole("option", { name: "The Pirate Bay", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "Legit Torrents" })).toHaveCount(0);
  // Separator between the two special options and the plugin list
  await expect(page.locator("[data-slot='select-separator']")).toBeVisible();
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

test("status column switches reflect plugin state and toggle it", async ({ page }) => {
  const enableBodies: string[] = [];
  await page.route("**/api/v2/search/enablePlugin", (route) => {
    enableBodies.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, contentType: "text/plain", body: "Ok." });
  });

  await page.getByRole("button", { name: /Manage Plugins/i }).click();
  const dialog = page.getByRole("dialog");

  await expect(dialog.getByRole("switch", { name: "The Pirate Bay" })).toBeChecked();
  const legit = dialog.getByRole("switch", { name: "Legit Torrents" });
  await expect(legit).not.toBeChecked();

  // Plain click: the mock still serves Legit Torrents as disabled after the
  // refetch, so the switch snaps back — only the request body is asserted
  await legit.click();
  await expect.poll(() => enableBodies).toContain("names=legittorrents&enable=true");
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
