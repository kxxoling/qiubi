import "@/globals.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { QbtAuthExpiredError, qbtClient } from "@/api/qbt";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n";
import { router } from "@/router";
import { getSavedAuth } from "@/stores/auth";

/**
 * Unified session-expiry handling:
 * 1. Credentials saved ("remember password" checked on the login page) →
 *    silently re-login and refresh data without interrupting the user
 * 2. Otherwise go to the login page; the redirect param records the current
 *    path so the user is sent back after logging in
 */

/** In-flight automatic re-login (concurrent 403s share a single attempt) */
let reloginPromise: Promise<boolean> | null = null;

async function tryAutoRelogin(): Promise<boolean> {
  if (!reloginPromise) {
    reloginPromise = (async () => {
      const saved = getSavedAuth();
      if (!saved?.password) return false;
      try {
        await qbtClient.login({ username: saved.username, password: saved.password });
        await queryClient.invalidateQueries();
        toast.success(i18n.t("Automatically signed in again"));
        return true;
      } catch {
        return false;
      } finally {
        // Reset later so subsequent 403s within the same second don't retry immediately
        setTimeout(() => {
          reloginPromise = null;
        }, 2000);
      }
    })();
  }
  return reloginPromise;
}

async function handleAuthExpired(error: unknown) {
  if (!(error instanceof QbtAuthExpiredError)) return;
  const { pathname } = router.state.location;
  if (pathname === "/login") return; // already on the login page; avoid redirect loops
  if (await tryAutoRelogin()) return; // auto re-login succeeded, stay on the current page
  // "Expired" only makes sense if the user was previously logged in; anonymous
  // first visits silently go to the login page without a misleading toast
  if (qbtClient.hasEverAuthenticated()) {
    toast.error(i18n.t("Session expired, please sign in again"));
  }
  router.navigate({ to: "/login", search: { redirect: pathname } });
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthExpired }),
  mutationCache: new MutationCache({ onError: handleAuthExpired }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Fallback via the client's own callback on 403 (covers direct calls that bypass react-query)
qbtClient.onAuthExpired = () => handleAuthExpired(new QbtAuthExpiredError());

function App() {
  // One-time notice in demo builds (GitHub Pages); statically removed in normal builds
  useEffect(() => {
    if (import.meta.env.MODE === "demo") {
      toast.info(
        i18n.t("Demo mode: data is simulated in the browser, actions won't affect any real server"),
      );
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
