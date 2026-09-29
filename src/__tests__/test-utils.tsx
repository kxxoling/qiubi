/**
 * Shared unit-test helpers for rendering routed pages: a minimal memory
 * router (pages use useNavigate) + a throwaway QueryClient, mirroring the
 * stubMaindata/createWrapper pattern the hook tests use.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

export function renderPage(page: ReactNode) {
  const root = createRootRoute();
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <>{page}</>,
  });
  const router = createRouter({ routeTree: root.addChildren([index]) });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
