import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Search form E2E tests — the Search button doubles as the running-state
 * indicator (spinner, "Searching") and turns into Stop on hover; the live
 * result count lives at the right end of the recent-searches row.
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/#/search");
});

test("no clear button or completed badge next to the search button", async ({ page }) => {
  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  const search = page.getByRole("button", { name: "Search", exact: true });
  await expect(search).toBeVisible();

  await search.click();
  // Mocked status is Stopped: button stays "Search", no extra form controls
  await expect(search).toBeVisible();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(0);
});

test("running button shows Searching, result count sits in the history row", async ({ page }) => {
  // /search/status's total = results returned so far
  await page.route("**/api/v2/search/status*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 42, status: "Running", total: 2 }]),
    }),
  );

  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  // Move the pointer off the button — the click leaves it hovering, which
  // would already trigger the hover-swap to Stop
  await page.mouse.move(0, 0);

  const running = page.getByRole("button", { name: "Searching", exact: true });
  await expect(running).toBeVisible();
  // Count is separated at the row's right end, even with no history chips
  await expect(page.getByText("2 results", { exact: true })).toBeVisible();

  // Hover swaps the running label for the stop label (same button element)
  await running.hover();
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await expect(running).toBeHidden();
});

test("clicking the running button stops the search", async ({ page }) => {
  await page.route("**/api/v2/search/status*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 42, status: "Running", total: 1 }]),
    }),
  );
  const stopRequests = page.waitForRequest((req) => req.url().includes("/api/v2/search/stop"));
  await page.route("**/api/v2/search/stop", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain", body: "Ok." }),
  );

  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.mouse.move(0, 0);
  await page.getByRole("button", { name: "Searching", exact: true }).click();

  // Resolves only if the click actually POSTed /search/stop (times out otherwise)
  await stopRequests;
});
