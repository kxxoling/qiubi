import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Torrent table column-resize drag E2E — TanStack column resizing + persistence (qiubi-ui)
 */

test.beforeEach(async ({ page }) => {
  await setupDefaultRoutes(page);
  await page.goto("/");
});

test("drag resize handle widens column and persists", async ({ page }) => {
  const sizeHeader = page.getByRole("columnheader").filter({ hasText: /^Size/ });
  await expect(sizeHeader).toBeVisible();

  const before = await sizeHeader.evaluate((el) => el.getBoundingClientRect().width);
  const handle = sizeHeader.locator('button[aria-label*="Resize column"]');
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("resize handle not visible");

  // Real mouse drag +80px
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();

  const after = await sizeHeader.evaluate((el) => el.getBoundingClientRect().width);
  expect(after - before).toBeGreaterThan(60);

  // Column width is written to localStorage (qiubi-ui.columnSizing)
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("qiubi-ui") ?? "{}").state?.columnSizing ?? {},
  );
  expect(saved.size).toBeGreaterThan(before + 60);

  // Double-click the handle to restore the default column width
  await handle.dblclick();
  const reset = await sizeHeader.evaluate((el) => el.getBoundingClientRect().width);
  expect(Math.abs(reset - before)).toBeLessThan(2);
});

test("resize does not trigger sorting", async ({ page }) => {
  const sizeHeader = page.getByRole("columnheader").filter({ hasText: /^Size/ });
  const handle = sizeHeader.locator('button[aria-label*="Resize column"]');
  const box = await handle.boundingBox();
  if (!box) throw new Error("resize handle not visible");

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  // Clicking the handle must not trigger sorting (no sort arrow in the header)
  await expect(sizeHeader).not.toContainText("↑");
  await expect(sizeHeader).not.toContainText("↓");
});

test("drag header reorders columns and persists", async ({ page }) => {
  const headers = () => page.locator("thead th").allInnerTexts();
  const before = await headers();
  const nameIdx = before.findIndex((h) => h.includes("Name"));
  const sizeIdx = before.findIndex((h) => h.includes("Size"));
  expect(sizeIdx).toBeGreaterThan(nameIdx);

  // Drag from the middle of the header (avoiding the right resize handle) to
  // move Size in front of Name
  const sizeTh = page.getByRole("columnheader").filter({ hasText: /^Size/ });
  const nameTh = page.getByRole("columnheader").filter({ hasText: /^Name/ });
  const sb = await sizeTh.boundingBox();
  const nb = await nameTh.boundingBox();
  if (!sb || !nb) throw new Error("headers not visible");
  await page.mouse.move(sb.x + sb.width / 2, sb.y + 4);
  await page.mouse.down();
  await page.mouse.move(nb.x + 30, nb.y + 4, { steps: 6 });
  await page.mouse.up();

  const after = await headers();
  expect(after.findIndex((h) => h.includes("Size"))).toBeLessThan(
    after.findIndex((h) => h.includes("Name")),
  );

  // columnOrder is persisted and survives a reload
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("qiubi-ui") ?? "{}").state?.columnOrder ?? [],
  );
  expect(saved.length).toBeGreaterThan(0);
  await page.reload();
  const reloaded = await headers();
  expect(reloaded.findIndex((h) => h.includes("Size"))).toBeLessThan(
    reloaded.findIndex((h) => h.includes("Name")),
  );
});

test("right-click header toggles column visibility", async ({ page }) => {
  const nameHeader = page.getByRole("columnheader").filter({ hasText: /^Name/ });

  // 右键表头 → 列显隐菜单 → 取消 Share Ratio 前先开启它
  await nameHeader.click({ button: "right" });
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const ratioItem = menu.getByText("Share Ratio");
  await ratioItem.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader").filter({ hasText: /Share Ratio/ })).toBeVisible();

  // 再关掉它,列消失且持久化到 qiubi-ui
  await nameHeader.click({ button: "right" });
  await menu.getByText("Share Ratio").click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader").filter({ hasText: /Share Ratio/ })).toBeHidden();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("qiubi-ui") ?? "{}").state?.columnVisibility ?? {},
  );
  expect(saved.ratio).toBe(false);
});
