import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * RSS auto-download rules E2E — dedicated /rss/rules page
 *
 * The rule editor lives on its own page (the drawer was too cramped).
 * Tests navigate straight to the route as the FIRST load; a hash-router
 * second hard navigation (rss → rss/rules) races the auth bootstrap, so the
 * "button navigates" behavior gets its own focused test instead.
 */

const mockRules = {
  "Anime Rule": {
    enabled: true,
    mustContain: "1080p",
    mustNotContain: "",
    useRegex: false,
    episodeFilter: "",
    smartFilter: false,
    previouslyMatchedEpisodes: [],
    affectedFeeds: [],
    ignoreDays: 0,
    lastMatch: "",
    addPaused: false,
    assignedCategory: "",
    savePath: "",
  },
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/rss/rules*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockRules),
    }),
  );
});

/** Open the RSS Downloader page (single first load) */
async function openRulesPage(page: import("@playwright/test").Page) {
  await page.goto("/#/rss/rules");
}

test("RSS page button navigates to the rules page", async ({ page }) => {
  await page.goto("/#/rss");
  await page.getByRole("button", { name: /RSS Downloader/i }).click();
  await expect(page).toHaveURL(/#\/rss\/rules/);
});

test("rule appears on the page after opening", async ({ page }) => {
  await openRulesPage(page);
  // desktop list item + mobile chip both carry the name — first() avoids
  // a strict-mode violation
  await expect(page.getByText("Anime Rule").first()).toBeVisible();
});

test("clicking rule loads into edit form", async ({ page }) => {
  await openRulesPage(page);
  await page.getByText("Anime Rule").first().click();
  await expect(page.getByLabel(/Rule Name/i)).toHaveValue("Anime Rule");
  // Must Contain is pre-filled
  await expect(page.locator("#rule-must")).toHaveValue("1080p");
});

test("new rule button clears form", async ({ page }) => {
  await openRulesPage(page);
  // Select an existing rule first
  await page.getByText("Anime Rule").first().click();
  await expect(page.getByLabel(/Rule Name/i)).toHaveValue("Anime Rule");
  // Click New → form cleared
  await page
    .getByRole("button", { name: /New Rule/i })
    .first()
    .click();
  await expect(page.getByLabel(/Rule Name/i)).toHaveValue("");
});

test("create new rule fills and saves", async ({ page }) => {
  await page.route("**/api/v2/rss/setRule", (route) => route.fulfill({ status: 200, body: "Ok." }));
  await openRulesPage(page);
  await page
    .getByRole("button", { name: /New Rule/i })
    .first()
    .click();
  await page.getByLabel(/Rule Name/i).fill("Test Rule");
  await page.locator("#rule-must").fill("test");
  await page.getByRole("button", { name: /^Save$/i }).click();
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 3000 });
});
