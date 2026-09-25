// Settings help tooltips (help.* keys) — beginner-friendly explanations from the qBT docs.
import type { Dictionary } from "@/i18n/types";

export default {
  "help.scope_pause_resume":
    "无勾选时，作用于当前筛选条件下的全部任务；有勾选时，仅作用于勾选的任务。",
  "help.create_subfolder":
    "包含多个文件的种子会放进以种子名命名的子文件夹，避免文件散落在保存目录里。单文件种子不受影响。",
  "help.auto_delete_mode":
    "删除种子时如何处理对应的 .torrent 源文件：「从不删除」只移除任务；「存在 .torrent 时删除」会连源文件一起清理。",
  "help.preallocate":
    "下载开始前按最终大小预先占用磁盘空间：可以减少磁盘碎片，并在空间不足时提前发现；对 SSD 无益，大文件 + 机械硬盘建议开启。",
  "help.incomplete_ext":
    "未下载完成的文件会加上 .!qB 后缀，防止被当作完整文件误打开；下载完成后自动去掉后缀。",
  "help.auto_tmm":
    "自动种子管理(ATM)：种子的保存路径跟随分类设置和默认路径自动调整，移动分类时文件会自动搬到对应目录。关闭后每个种子路径完全手动控制。",
  "help.save_path": "新添加种子的默认保存目录。添加种子时可以临时改，之后也可在种子里单独修改。",
  "help.add_stopped":
    "种子添加后处于暂停状态，需要手动点「继续」才开始下载。适合想先检查文件勾选、调整优先级再下载的场景。",
  "help.export_dir":
    "为每个添加的种子在指定目录保留一份 .torrent 副本，方便备份或迁移到其他下载器。",
  "help.temp_path":
    "未完成的下载先存放在此临时目录，下载完成后移动到保存目录。建议放在同一块磁盘上，跨磁盘移动大文件会很慢。",
  "help.autorun":
    "种子下载完成时自动执行命令。支持变量：%N 种子名、%F 保存路径、%R 根目录、%L 分类、%I hash。仅在 qBittorrent 服务器上执行。",
  "help.listen_port":
    "其他下载者连接你使用的端口，相当于你的「门牌号」。在路由器上为该端口做端口转发（或配合 UPnP）能显著改善连接性和速度。",
  "help.random_port":
    "每次启动随机换一个监听端口。如果你在路由器上做了固定的端口转发，请关闭此项。",
  "help.upnp":
    "通过 UPnP/NAT-PMP 协议让路由器自动开放监听端口，免去手动配置端口转发。部分老旧路由器不支持或行为不稳定。",
  "help.max_connec":
    "所有种子加起来允许的最大连接数。过低会限制下载速度，过高会拖慢路由器和系统。家庭宽带 200-500 较合适。",
  "help.max_connec_per_torrent":
    "单个种子允许的最大连接数。热门资源可以高一些，冷门资源用默认值即可。",
  "help.max_uploads": "全局上传通道数，决定同一时刻能给多少个节点传数据。做种多的话适当调高。",
  "help.proxy":
    "让流量经过代理服务器。SOCKS5 更通用（支持 BT peer 连接）,HTTP 代理仅适合部分场景。",
  "help.proxy_peers":
    "与 peer 的点对点连接也走代理。不开的话只有 tracker 汇报、网页请求等走代理，BT 数据直连。",
  "help.proxy_torrents_only": "只有 BT 下载相关流量走代理，tracker、更新检查等请求直连。",
  "help.global_limit":
    "全局下载限速，对所有种子生效。0 表示不限速。也可以用状态栏的「备用速度」一键临时切换限速。",
  "help.scheduler":
    "在设定的时间段内自动启用上面的备用限速。例如每天晚高峰自动限速，白天恢复全速。",
  "help.limit_utp": "限速是否作用于 μTP 连接。μTP 协议本身会在网络繁忙时主动让路，一般无需勾选。",
  "help.limit_overhead":
    "限速是否把 BT 协议自身的握手/校验等开销算进限额。勾选后实际上下速度会更严格。",
  "help.limit_lan_peers": "限速是否对局域网内的节点生效。局域网传输很快，一般不勾。",
  "help.dht":
    "分布式哈希表：不需要 tracker 服务器也能找到其他下载者，是磁力链接工作的基础。使用私有 tracker（PT 站）的种子时必须关闭，否则可能被站点封号。",
  "help.pex": "Peer 交换：从已连接的节点那里发现更多节点，加快找齐下载者。PT 站同样要求关闭。",
  "help.lsd": "本地服务发现：自动发现并直连同一局域网内的其他 qBittorrent 用户，内网互传不走外网。",
  "help.encryption":
    "协议加密：对 BT 流量做协议混淆，可缓解运营商对 BT 的限速/干扰。「优先」兼容性最好；「强制」可能连不上不支持加密的节点。",
  "help.anonymous_mode":
    "匿名模式：禁用入站连接、隐藏客户端特征、只通过代理通信，会明显减少可用节点、降低速度，只建议配合可靠代理在特殊需求下开启。",
  "help.utp":
    "μTP 协议在网络拥塞时会主动让路，下载时不影响同网络的网页/游戏；TCP 更激进。默认两者兼顾。",
  "help.queueing":
    "排队机制：限制同时活跃的下载/做种数量，超出的排队等待，避免带宽被大量任务摊薄、哪个都下不完。",
  "help.max_active_downloads":
    "同时下载的种子数上限，其余排队等待。建议 3-5 个，带宽充足可以更多。",
  "help.slow_torrents":
    "速度/做种数低于阈值的「慢种子」不占用活跃名额，避免一个卡住的种子堵住整个队列。",
  "help.max_ratio":
    "分享率 = 累计上传量 ÷ 下载量，1.0 表示上传量等于下载量下载一样多的数据。达到设定值后按下面的动作暂停或移除。PT 站用户请按站点要求设置。",
  "help.max_seeding_time": "做种满设定分钟数后自动暂停或移除，和分享率条件满足其一即触发。",
  "help.add_trackers":
    "为所有新种子追加这份公共 tracker 列表，在种子自带 tracker 失效时提供更多来源。对 PT 站种子无效（私有种子不允许添加）。每行一个地址。",
  "help.rss_processing": "定期抓取所有 RSS 订阅源，更新文章列表。关闭后订阅不再自动刷新。",
  "help.rss_auto": "配合「RSS 下载规则」使用：规则匹配到新种子时自动添加下载，适合追剧/追更。",
  "help.repack":
    "同一集发布了 REPACK/PROPER 修复版（修正压制错误的重发）时也自动下载。不勾则只认首发版本。",
  "help.session_timeout": "登录会话闲置多少秒后过期，过期后需要重新登录。",
  "help.csrf":
    "防止跨站请求伪造：避免恶意网页借你的登录状态操控 qBittorrent。通过反向代理或开发代理访问时可能误拦，届时需临时关闭。",
  "help.host_validation":
    "校验 HTTP Host 头，防止通过非预期域名访问 WebUI。经代理访问遇到 401 且账号密码正确时，可尝试关闭此项。",
  "help.clickjacking": "禁止本页面被其他网站嵌入 iframe，防止点击劫持攻击。",
  "help.secure_cookie":
    "会话 Cookie 仅通过 HTTPS 传输。没有启用 HTTPS 时请勿开启，否则将无法登录。",
  "help.domain_list": "允许访问 WebUI 的域名白名单，逗号分隔，* 表示全部放行。配合 Host 校验使用。",
  "help.bypass_local": "从本机(127.0.0.1)访问 WebUI 时免登录。",
  "help.bypass_subnet":
    "白名单网段内的访问免登录，例如家里的局域网。注意：任何能伪装成该来源地址的请求同样免认证，公网环境慎用。",
  "help.https":
    "启用 HTTPS 需要提供证书和私钥文件（可用 OpenSSL 自签）。自签证书浏览器会提示不受信任，属正常现象。",
  "help.announce_ip":
    "向 tracker 汇报的 IP 地址，留空则自动检测。仅在有公网 IP 但检测不准确时才需要填写。",
  "help.async_io": "磁盘异步读写线程数。机械硬盘建议 4,SSD 或 NVMe 可以适当调大提升吞吐。",
  "help.file_pool":
    "同时保持打开的文件数量。包含大量文件的大种子可以调大，减少反复开关文件的开销。",
  "help.network_interface":
    "强制 BT 流量走指定网卡。多网卡或 VPN 环境下可以让下载不走 VPN，留空则由系统决定。",
  "help.resolve_countries": "查询每个 peer 的国家/地区并在列表中显示旗帜，会略微增加流量。",
  "help.anonymous":
    "匿名模式：禁用入站连接、隐藏客户端特征、只通过代理通信，会明显减少可用节点、降低速度，只建议配合可靠代理在特殊需求下开启。",
  "help.limit_lan": "限速是否对局域网内的节点生效。局域网传输很快，一般不勾。",
} satisfies Dictionary;
