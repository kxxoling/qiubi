import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Categories page E2E tests
 */

const mockCategories = {
  movies: { name: "movies", savePath: "/downloads/movies" },
  music: { name: "music", savePath: "/downloads/music" },
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/torrents/categories", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockCategories),
    }),
  );
});

test("displays category cards with names and paths", async ({ page }) => {
  await page.goto("/#/categories");
  await expect(page.getByText("movies", { exact: true })).toBeVisible();
  await expect(page.getByText("music", { exact: true })).toBeVisible();
  await expect(page.getByText("/downloads/movies")).toBeVisible();
});

test("opens create category dialog", async ({ page }) => {
  await page.goto("/#/categories");
  await page.getByRole("button", { name: /New Category/i }).click();
  await expect(page.getByRole("heading", { name: /New Category/i })).toBeVisible();
});

test("deletes category with confirmation", async ({ page }) => {
  await page.route("**/api/v2/torrents/removeCategories", (route) =>
    route.fulfill({ status: 200, body: "Ok." }),
  );

  await page.goto("/#/categories");
  // The trash button on the movies card (the second button; the first is edit)
  const moviesCard = page.locator("[data-slot='card']").filter({ hasText: "movies" });
  // Trash2 icon button
  const trashButtons = moviesCard.locator("button");
  await trashButtons.last().click();
  await expect(page.getByRole("heading", { name: /Delete/i })).toBeVisible();
});
