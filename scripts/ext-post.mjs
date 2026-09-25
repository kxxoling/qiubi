/**
 * Post-process the Plasmo extension build:
 *
 * Copy the Vite-built app (.ext-app) into the extension package. The UI
 * opens from the toolbar icon (see src/background.ts); the browser's
 * new-tab page is deliberately NOT overridden.
 *
 * This runs AFTER `plasmo build` on purpose: pointing the manifest at the
 * Vite output directly makes Parcel try to bundle the app itself, which it
 * cannot (Tailwind v4 / Base UI's # subpath imports need a newer bundler).
 * Vite builds the app; Plasmo packages the extension; this script glues
 * them together.
 *
 * Run: node scripts/ext-post.mjs [buildDir]   (default build/chrome-mv3-prod)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const buildDir = resolve(process.argv[2] ?? "build/chrome-mv3-prod");
const appSource = resolve(".ext-app");
const manifestPath = resolve(buildDir, "manifest.json");

if (!existsSync(appSource)) {
  console.error(".ext-app not found — run `npm run ext:app` first");
  process.exit(1);
}
if (!existsSync(manifestPath)) {
  console.error(`manifest not found at ${manifestPath} — run plasmo build first`);
  process.exit(1);
}

cpSync(appSource, resolve(buildDir, "app"), { recursive: true });
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

console.log("app copied into the extension package");
