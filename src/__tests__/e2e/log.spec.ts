import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Log page E2E tests
 */

const mockLogs = [
  { id: 1, message: "qBittorrent v5.0.0 started", timestamp: 1700000000, type: 1 },
  { id: 2, message: "Listening on port 6881", timestamp: 1700000001, type: 2 },
  { id: 3, message: "Disk space low", timestamp: 1700000002, type: 4 },
  { id: 4, message: "File not found: missing.torrent", timestamp: 1700000003, type: 8 },
];

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/log/main*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockLogs),
    }),
  );
  await page.goto("/#/log");
  // Boot barrier: wait until the log page has actually rendered before tests
  // navigate again (a hash-only re-goto racing an unfinished first boot can
  // trip the auth guard into a login redirect)
  await expect(page.locator("[data-slot='switch']")).toBeVisible();
});

test("displays log entries", async ({ page }) => {
  await expect(page.getByText("qBittorrent v5.0.0 started")).toBeVisible();
  await expect(page.getByText("Disk space low")).toBeVisible();
});

test("shows level badges", async ({ page }) => {
  // Badges live inside [data-slot='badge'] elements
  await expect(page.locator("[data-slot='badge']").getByText("NORMAL")).toBeVisible();
  await expect(page.locator("[data-slot='badge']").getByText("INFO")).toBeVisible();
  await expect(page.locator("[data-slot='badge']").getByText("WARNING")).toBeVisible();
  await expect(page.locator("[data-slot='badge']").getByText("CRITICAL")).toBeVisible();
});

test("filter by level — Critical only", async ({ page }) => {
  await page.getByRole("button", { name: /Critical/i }).click();
  await page.route("**/api/v2/log/main*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([mockLogs[3]]),
    }),
  );
  await page.goto("/#/log");
  await expect(page.getByText("File not found")).toBeVisible();
});

test("copy all button exists", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Copy All/i })).toBeVisible();
});

test("auto refresh toggle", async ({ page }) => {
  const sw = page.locator("[data-slot='switch']");
  await expect(sw).toBeVisible();
  await sw.click();
  await expect(sw).toBeVisible();
});

test("banned IPs source shows ip and reason", async ({ page }) => {
  await page.route("**/api/v2/log/peers*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          ip: "10.0.0.1",
          reason: "Authentication failure",
          timestamp: 1700000010,
          blocked: true,
        },
        { id: 2, ip: "10.0.0.2", reason: "IP filter", timestamp: 1700000011, blocked: true },
      ]),
    }),
  );
  await page.goto("/#/log?src=peers");
  await expect(page.getByText("10.0.0.1")).toBeVisible();
  await expect(page.getByText("IP filter")).toBeVisible();
  // IP search filter
  await page.getByPlaceholder(/Filter/).fill("10.0.0.2");
  await expect(page.getByText("10.0.0.1")).toBeHidden();
  await expect(page.getByText("10.0.0.2")).toBeVisible();
});
