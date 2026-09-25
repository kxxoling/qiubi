import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Settings page help tooltips (⺺ icon) E2E — the explanation text must appear
 * after a real mouse hover
 */

const mockPrefs = {
  listen_port: 6881,
  upnp: true,
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

test("help tooltip appears on hover", async ({ page }) => {
  const icon = page.getByRole("button", { name: "What is this?" }).first();
  await icon.hover();
  const tooltip = page.locator("[data-slot=tooltip-content]");
  // The delay is already reduced to 150ms; must appear within 600ms (otherwise
  // it's a regression)
  await expect(tooltip).toBeVisible({ timeout: 600 });
  await expect(tooltip).toContainText(/subfolder|子文件夹/);

  // Verify the second icon (auto-delete mode) the same way, and confirm the
  // content switches after moving over
  const icons = page.getByRole("button", { name: "What is this?" });
  const another = icons.nth(1);
  await another.hover();
  await expect(tooltip).toContainText(/\.torrent file|源文件/, { timeout: 600 });
});
