import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Recent-search history E2E tests — client-side only (localStorage), survives
 * reloads, capped and deduped. See useSearchHistory.
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/#/search");
});

test("successful searches are recorded as chips", async ({ page }) => {
  await expect(page.getByText("Recent searches")).toHaveCount(0);

  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByText("Recent searches")).toBeVisible();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();
});

test("chip click refills the input and re-runs the search", async ({ page }) => {
  const started: string[] = [];
  await page.route("**/api/v2/search/start", (route) => {
    started.push(route.request().postData() ?? "");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: 42 }),
    });
  });

  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();

  // Run a different search, then come back to "ubuntu" via its chip
  await page.getByPlaceholder(/Search torrents/i).fill("debian");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "ubuntu", exact: true }).click();

  await expect(page.getByPlaceholder(/Search torrents/i)).toHaveValue("ubuntu");
  const posted = started.map((body) => new URLSearchParams(body).get("pattern"));
  expect(posted).toEqual(["ubuntu", "debian", "ubuntu"]);
});

test("history persists across reloads", async ({ page }) => {
  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();
});

test("single entry can be deleted from the history", async ({ page }) => {
  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Recent searches")).toHaveCount(0);
});

test("clear wipes the whole history", async ({ page }) => {
  for (const term of ["ubuntu", "debian"]) {
    await page.getByPlaceholder(/Search torrents/i).fill(term);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("button", { name: term, exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Clear search history" }).click();
  await expect(page.getByText("Recent searches")).toHaveCount(0);
});
