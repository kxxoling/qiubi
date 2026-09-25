import { useNavigate, useSearch } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { qbtClient } from "@/api/qbt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app";
import { clearSavedAuth, getSavedAuth, saveSavedAuth } from "@/stores/auth";

/**
 * Login page
 *
 * Two modes are supported:
 * 1. Enter a full URL (e.g. http://localhost:8080) to connect directly to a remote qBT
 * 2. Leave empty to use the current origin (same-origin deployment or vite proxy)
 *
 * LAN password-free mode is auto-detected; with "remember password" checked, the App layer
 * re-logs-in automatically on session expiry, and this page also auto-fills and auto-connects.
 */

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // When kicked out due to session expiry, redirect holds the original page path; return there after successful login
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };
  const { baseUrl, setBaseUrl, setConnectionState } = useAppStore();

  const goBack = () => {
    navigate({ to: redirect?.startsWith("/") ? redirect : "/" });
  };

  const saved = getSavedAuth();
  const [url, setUrl] = useState(baseUrl || saved?.baseUrl || "");
  const [username, setUsername] = useState(saved?.username ?? "admin");
  const [password, setPassword] = useState(saved?.password ?? "");
  // Remember password by default: convenience first during testing; only opt out by unchecking
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const autoTriedRef = useRef(false);

  const handleConnectRef = useRef<typeof handleConnect | null>(null);
  const handleConnect = async () => {
    // The Server field must either be empty (same-origin) or a full http(s) URL.
    // Users once typed their username here: baseUrl became a relative path and every API request
    // was answered by the SPA fallback with index.html (200), appearing as the API "returning HTML".
    const trimmed = url.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      toast.error(t("Server address must start with http:// or https://"));
      return;
    }

    setLoading(true);
    setConnectionState("connecting");

    try {
      // Empty string means same-origin (proxy or alternative WebUI deployment)
      const baseUrl = url.replace(/\/+$/, "");
      qbtClient.setBaseUrl(baseUrl);
      setBaseUrl(baseUrl);

      // Check LAN password-free mode
      const bypass = await qbtClient.checkLocalAuthBypass();
      // Detect server version (adapts to 4.x/5.x differences); failure doesn't block login
      qbtClient.detectVersion().catch(() => {});

      // Remember password: auto-fill next time + auto re-login on session expiry (also saved in
      // bypass mode, since the login endpoint still works there and re-login logic needn't differentiate)
      if (remember) saveSavedAuth({ username, password, baseUrl });
      else clearSavedAuth();

      if (bypass) {
        setConnectionState("auth_bypass");
        toast.success(t("LAN mode (no auth)"));
        goBack();
        return;
      }

      // Password login required
      await qbtClient.login({ username, password });
      setConnectionState("connected");
      goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
      setConnectionState("disconnected");
    } finally {
      setLoading(false);
    }
  };

  handleConnectRef.current = handleConnect;

  // Auto-login: connect automatically when credentials (password) OR a
  // saved backend address exist — LAN-bypass servers need no password, the
  // bypass probe alone gets us in. Stay on the form on failure.
  useEffect(() => {
    if (autoTriedRef.current) return;
    const s = getSavedAuth();
    if (!s?.password && !s?.baseUrl) return;
    autoTriedRef.current = true;
    handleConnectRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">qiubi</h1>
          <p className="text-sm text-muted-foreground">qBittorrent Web UI</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("Server")}
              <span className="ml-1 text-xs text-muted-foreground">
                ({t("Leave empty for current origin")})
              </span>
            </div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("Username")}</div>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("Password")}</div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              /* The default dot placeholder is too dark and can be mistaken for a saved password; lighten it only here (other inputs keep the default) */
              className="placeholder:text-muted-foreground/40"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-password"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <label htmlFor="remember-password" className="text-sm text-muted-foreground">
              {t("Remember password (auto sign-in)")}
            </label>
          </div>
          <Button className="w-full" onClick={handleConnect} disabled={loading}>
            {loading ? t("Connecting...") : t("Connect")}
          </Button>
        </div>
      </div>
    </div>
  );
}
