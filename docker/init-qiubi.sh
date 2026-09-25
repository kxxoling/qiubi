#!/bin/bash
# First-boot conf setup (idempotent). Keys use qBT's canonical "WebUI\Key"
# form under [Preferences]; a separate [WebUI] section is ignored by qBT.
CONF=/config/qBittorrent/qBittorrent.conf
mkdir -p /config/qBittorrent
touch "$CONF"

key() { grep -q "^WebUI\\\\$1=" "$CONF" || printf "[Preferences]\nWebUI\\\\%s=%s\n" "$1" "$2" >>"$CONF"; }
key AlternativeUIEnabled true
key AlternativeUIPath /web/qiubi
key LocalHostAuth false
key AuthSubnetWhitelistEnabled true
key AuthSubnetWhitelist "127.0.0.0/8"
