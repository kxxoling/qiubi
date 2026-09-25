import { expect, setupDefaultRoutes, test } from "./fixtures";

/**
 * Login page E2E tests
 *
 * Login page inputs have no standard labels; use div text + placeholders.
 * Server placeholder: "http://localhost:8080"
 * Username placeholder: "admin"
 * Password placeholder: "••••••••"
 */

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultRoutes(page);
  });

  test("shows login form by default", async ({ page }) => {
    await page.goto("/#/login");
    await expect(page.getByRole("heading", { name: "qiubi" })).toBeVisible();
    await expect(page.getByText("Server")).toBeVisible();
    await expect(page.getByPlaceholder("http://localhost:8080")).toBeVisible();
    await expect(page.getByPlaceholder("admin")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /Connect/i })).toBeVisible();
  });

  test("shows error on failed login", async ({ page }) => {
    // Mock auth/login returning 403 (IP banned)
    await page.route("**/api/v2/auth/login", (route) =>
      route.fulfill({ status: 403, body: "Forbidden" }),
    );
    // app/version returns 403 → LAN no-auth detection fails, normal login flow runs
    await page.route("**/api/v2/app/version", (route) =>
      route.fulfill({ status: 403, body: "Forbidden" }),
    );

    await page.goto("/#/login");
    await page.getByPlaceholder("admin").fill("admin");
    await page.getByPlaceholder("••••••••").fill("wrong");
    await page.getByRole("button", { name: /Connect/i }).click();

    // Toast error message (IP banned)
    await expect(page.getByText(/banned/i)).toBeVisible({ timeout: 5000 });
    // Still on the login page
    await expect(page).toHaveURL(/\/login/);
  });
});
