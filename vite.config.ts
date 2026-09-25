import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // @ctrl/torrent-file imports node builtins; without a shim Vite
      // externalizes them and browser-side .torrent parsing silently fails.
      // Both are covered by one tiny module (see src/lib/node-builtin-shims.js)
      "node:crypto": path.resolve(__dirname, "./src/lib/node-builtin-shims.js"),
      "node:path": path.resolve(__dirname, "./src/lib/node-builtin-shims.js"),
    },
  },
  server: {
    proxy: {
      // During development, proxy /api/v2/* to the local qBittorrent WebUI.
      // To target another instance (e.g. a second local one): QBT_TARGET=http://localhost:8081 bun run dev
      "/api": {
        target: process.env.QBT_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
  },
})
