# Contributing

Thanks for contributing to qiubi! Please follow the guidelines below.

## Development environment

- Node.js >= 20
- bun >= 1.0
- Git

## Getting started

```bash
bun install
bun run dev          # dev server (http://localhost:5173, proxies /api to qBT)
bun run build        # production build → dist/
bun run build:demo   # mock-server demo build (GitHub Pages) → dist-demo/
bun test             # unit tests (vitest)
bun run test:e2e     # E2E tests (Playwright)
bun run lint         # Biome check
bun run typecheck    # tsc
```

### Environment variables

```bash
# Proxy the dev server's /api to a different qBittorrent instance
# (defaults to http://localhost:8080; use a second local instance to keep
# your real one untouched)
QBT_TARGET=http://localhost:8081 bun run dev
```

### Chrome extension development

```bash
bun run ext:build   # → build/chrome-mv3-prod/ (load unpacked)
bun run ext:watch   # vite watch-build of the app into public/app (dev loop)
bun run ext:dev     # plasmo dev shell (extension-side hot reload)
bun run ext:app     # one-shot vite build of the app payload
```

Architecture: Vite bundles the app (Parcel 2.9 inside Plasmo cannot handle
Tailwind v4 postcss or Base UI's `#` subpath imports); Plasmo packages the
extension (manifest, icons, MV3 service worker); `scripts/ext-post.mjs`
copies the Vite output into the Plasmo build; `src/background.ts` opens
it when the toolbar icon is clicked (no new-tab override).

### Docker image

```bash
docker build -f docker/Dockerfile .   # LSIO qBittorrent + qiubi as the Web UI
```

## Project structure

```
├── src/
│   ├── api/                 # qBT Web API v2 client, split by domain (core/app/torrents/library/rss/search)
│   ├── components/
│   │   ├── layout/          # MenuBar, TabNav, StatusBar, FilterSidebar, AboutDialog
│   │   ├── command-palette/ # ⌘K palette (commands / local torrents / page jumps)
│   │   ├── torrent/         # table parts, dialogs, detail panel, file tree, card list
│   │   ├── rss/             # RSS page + RSS Downloader rules page
│   │   ├── settings/        # per-section files (behavior/downloads/connection/speed/bittorrent/rss/webui/advanced)
│   │   └── ui/              # shadcn/ui components (registry-managed — don't hand-edit)
│   ├── pages/               # TorrentList (+ torrents/ modules), Dashboard, Search, RSS, Log, Settings
│   ├── hooks/               # useMainDataSync, useIsMobile, useGlobalHotkeys, useTorrentSelection
│   ├── lib/                 # torrentStatus, torrentParse (@ctrl/torrent-file), utils.format, errorLog
│   ├── stores/              # zustand (app/ui/auth/speedHistory)
│   ├── i18n/                # 8 locale dirs (<locale>/<module>.ts merged by index.ts; flat keys, parity enforced by tests)
│   └── mocks/               # demo/ (stateful in-browser mock server), fixtures/ (edge-case file trees)
└── src/__tests__/           # unit tests + e2e/ (Playwright specs)
```

## Workflow

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## Code conventions

- **Language**: TypeScript
- **Formatting**: Biome (`bun run lint:fix`)
- **Components**: function components, named exports
- **Filenames**: kebab-case
- **Imports**: absolute paths via `@/`
- **Types**: use `type`, not `interface`; no `enum`
- **i18n**: every user-visible string must be wrapped in `t()`; keys are English source
  text (flat, no Chinese keys). Each locale is a directory of per-feature modules
  (`src/i18n/<locale>/common.ts`, `torrents.ts`, `settings.ts`, `help.ts`, ...) merged
  by its `index.ts`. When adding strings, put them in the matching module of **all**
  locales — the i18n unit test fails on missing keys, duplicate keys, or non-English keys
- **Comments**: English

## Before committing

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

All checks must pass (the husky pre-commit hook runs lint and test automatically).

## Commit message format

```
feat: add torrent priority shortcuts
fix: handle sync/mainData rid overflow
docs: update the shortcut table
refactor: extract torrent status helpers
test: add QbtClient auth tests
chore: update dependencies
```

## Reporting issues

- Bug reports: use the GitHub issue template
- Feature requests: use the GitHub issue template
