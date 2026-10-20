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

test("article table headers re-sort — status click puts unread first", async ({ page }) => {
  // a read article NEWER than an unread one: only the status column
  // discriminates them
  const articles = [
    {
      id: "r1",
      title: "Read and recent",
      date: "19 May 2026 09:00:00 +0000",
      link: "",
      torrentURL: "magnet:?xt=r",
      isRead: true,
    },
    {
      id: "u1",
      title: "Unread and older",
      date: "18 May 2026 09:00:00 +0000",
      link: "",
      torrentURL: "magnet:?xt=u",
    },
  ];
  await page.route("**/api/v2/rss/items*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        TechBlog: { uid: "1", url: "https://tech.example.com/rss", title: "Tech Blog", articles },
      }),
    }),
  );
  // the beforeEach mock already served the initial load; pressing "r" makes
  // the refresh poller re-fetch rss/items, which this override now serves
  await feedRow(page).click();
  await page.keyboard.press("r");

  const options = () => page.locator('[role="option"]');
  await expect(options()).toHaveCount(2);
  // default order: date desc — the newer (read) article first
  await expect(options().first()).toContainText("Read and recent");

  // status column: first click sorts unread first
  await page.getByRole("button", { name: "Status" }).click();
  await expect(options().first()).toContainText("Unread and older");
  // clicking the same column again toggles to read first
  await page.getByRole("button", { name: "Status" }).click();
  await expect(options().first()).toContainText("Read and recent");
});

test("refresh surfaces the backend failure state as an error toast", async ({ page }) => {
  let refreshCount = 0;
  let pollsAfterRefresh = 0;
  await page.route("**/api/v2/rss/refreshItem", (route) => {
    refreshCount++;
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  await page.route("**/api/v2/rss/items*", (route) => {
    // stateful on purpose — the loading→error sequence after the POST is the
    // scenario under test (everything else stays the constant beforeEach mock)
    let body = JSON.stringify(mockFeeds);
    if (refreshCount > 0) {
      pollsAfterRefresh++;
      const TechBlog =
        pollsAfterRefresh === 1
          ? { ...mockFeeds.TechBlog, isLoading: true }
          : { ...mockFeeds.TechBlog, isLoading: false, hasError: true };
      body = JSON.stringify({ ...mockFeeds, TechBlog });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await feedRow(page).click();
  await page.keyboard.press("r");
  const toast = page.locator("[data-sonner-toast]");
  // a spinner toast shows immediately while the poll loop waits for the
  // settle, then swaps in place for the outcome
  await expect(toast).toContainText("Refreshing");
  // hasError carries no reason — the failure toast is a bare title
  await expect(toast.getByText("Refresh failed", { exact: true })).toBeVisible();
  // the settled error state also marks the feed row persistently
  await expect(feedRow(page)).toHaveAttribute(
    "title",
    "Feed failed to refresh — see the server execution log",
  );
});

test("refresh-all fires one error toast per failed feed", async ({ page }) => {
  let refreshes = 0;
  let pollsAfterRefresh = 0;
  await page.route("**/api/v2/rss/refreshItem", (route) => {
    refreshes++;
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  await page.route("**/api/v2/rss/items*", (route) => {
    // both feeds go loading → hasError after the refresh POSTs
    let body = JSON.stringify(mockFeeds);
    if (refreshes > 0) {
      pollsAfterRefresh++;
      const loading = pollsAfterRefresh === 1;
      body = JSON.stringify({
        TechBlog: { ...mockFeeds.TechBlog, isLoading: loading, hasError: !loading },
        News: { ...mockFeeds.News, isLoading: loading, hasError: !loading },
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body });
  });

  // click first so the hotkey listener is mounted before Shift+R lands
  await feedRow(page).click();
  await page.keyboard.press("Shift+R");
  // the spinner toast shows immediately, then makes way for per-feed results
  await expect(page.locator("[data-sonner-toast]")).toContainText("Refreshing");
  // one toast per failed feed, saying what failed (hasError has no reason
  // attached — nothing more to display)
  const toasts = page.locator("[data-sonner-toast]");
  await expect(toasts).toHaveCount(2);
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "TechBlog failed to refresh" }),
  ).toBeVisible();
  await expect(
    page.locator("[data-sonner-toast]", { hasText: "News failed to refresh" }),
  ).toBeVisible();
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
