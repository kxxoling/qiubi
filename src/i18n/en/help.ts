// Settings help tooltips (help.* keys) — beginner-friendly explanations from the qBT docs.
import type { Dictionary } from "@/i18n/types";

export default {
  "help.scope_pause_resume":
    "With no selection, acts on all torrents matching the current filter; with a selection, acts only on the selected torrents.",
  "help.create_subfolder":
    "Torrents containing multiple files are placed in a subfolder named after the torrent, keeping your save directory tidy. Single-file torrents are unaffected.",
  "help.auto_delete_mode":
    'Controls what happens to the source .torrent file when a torrent is removed: "Never remove" only deletes the task; "Remove if exists" also deletes the .torrent file.',
  "help.preallocate":
    "Reserves the full file size on disk before downloading: reduces fragmentation and catches insufficient disk space early. No benefit on SSDs; recommended for HDDs.",
  "help.incomplete_ext":
    "Incomplete files get a .!qB suffix so they can't be mistaken for finished files. The suffix is removed automatically once complete.",
  "help.auto_tmm":
    "Automatic Torrent Management: save paths follow category settings automatically, and files are moved when you change a torrent's category. Disable to control paths manually per torrent.",
  "help.save_path":
    "Default folder for newly added torrents. Can be overridden per torrent when adding, or changed later.",
  "help.add_stopped":
    "New torrents are added paused and won't download until you resume them. Useful for reviewing file selection and priorities first.",
  "help.export_dir":
    "Keeps a copy of each added torrent's .torrent file in this folder — handy for backup or migrating to another client.",
  "help.temp_path":
    "Incomplete downloads are stored here and moved to the save path when finished. Keep it on the same disk to avoid slow cross-disk moves.",
  "help.autorun":
    "Run a command when a torrent finishes. Variables: %N name, %F save path, %R root path, %L category, %I hash. Runs on the qBittorrent server.",
  "help.listen_port":
    'The port other peers use to reach you — your "door number". Forward this port on your router (or enable UPnP) for much better connectivity and speed.',
  "help.random_port":
    "Pick a random listening port on each startup. Turn off if you set up a fixed port forward on your router.",
  "help.upnp":
    "Ask the router to open the listening port automatically via UPnP/NAT-PMP, no manual port forwarding needed. Some old routers don't support it reliably.",
  "help.max_connec":
    "Maximum total connections across all torrents. Too low limits speed; too high can strain your router. 200–500 works well for home connections.",
  "help.max_connec_per_torrent":
    "Maximum connections for a single torrent. Higher for popular torrents; default is fine for rare ones.",
  "help.max_uploads":
    "Global upload slots — how many peers you can send data to simultaneously. Raise it if you seed a lot.",
  "help.proxy":
    "Route traffic through a proxy server. SOCKS5 is the most capable (supports peer connections); HTTP proxies only fit some setups.",
  "help.proxy_peers":
    "Also route peer-to-peer connections through the proxy. When off, only tracker announces and web requests use the proxy.",
  "help.proxy_torrents_only":
    "Only torrent traffic uses the proxy; tracker requests and update checks connect directly.",
  "help.global_limit":
    'Global download limit across all torrents. 0 means unlimited. Use the status-bar "alternative speed" toggle for a quick temporary limit.',
  "help.scheduler":
    "Automatically enable the alternative limits above during the configured time window, e.g. slow down every evening peak.",
  "help.limit_utp":
    "Apply limits to μTP connections. μTP already yields automatically when your network is busy — usually no need to enable.",
  "help.limit_overhead":
    "Count BitTorrent protocol overhead (handshakes, etc.) toward the limits, making them effectively stricter.",
  "help.limit_lan_peers":
    "Apply limits to peers on your local network. LAN transfers are fast, so usually leave this off.",
  "help.dht":
    "Distributed Hash Table: finds peers without a tracker server — the foundation of magnet links. Must be disabled for private trackers (PT sites), or your account may be banned.",
  "help.pex":
    "Peer Exchange: discovers more peers from those you're already connected to. Private tracker (PT) sites also require this off.",
  "help.lsd":
    "Local Service Discovery: automatically finds and connects to other qBittorrent users on the same LAN, without going through the internet.",
  "help.encryption":
    'Protocol encryption obfuscates BitTorrent traffic and can work around ISP throttling. "Prefer" keeps compatibility; "Require" may fail to connect to peers that don\'t support it.',
  "help.anonymous_mode":
    "Disables incoming connections, hides client fingerprints and only talks through a proxy. Significantly reduces peers and speed — only for special needs with a trusted proxy.",
  "help.utp":
    "μTP yields automatically when your network is congested, so downloads don't disturb browsing or gaming; TCP is more aggressive. Default uses both.",
  "help.queueing":
    "Limits how many downloads/seeds run at once; the rest wait in queue so bandwidth isn't spread too thin across many tasks.",
  "help.max_active_downloads":
    "How many torrents download at the same time; the rest queue. 3–5 is a good start unless you have plenty of bandwidth.",
  "help.slow_torrents":
    "Slow torrents (below the speed/activity thresholds) don't occupy active slots, so a stalled torrent can't block the queue.",
  "help.max_ratio":
    "Share ratio = uploaded ÷ downloaded; 1.0 means you've uploaded as much as you downloaded. When reached, the action below is applied. PT users: follow your site's rules.",
  "help.max_seeding_time":
    "Stop or remove after seeding for this many minutes. Triggers when either the ratio or the time condition is met.",
  "help.add_trackers":
    "Appends this public tracker list to every new torrent for extra sources when built-in trackers fail. Has no effect on private (PT) torrents. One URL per line.",
  "help.rss_processing":
    "Fetch all RSS feeds periodically to refresh article lists. Turn off to stop automatic refresh.",
  "help.rss_auto":
    "Used with RSS download rules: matching new torrents are added automatically — great for following shows.",
  "help.repack":
    "Also download REPACK/PROPER re-releases (fixed versions of the same episode). Off means only the first release is fetched.",
  "help.session_timeout":
    "How many seconds of inactivity before the login session expires and you must sign in again.",
  "help.csrf":
    "Prevents cross-site request forgery: stops malicious pages from driving qBittorrent with your login. Reverse/dev proxies may be blocked — disable temporarily in that case.",
  "help.host_validation":
    "Checks the HTTP Host header so the WebUI can't be reached from unexpected domains. If you get 401s with correct credentials behind a proxy, try disabling this.",
  "help.clickjacking":
    "Stops this page from being embedded in other sites' iframes (clickjacking protection).",
  "help.secure_cookie":
    "Send the session cookie only over HTTPS. Don't enable without HTTPS or you won't be able to log in.",
  "help.domain_list":
    "Whitelist of domains allowed to reach the WebUI, comma-separated. * allows all. Used with Host header validation.",
  "help.bypass_local": "Skip login for requests from localhost (127.0.0.1).",
  "help.bypass_subnet":
    "Skip login for whitelisted subnets, e.g. your home LAN. Beware: anything spoofing those source addresses is also unauthenticated — avoid on public networks.",
  "help.https":
    "HTTPS requires a certificate and key file (self-signed via OpenSSL works). Browsers will warn about self-signed certificates — that's expected.",
  "help.announce_ip":
    "IP address reported to trackers; leave empty for auto-detection. Only needed when detection is wrong behind a public IP.",
  "help.async_io":
    "Asynchronous disk I/O threads. 4 for HDDs; raise for SSD/NVMe for higher throughput.",
  "help.file_pool":
    "How many files stay open at once. Raise for large multi-file torrents to avoid repeated open/close overhead.",
  "help.network_interface":
    "Bind torrent traffic to a specific network card. On multi-NIC/VPN setups this can keep downloads off the VPN; leave empty for automatic.",
  "help.resolve_countries":
    "Look up each peer's country and show a flag in the peer list. Slightly increases traffic.",
  "help.anonymous":
    "Anonymous mode: disables incoming connections, hides client fingerprints and only talks through a proxy. Significantly reduces peers and speed — only for special needs with a trusted proxy.",
  "help.limit_lan":
    "Apply limits to peers on your local network. LAN transfers are fast, so usually leave this off.",
} satisfies Dictionary;
