import i18n from "@/i18n";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { qbtClient } from "@/api/qbt";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoriesPage } from "@/pages/Categories";
import { Dashboard } from "@/pages/Dashboard";
import { LogPage } from "@/pages/log";
import { LoginPage } from "@/pages/Login";
import { RssPage } from "@/pages/rss";
import { getSavedAuth } from "@/stores/auth";
import { RssRulesPage } from "@/pages/rss/RulesPage";
import { SearchPage } from "@/pages/search";
import { SettingsPage } from "@/pages/Settings";
import { TorrentDetail } from "@/pages/TorrentDetail";
import { TorrentList } from "@/pages/TorrentList";

/** URL filter params for the torrent list (#/?status=&q=&category=&tag=) */
export type TorrentListSearch = {
  status?: string;
  q?: string;
  category?: string;
  tag?: string;
  tracker?: string;
};

/**
 * Hash routing (/#/torrents):
 * The build may be deployed to a static server without SPA fallback (or a
 * qBT custom WebUI directory); hash URLs don't depend on server rewrite
 * rules and work anywhere that can serve index.html.
 */
const hashHistory = createHashHistory();

/** Route-level error fallback; render errors no longer produce a blank screen */
function RouteError({ error }: { error: unknown }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold">{i18n.t("Something went wrong")}</h2>
      <p className="max-w-md break-all text-sm text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Link
        to="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {i18n.t("Back to home")}
      </Link>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  errorComponent: RouteError,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    // Original path to return to after login (attached on auth-expiry redirect)
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

/**
 * Pathless layout route: business pages are uniformly nested under it, wrapped
 * in the app shell with sidebar/Header. /login hangs directly off the root
 * route, outside the shell, so no app UI renders before login.
 */
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

// LAN no-auth detection only needs to run once; the result is cached in the client
let bypassChecked = false;

/**
 * Login guard: when not logged in, first try LAN no-auth access; if that still
 * fails, redirect to the login page recording the original path, which the
 * Login page reads from the redirect param to send the user back.
 */
async function requireAuth(pathname: string) {
  if (qbtClient.isLoggedIn()) return;
  if (!bypassChecked) {
    bypassChecked = true;
    // 1) same-origin (alternative-WebUI deployments behind qBT itself)
    await qbtClient.checkLocalAuthBypass();
    // 2) saved backend address: LAN-whitelist servers let us in with no
    //    credentials (same auto-login as the official UI)
    if (!qbtClient.isLoggedIn()) {
      const saved = getSavedAuth();
      if (saved?.baseUrl) {
        qbtClient.setBaseUrl(saved.baseUrl);
        await qbtClient.checkLocalAuthBypass();
      }
    }
    if (qbtClient.isLoggedIn()) qbtClient.detectVersion().catch(() => {});
  }
  if (!qbtClient.isLoggedIn()) {
    throw redirect({ to: "/login", search: { redirect: pathname } });
  }
}

const torrentsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  // qBT main view: the root path goes straight to the torrent list
  path: "/",
  // All filter params go into the URL: status/keyword/category/tag —
  // bookmarkable, shareable, and preserved across refreshes
  validateSearch: (search: Record<string, unknown>): TorrentListSearch => ({
    status: typeof search.status === "string" ? search.status : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    tag: typeof search.tag === "string" ? search.tag : undefined,
    tracker: typeof search.tracker === "string" ? search.tracker : undefined,
  }),
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: TorrentList,
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/dashboard",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: Dashboard,
});

const torrentDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/torrents/$hash",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: TorrentDetail,
});

const categoriesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/categories",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: CategoriesPage,
});

const rssRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/rss",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: RssPage,
});

const rssRulesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/rss/rules",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: RssRulesPage,
});

const searchRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/search",
  // Command palette navigation carries ?q=<keyword>&category=<category> to auto-search
  validateSearch: (search: Record<string, unknown>): { q?: string; category?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: SearchPage,
});

const logRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/log",
  // ?level=<level> preset; ?q= keyword; ?src=peers switches to the IP-block log
  validateSearch: (search: Record<string, unknown>): { level?: string; q?: string; src?: string } => ({
    level: typeof search.level === "string" ? search.level : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    src: typeof search.src === "string" ? search.src : undefined,
  }),
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: LogPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/settings",
  beforeLoad: ({ location }) => requireAuth(location.pathname),
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
  dashboardRoute,
  torrentsRoute,
  torrentDetailRoute,
  categoriesRoute,
  rssRoute,
  rssRulesRoute,
  searchRoute,
    logRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
