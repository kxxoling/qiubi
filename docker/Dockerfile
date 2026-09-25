# ── Stage 1: build the qiubi web UI ──
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build && rm -rf dist/mockServiceWorker.js

# ── Stage 2: qBittorrent with qiubi as its Web UI (demo/test image) ──
# Ephemeral-container model: the UI ships in the image; upgrade = pull + recreate.
FROM ghcr.io/linuxserver/qbittorrent:latest

LABEL org.opencontainers.image.title="qiubi" \
      org.opencontainers.image.source="https://github.com/kxxoling/qiubi"

# qBT 5.x requires alternative-UI files inside a public/ subdirectory
COPY --from=builder /app/dist/ /web/qiubi/public/

# First-boot conf keys + the post-boot UI switch (see the scripts themselves)
COPY --chmod=755 docker/init-qiubi.sh /custom-cont-init.d/10-qiubi
COPY --chmod=755 docker/enable-alt-ui  /custom-services.d/enable-alt-ui
