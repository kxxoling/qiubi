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
  News: {
    uid: "2",
    url: "https://news.example.com/rss",
    title: "News",
    articles: [],
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

/** The feed's tree row — the path key is the displayed name now, and the
 *  same string also appears in the article-list header, so locators must be
 *  scoped to the tree */
const feedRow = (page: import("@playwright/test").Page) =>
  page.locator('[role="treeitem"]').filter({ hasText: "TechBlog" });

test("displays RSS feed tree with unread badge", async ({ page }) => {
  await expect(feedRow(page)).toBeVisible();
  // 1 unread → total-count badge on the toolbar
  await expect(page.locator("[data-slot=badge]", { hasText: "1" }).first()).toBeVisible();
});

test("clicking feed shows articles", async ({ page }) => {
  await feedRow(page).click();
  await expect(page.getByText("New Release v2.0")).toBeVisible();
  await expect(page.getByText("Bug Fix v1.9")).toBeVisible();
});

test("clicking an article opens the add dialog with article context", async ({ page }) => {
  let addBody = "";
  await page.route("**/api/v2/torrents/add", (route) => {
    addBody = route.request().postData() ?? "";
    route.fulfill({ status: 200, body: "Ok." });
  });

  await feedRow(page).click();
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

test("r refreshes the selected feed, Shift+R refreshes all", async ({ page }) => {
  const refreshed: string[] = [];
  await page.route("**/api/v2/rss/refreshItem", (route) => {
    refreshed.push(route.request().postData() ?? "");
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });

  await feedRow(page).click();
  await page.keyboard.press("r");
  await expect.poll(() => refreshed).toEqual(["itemPath=TechBlog"]);

  // Shift+R fans out over every feed (two in this mock)
  await page.keyboard.press("Shift+R");
  await expect
    .poll(() => refreshed)
    .toEqual(["itemPath=TechBlog", "itemPath=TechBlog", "itemPath=News"]);
});

test("Shift+J/Shift+K switch the selected feed", async ({ page }) => {
  await feedRow(page).click();
  const selectedTree = () => page.locator('[role="treeitem"][aria-selected="true"]');
  await expect(selectedTree()).toHaveText(/TechBlog/);

  await page.keyboard.press("Shift+J");
  await expect(selectedTree()).toHaveText(/^News/);
  await expect(page.getByText("No results found")).toBeVisible(); // News has no articles

  await page.keyboard.press("Shift+K");
  await expect(selectedTree()).toHaveText(/TechBlog/);
  await expect(page.getByText("New Release v2.0")).toBeVisible();
});

test("j/k move the article selection, Enter downloads it", async ({ page }) => {
  await feedRow(page).click();
  const selected = () => page.locator('[role="option"][aria-selected="true"]');

  await page.keyboard.press("j");
  await expect(selected()).toHaveText(/New Release v2\.0/);
  await page.keyboard.press("j");
  await expect(selected()).toHaveText(/Bug Fix v1\.9/);
  await page.keyboard.press("k");
  await expect(selected()).toHaveText(/New Release v2\.0/);

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByPlaceholder(/magnet|https/i)).toHaveValue(/magnet:\?xt=v2/);
});

test("Enter confirms the prefilled RSS dialog, not the article link", async ({ page }) => {
  const popups: string[] = [];
  page.on("popup", (p) => popups.push(p.url()));
  let addBody = "";
  await page.route("**/api/v2/torrents/add", (route) => {
    addBody = route.request().postData() ?? "";
    route.fulfill({ status: 200, body: "Ok." });
  });

  await feedRow(page).click();
  await page.keyboard.press("j");
  await page.keyboard.press("Enter"); // opens the dialog focused on the confirm button
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Enter"); // must confirm — not follow the article-page anchor
  await expect.poll(() => addBody).toContain("magnet:?xt=v2");
  expect(popups).toEqual([]);
});

test("rename applies to the tree and saves with Enter", async ({ page }) => {
  let renamed = false;
  let moveBody = "";
  await page.route("**/api/v2/rss/moveItem", (route) => {
    renamed = true;
    moveBody = route.request().postData() ?? "";
    // "null" is safely consumable JSON — an empty body would make the
    // client's response.json() throw
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  // After the rename lands, the feed's path key changes; its RSS-content
  // `title` deliberately stays "Tech Blog" — the tree must show the new path
  await page.route("**/api/v2/rss/items*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(renamed ? { "Renamed Feed": mockFeeds.TechBlog } : mockFeeds),
    }),
  );

  await feedRow(page).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Rename" }).click();
  const input = page.locator('[data-slot="dialog-content"] input');
  await input.fill("Renamed Feed");
  await input.press("Enter");

  await expect(page.getByText("Renamed Feed").first()).toBeVisible();
  await expect.poll(() => moveBody).toContain("itemPath=TechBlog");
  await expect.poll(() => moveBody).toContain("destPath=Renamed+Feed");
});
