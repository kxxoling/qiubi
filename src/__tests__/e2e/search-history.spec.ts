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
  await page.getByPlaceholder(/Search torrents/i).fill("ubuntu");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: "ubuntu", exact: true })).toBeVisible();

  // Reset the active search so the pattern input is empty again
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByPlaceholder(/Search torrents/i)).toHaveValue("");

  await page.getByRole("button", { name: "ubuntu", exact: true }).click();
  await expect(page.getByPlaceholder(/Search torrents/i)).toHaveValue("ubuntu");
  // Search restarted and (per the mocked status) already completed
  await expect(page.getByText("Completed")).toBeVisible();
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
    // The Search button only shows while no search is active — reset between runs
    await page.getByRole("button", { name: "Clear", exact: true }).click();
  }

  await page.getByRole("button", { name: "Clear search history" }).click();
  await expect(page.getByText("Recent searches")).toHaveCount(0);
});
