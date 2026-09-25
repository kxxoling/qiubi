# Troubleshooting

## Browser side

### Enable API debug logging

Run in the browser console:

```js
localStorage.setItem("qbt-debug", "1");
```

Reload, and the console will print every API request and a response summary.

### Blank page after login / data stops refreshing

- Verify the baseUrl is correct (editable on the login page)
- When a session expires, qiubi silently re-logs-in with remembered credentials; if the credentials changed, sign in again
- Old qBT (4.x) vs new version API differences are handled by the compatibility layer; a few endpoints being unavailable on 4.x is expected

## qBittorrent side (known qBT 5.x issues)

### Homepage shows "Unacceptable file type, only regular file is allowed"

The alternative-UI static file handler was not initialized. In settings, **uncheck** "Use alternative Web UI", save, **re-check** it, and save again — no qBT restart needed. The Docker image's built-in `enable-alt-ui` boot hook handles this automatically on every start.

### `AlternativeUIEnabled=true` in the conf has no effect

qBT 5.x flips this setting to false on the very first start (first boot only; once enabled via the UI or API, qBT saves it itself and it survives restarts). Enable it through the qBT UI or API — not by hand-editing the conf.

### "Invalid Host header, port mismatch" on access

qBT 5.x validates the Host header by default. The port used in the browser must match qBT's WebUI port: a Docker mapping of `-p 18080:18080` needs `-e WEBUI_PORT=18080`. Alternatively disable Host validation under Settings → Web UI.

### Alternative UI path requirements

qBT 5.x serves files from the `public/` subfolder of the configured path; 4.x uses the configured path directly. Release archives are packed as `qiubi/public/` so both versions work (see the README deployment section).

### Manually verify the alternative UI is active

```bash
curl -s http://<host>:<port>/ | grep -o "<title>[^<]*"
# expected: <title>qiubi — qBittorrent Web UI
```

## Docker image

### View the self-healing service logs

```bash
docker logs <container> 2>&1 | grep enable-alt-ui
```

Normal output example: `[enable-alt-ui] qiubi is serving (http://127.0.0.1:8080)`.

### First-login password

```bash
docker logs <container> 2>&1 | grep "temporary password"
```

### Force-refresh the frontend files in /config/qiubi

Image upgrades refresh automatically via the build fingerprint; to refresh manually, delete `/config/qiubi/public/.qiubi-build` and restart the container (the init script will re-sync).
