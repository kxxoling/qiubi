import filesFixture from "../../mocks/fixtures/dataset-files.json" with { type: "json" };
import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Torrent detail panel E2E — a deeply nested 67-file torrent (synthetic edge-case
 * data, 6-level paths including Chinese/space filenames) verifying file tree
 * structure, aggregation, and priority operations.
 * The torrent list entry and properties are minimal inline objects (the original
 * real captured payloads were removed).
 */

const TEST_HASH = "1b8352e98aa098585d6f59b27b150fd490986f48";

/** Minimal usable torrent record (only fields needed for list rendering) */
const inlineTorrent = {
  hash: TEST_HASH,
  name: "qiubi-test-dataset",
  size: 175236,
  progress: 0,
  dlspeed: 0,
  upspeed: 0,
  eta: 8640000,
  state: "stalledDL",
  category: "",
  tags: "",
  save_path: "/downloads",
  added_on: 1787975117,
  completion_on: -1,
  ratio: 0,
  num_complete: 0,
  num_incomplete: 1,
  tracker: "http://192.0.2.1:6969/announce",
};

const inlineProps = {
  addition_date: 1787975117,
  comment: "qiubi synthetic test torrent",
  completion_date: -1,
  hash: TEST_HASH,
  name: "qiubi-test-dataset",
  save_path: "/downloads",
  total_size: 175236,
  piece_size: 32768,
  pieces_have: 0,
  pieces_num: 6,
};

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.route("**/api/v2/sync/maindata*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        rid: 0,
        full_update: true,
        torrents: { [TEST_HASH]: inlineTorrent },
        categories: {},
        tags: [],
        server_state: { dl_info_speed: 0, up_info_speed: 0, connection_status: "connected" },
      }),
    }),
  );
  await page.route("**/api/v2/torrents/files*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(filesFixture),
    }),
  );
  await page.route("**/api/v2/torrents/properties*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(inlineProps),
    }),
  );
  await page.route("**/api/v2/torrents/filePrio", (route) => route.fulfill({ status: 200 }));
  await page.goto("/");
});

test("file tree renders deep nesting with folders first", async ({ page }) => {
  await page.getByText("qiubi-test-dataset").first().click();
  await page.getByRole("tab", { name: /Content/ }).click();

  const tree = page.locator("[data-slot=detail-panel-root]");
  await expect(tree.getByText("data", { exact: true })).toBeVisible();
  await expect(tree.getByText("报告")).toBeVisible();

  // Fully expanded by default: the 6-level path data/2024/MM/DD/records.csv is directly visible
  await expect(tree.getByText("2024")).toBeVisible();
  await expect(tree.getByText("records.csv").first()).toBeVisible();
  // Collapse data → child levels hidden; click again to restore
  await tree.getByText("data", { exact: true }).click();
  await expect(tree.getByText("2024")).toBeHidden();
  await tree.getByText("data", { exact: true }).click();
  await expect(tree.getByText("2024")).toBeVisible();
});

test("folder priority applies to all children (repeated id params)", async ({ page }) => {
  await page.getByText("qiubi-test-dataset").first().click();
  await page.getByRole("tab", { name: /Content/ }).click();

  // Priority dropdown on the docs folder row (the parent row of the name
  // button) → Skip(0); should send one id per file for all 6 files under docs
  // (intro/guide/faq + 3 chapters)
  const docSelect = page
    .getByRole("button", { name: "docs", exact: true })
    .locator("xpath=..")
    .locator("select");
  const reqPromise = page.waitForRequest((r) => r.url().includes("/torrents/filePrio"));
  await docSelect.selectOption("0");
  const req = await reqPromise;

  const body = req.postData() ?? "";
  const ids = body.split("&").filter((p) => p.startsWith("id="));
  expect(ids.length).toBe(6); // docs: intro/guide/faq + 3 chapters
  expect(body).toContain("priority=0");
});

test("general / trackers / peers tabs render", async ({ page }) => {
  // Trackers + peers 数据也 mock(maindata 复用文件顶部的内联种子)
  await page.route("**/api/v2/torrents/trackers*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          url: "** [DHT] **",
          status: 0,
          tier: 0,
          num_peers: 0,
          num_seeds: 0,
          num_leeches: 0,
          num_downloaded: 0,
          num_downloaded_session: 0,
          msg: "",
        },
        {
          url: "https://tracker.example.com/announce",
          status: 2,
          tier: 0,
          num_peers: 5,
          num_seeds: 10,
          num_leeches: 3,
          num_downloaded: 100,
          num_downloaded_session: 5,
          msg: "",
        },
      ]),
    }),
  );
  await page.route("**/api/v2/sync/torrentPeers*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        full_update: true,
        rid: 1,
        peers: {
          "10.0.0.1": {
            ip: "10.0.0.1",
            port: 51413,
            client: "qBittorrent 5.2.3",
            connection: "BT-PWP",
            country: "US",
            dl_speed: 1024,
            up_speed: 512,
            downloaded: 1e6,
            uploaded: 2e6,
            progress: 0.5,
            flags: "d",
            relevance: 1,
          },
        },
      }),
    }),
  );

  await page.getByText("qiubi-test-dataset").first().click();
  const panel = page.locator("[data-slot=detail-panel-root]");

  // General:来自 properties 的字段
  await expect(panel.getByText(/save_path|Save path/i)).toBeVisible();
  // Trackers:tab 仅列出 HTTP(S) tracker(特殊条目 ** [DHT] ** 被过滤)
  await page.getByRole("tab", { name: /Trackers/ }).click();
  await expect(panel.getByText(/tracker\.example\.com/)).toBeVisible();
  // Peers:客户端与 IP
  await page.getByRole("tab", { name: /Peers/ }).click();
  await expect(panel.getByText("10.0.0.1")).toBeVisible();
  await expect(panel.getByText(/qBittorrent 5\.2\.3/)).toBeVisible();
});
