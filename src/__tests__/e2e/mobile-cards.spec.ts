import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Mobile card list E2E — long-press multi-select, tap-to-details, selected
 * styling, and the theme-toggle rapid-click sync fix.
 */

const TEST_TORRENTS = {
  h1: {
    hash: "h1",
    name: "Ubuntu Desktop",
    size: 5368709120,
    progress: 0.75,
    dlspeed: 1048576,
    upspeed: 0,
    eta: 1200,
    state: "downloading",
    category: "",
    tags: "",
    save_path: "/d",
    added_on: 1,
    completion_on: -1,
    ratio: 0,
    num_complete: 1,
    num_incomplete: 1,
    tracker: "",
  },
  h2: {
    hash: "h2",
    name: "Sintel",
    size: 104857600,
    progress: 1,
    dlspeed: 0,
    upspeed: 204800,
    eta: 0,
    state: "uploading",
    category: "",
    tags: "",
    save_path: "/d",
    added_on: 2,
    completion_on: 2,
    ratio: 2,
    num_complete: 0,
    num_incomplete: 1,
    tracker: "",
  },
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rid: 1,
        full_update: true,
        torrents: TEST_TORRENTS,
        categories: {},
        tags: [],
        server_state: { dl_info_speed: 0, up_info_speed: 0, connection_status: "connected" },
      }),
    }),
  );
});

test.use({ viewport: { width: 390, height: 844 } });

test("long-press selects, second long-press extends the selection", async ({ page }) => {
  await page.goto("/");
  const card1 = page.getByRole("button", { name: /Ubuntu Desktop/ });
  await expect(card1).toBeVisible();

  // Long-press (click with delay holds pointerdown → 450ms timer fires)
  await card1.click({ delay: 600 });
  await expect(page.getByText(/1 selected/)).toBeVisible();
  // Selected card shows the check badge (theme tokens, not hardcoded colors)
  await expect(
    card1.locator("xpath=../..").locator("span.text-primary-foreground .lucide-check"),
  ).toBeVisible();

  // Long-press the second card → 2 selected (multi-select works)
  await page.getByRole("button", { name: /Sintel/ }).click({ delay: 600 });
  await expect(page.getByText(/2 selected/)).toBeVisible();

  // Long-press the first card again → deselect → back to 1
  await card1.click({ delay: 600 });
  await expect(page.getByText(/1 selected/)).toBeVisible();
});

test("plain tap opens details when nothing is selected; long-press never navigates", async ({
  page,
}) => {
  await page.goto("/");

  // No selection yet → plain tap opens the full-screen details route
  await page.getByRole("button", { name: /Sintel/ }).click();
  await expect(page).toHaveURL(/torrents\/h2/);
  await page.goBack();

  // Long-press selects without opening the details route
  await page.getByRole("button", { name: /Ubuntu Desktop/ }).click({ delay: 600 });
  await expect(page.getByText(/1 selected/)).toBeVisible();
  await expect(page).not.toHaveURL(/torrents\/h1/);

  // In selection mode, a tap does NOT navigate either
  await page.getByRole("button", { name: /Sintel/ }).click();
  await expect(page.getByText(/2 selected/)).toBeVisible();
  await expect(page).not.toHaveURL(/torrents\/h2/);
});

test("card menu has a Details icon aligned with the other rows", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Actions" }).first().click();
  const items = page.getByRole("menuitem");
  await expect(items).toHaveCount(4); // Select item removed; Pause/Resume/Details/Delete
  // Every menu row starts with an svg icon
  const icons = await items.locator("svg").count();
  expect(icons).toBeGreaterThanOrEqual(4);
});

test("appearance menu applies light/system/dark without desync", async ({ page }) => {
  await page.goto("/");
  const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));
  const isLight = () => page.evaluate(() => document.documentElement.classList.contains("light"));

  // Monitor-icon trigger opens the 3-way radio group; radio items keep the
  // menu open (multi-select semantics), so drive everything in one session
  const trigger = page.getByRole("button", { name: /Appearance|外观/i }).first();
  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: /Light|浅色/ })).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: /system|跟随系统/i })).toBeVisible();
  await expect(page.getByRole("menuitemradio", { name: /Dark|深色/ })).toBeVisible();

  const select = (label: RegExp) => page.getByRole("menuitemradio", { name: label }).click();

  // Rapid selections across all three modes (the old stale-closure repro):
  // whatever ends up selected, the DOM class must match
  await select(/Dark|深色/);
  await select(/Light|浅色/);
  await select(/system|跟随系统/i);
  await page.waitForTimeout(200);
  // system follows the test OS (light) → html.light
  await expect.poll(isLight).toBe(true);
  await expect.poll(isDark).toBe(false);

  // Explicit dark wins regardless of OS
  await select(/Dark|深色/);
  await expect.poll(isDark).toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
});
