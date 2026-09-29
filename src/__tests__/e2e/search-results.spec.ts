import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Search results E2E tests — a search that finishes on its own must drain its
 * remaining results (the incremental poll stops once status leaves Running).
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/#/search");
});

test("finished search drains all results", async ({ page }) => {
  const items = [1, 2, 3].map((i) => ({
    descrLink: "",
    fileName: `result-${i}.torrent`,
    fileSize: i * 1024 * 1024,
    fileUrl: `magnet:?xt=urn:btih:000000000000000000000000000000000000000${i}`,
    nbLeechers: 0,
    nbSeeders: i,
    siteUrl: `https://site${i}.example`,
  }));
  const offsets: number[] = [];
  let statusCalls = 0;

  // Running for the first two polls, then finished — one result per request
  // so the incremental polls can never catch up on their own
  await page.route("**/api/v2/search/status*", (route) => {
    statusCalls += 1;
    const status = statusCalls <= 2 ? "Running" : "Stopped";
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 42, status, total: items.length }]),
    });
  });
  await page.route("**/api/v2/search/results*", (route) => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get("offset") ?? 0);
    offsets.push(offset);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: items.slice(offset, offset + 1),
        status: "Stopped",
        total: items.length,
      }),
    });
  });

  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.mouse.move(0, 0);

  for (const item of items) {
    await expect(page.getByText(item.fileName)).toBeVisible();
  }
  // The drain pass asked for the tail beyond the incremental polls
  expect(offsets).toContain(2);
});
