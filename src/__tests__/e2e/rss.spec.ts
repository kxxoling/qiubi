import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * RSS page E2E tests
 */

const mockFeeds = {
  TechBlog: {
    uid: "1",
    url: "https://tech.example.com/rss",
    title: "Tech Blog",
    articles: [
      {
        id: "a1",
        title: "New Release v2.0",
        date: "18 May 2026 10:00:00 +0000",
        link: "https://tech.example.com/1",
        description: "Version 2.0 is out",
        // Real API behavior (verified on qBT 5.2.3): unread articles have no
        // isRead field in the response; unread must be detected via !a.isRead
        torrentURL: "magnet:?xt=v2",
      },
      {
        id: "a2",
        title: "Bug Fix v1.9",
        date: "17 May 2026 08:00:00 +0000",
        link: "https://tech.example.com/2",
        description: "Fixed critical bug",
        isRead: true,
        torrentURL: "magnet:?xt=v19",
      },
    ],
  },
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/rss/items*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockFeeds),
    }),
  );
  await page.goto("/#/rss");
});

test("displays RSS feed tree with unread badge", async ({ page }) => {
  await expect(page.getByText("Tech Blog")).toBeVisible();
  // 1 unread → total-count badge on the toolbar
  await expect(page.locator("[data-slot=badge]", { hasText: "1" }).first()).toBeVisible();
});

test("clicking feed shows articles", async ({ page }) => {
  await page.getByText("Tech Blog").click();
  await expect(page.getByText("New Release v2.0")).toBeVisible();
  await expect(page.getByText("Bug Fix v1.9")).toBeVisible();
});

test("clicking an article opens the add dialog with article context", async ({ page }) => {
  let addBody = "";
  await page.route("**/api/v2/torrents/add", (route) => {
    addBody = route.request().postData() ?? "";
    route.fulfill({ status: 200, body: "Ok." });
  });

  await page.getByText("Tech Blog").click();
  // Clicking the row now opens the add-torrent dialog (nothing added yet)
  await page.getByText("New Release v2.0").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Article context header + prefilled magnet
  await expect(dialog.getByText("New Release v2.0")).toBeVisible();
  await expect(dialog.getByPlaceholder(/magnet|https/i)).toHaveValue(/magnet:\?xt=v2/);
  // Confirm → addTorrent sends a multipart form; the URL is not escaped
  await dialog
    .getByRole("button", { name: /^New Download Task|^Download|Ok/i })
    .last()
    .click();
  await expect.poll(() => addBody).toContain("magnet:?xt=v2");
});

test("add feed dialog opens", async ({ page }) => {
  await page.getByRole("button", { name: /Add Feed/i }).click();
  await expect(page.getByRole("heading", { name: /Add Feed/i })).toBeVisible();
  await expect(page.getByPlaceholder(/https?:\/\//i)).toBeVisible();
});
