import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Dashboard E2E tests
 *
 * The Header (sidebar top bar) also shows speeds, so scope with getByRole("main").
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/#/dashboard");
});

test("displays dashboard with stat cards", async ({ page }) => {
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  // Download/upload speeds are in cards inside the main region.
  // .first(): the chart's Y axis ticks use the same "x MB/s" format and may
  // have rendered by assertion time on slower machines (CI) — both are valid
  // proof the speed values render.
  await expect(main.getByText(/1(\.0)?\s*MB\/s/i).first()).toBeVisible();
  await expect(main.getByText(/512(\.0)?\s*KB\/s/i).first()).toBeVisible();
});

test("shows DHT nodes info", async ({ page }) => {
  const main = page.getByRole("main");
  await expect(main.getByText(/DHT.*150/)).toBeVisible({ timeout: 10000 });
});
