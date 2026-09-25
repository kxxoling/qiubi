/**
 * MSW node setup (for Vitest)
 */
import { http } from "msw";
import { setupServer } from "msw/node";
import { mockHandlers } from "./handlers";

const handlers = Object.entries(mockHandlers).map(([path, handler]) =>
  (handler.method === "POST" ? http.post : http.get)(`/api/v2/${path}`, () => {
    const body = typeof handler.body === "string" ? handler.body : JSON.stringify(handler.body);
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": handler.contentType },
    });
  }),
);

export const server = setupServer(...handlers);
