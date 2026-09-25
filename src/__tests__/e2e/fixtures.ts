/**
 * Playwright custom test fixture — uniformly mocks all API requests
 *
 * Base mocks come from handlers.ts; each spec can override specific routes
 * via beforeAll. All specs must use this fixture instead of @playwright/test
 * directly, ensuring periodic requests like transfer/info are intercepted and
 * the Vite proxy doesn't hit ECONNREFUSED.
 */
import { test as base, expect } from "@playwright/test";
import { mockHandlers } from "../../mocks/handlers";

/** Batch-register the mock mapping from handlers.ts onto page.route */
async function setupDefaultRoutes(page: import("@playwright/test").Page) {
  await page.route("**/api/v2/**", (route) => {
    const url = new URL(route.request().url());
    const apiPath = url.pathname.replace(/^\/api\/v2\//, "").split("?")[0];
    const handler = mockHandlers[apiPath as keyof typeof mockHandlers];

    if (handler) {
      const body = typeof handler.body === "string" ? handler.body : JSON.stringify(handler.body);
      return route.fulfill({
        status: 200,
        contentType: handler.contentType,
        body,
      });
    }
    // Unmatched API requests return JSON null (preventing proxy forwarding).
    // null rather than an empty string: an empty body takes the text branch
    // and callers expecting arrays/objects would crash on JSON.parse("");
    // null is safely consumable via ?. optional chaining.
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

export const test = base.extend({});
export { expect, setupDefaultRoutes };
