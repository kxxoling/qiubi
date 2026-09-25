// Settings help tooltips (help.* keys) — beginner-friendly explanations from the qBT docs.
import type { Dictionary } from "@/i18n/types";

export default {
  "help.scope_pause_resume":
    "無勾選時，作用於當前篩選條件下的全部任務；有勾選時，僅作用於勾選的任務。",
  "help.create_subfolder":
    "包含多個檔案的種子會放進以種子名命名的子資料夾，避免檔案散落在儲存目錄裡。單檔案種子不受影響。",
  "help.auto_delete_mode":
    "刪除種子時如何處理對應的 .torrent 原始檔：「從不刪除」只移除任務；「存在 .torrent 時刪除」會連原始檔一起清理。",
  "help.preallocate":
    "下載開始前按最終大小預先佔用磁碟空間：可以減少磁碟碎片，並在空間不足時提前發現；對 SSD 無益，大檔案 + 機械硬碟建議開啟。",
  "help.incomplete_ext":
    "未下載完成的檔案會加上 .!qB 字尾，防止被當作完整檔案誤開啟；下載完成後自動去掉字尾。",
  "help.auto_tmm":
    "自動種子管理(ATM)：種子的儲存路徑跟隨分類設定和預設路徑自動調整，移動分類時檔案會自動搬到對應目錄。關閉後每個種子路徑完全手動控制。",
  "help.save_path": "新新增種子的預設儲存目錄。新增種子時可以臨時改，之後也可在種子裡單獨修改。",
  "help.add_stopped":
    "種子新增後處於暫停狀態，需要手動點「繼續」才開始下載。適合想先檢查檔案勾選、調整優先順序再下載的場景。",
  "help.export_dir":
    "為每個新增的種子在指定目錄保留一份 .torrent 副本，方便備份或遷移到其他下載器。",
  "help.temp_path":
    "未完成的下載先存放在此臨時目錄，下載完成後移動到儲存目錄。建議放在同一塊磁碟上，跨磁碟移動大檔案會很慢。",
  "help.autorun":
    "種子下載完成時自動執行命令。支援變數：%N 種子名、%F 儲存路徑、%R 根目錄、%L 分類、%I hash。僅在 qBittorrent 伺服器上執行。",
  "help.listen_port":
    "其他下載者連線你使用的埠，相當於你的「門牌號」。在路由器上為該埠做埠轉發（或配合 UPnP）能顯著改善連線性和速度。",
  "help.random_port": "每次啟動隨機換一個監聽埠。如果你在路由器上做了固定的埠轉發，請關閉此項。",
  "help.upnp":
    "透過 UPnP/NAT-PMP 協議讓路由器自動開放監聽埠，免去手動配置埠轉發。部分老舊路由器不支援或行為不穩定。",
  "help.max_connec":
    "所有種子加起來允許的最大連線數。過低會限制下載速度，過高會拖慢路由器和系統。家庭寬頻 200-500 較合適。",
  "help.max_connec_per_torrent":
    "單個種子允許的最大連線數。熱門資源可以高一些，冷門資源用預設值即可。",
  "help.max_uploads": "全域性上傳通道數，決定同一時刻能給多少個節點傳資料。做種多的話適當調高。",
  "help.proxy":
    "讓流量經過代理伺服器。SOCKS5 更通用（支援 BT peer 連線）,HTTP 代理僅適合部分場景。",
  "help.proxy_peers":
    "與 peer 的點對點連線也走代理。不開的話只有 tracker 彙報、網頁請求等走代理，BT 資料直連。",
  "help.proxy_torrents_only": "只有 BT 下載相關流量走代理，tracker、更新檢查等請求直連。",
  "help.global_limit":
    "全域性下載限速，對所有種子生效。0 表示不限速。也可以用狀態列的「備用速度」一鍵臨時切換限速。",
  "help.scheduler":
    "在設定的時間段內自動啟用上面的備用限速。例如每天晚高峰自動限速，白天恢復全速。",
  "help.limit_utp": "限速是否作用於 μTP 連線。μTP 協議本身會在網路繁忙時主動讓路，一般無需勾選。",
  "help.limit_overhead":
    "限速是否把 BT 協議自身的握手/校驗等開銷算進限額。勾選後實際上下速度會更嚴格。",
  "help.limit_lan_peers": "限速是否對區域網內的節點生效。區域網傳輸很快，一般不勾。",
  "help.dht":
    "分散式雜湊表：不需要 tracker 伺服器也能找到其他下載者，是磁力連結工作的基礎。使用私有 tracker（PT 站）的種子時必須關閉，否則可能被站點封號。",
  "help.pex": "Peer 交換：從已連線的節點那裡發現更多節點，加快找齊下載者。PT 站同樣要求關閉。",
  "help.lsd":
    "本地服務發現：自動發現並直連同一區域網內的其他 qBittorrent 使用者，內網互傳不走外網。",
  "help.encryption":
    "協議加密：對 BT 流量做協議混淆，可緩解運營商對 BT 的限速/干擾。「優先」相容性最好；「強制」可能連不上不支援加密的節點。",
  "help.anonymous_mode":
    "匿名模式：禁用入站連線、隱藏客戶端特徵、只透過代理通訊，會明顯減少可用節點、降低速度，只建議配合可靠代理在特殊需求下開啟。",
  "help.utp":
    "μTP 協議在網路擁塞時會主動讓路，下載時不影響同網路的網頁/遊戲；TCP 更激進。預設兩者兼顧。",
  "help.queueing":
    "排隊機制：限制同時活躍的下載/做種數量，超出的排隊等待，避免頻寬被大量任務攤薄、哪個都下不完。",
  "help.max_active_downloads":
    "同時下載的種子數上限，其餘排隊等待。建議 3-5 個，頻寬充足可以更多。",
  "help.slow_torrents":
    "速度/做種數低於閾值的「慢種子」不佔用活躍名額，避免一個卡住的種子堵住整個佇列。",
  "help.max_ratio":
    "分享率 = 累計上傳量 ÷ 下載量，1.0 表示上傳量等於下載量下載一樣多的資料。達到設定值後按下面的動作暫停或移除。PT 站使用者請按站點要求設定。",
  "help.max_seeding_time": "做種滿設定分鐘數後自動暫停或移除，和分享率條件滿足其一即觸發。",
  "help.add_trackers":
    "為所有新種子追加這份公共 tracker 列表，在種子自帶 tracker 失效時提供更多來源。對 PT 站種子無效（私有種子不允許新增）。每行一個地址。",
  "help.rss_processing": "定期抓取所有 RSS 訂閱源，更新文章列表。關閉後訂閱不再自動重新整理。",
  "help.rss_auto": "配合「RSS 下載規則」使用：規則匹配到新種子時自動新增下載，適合追劇/追更。",
  "help.repack":
    "同一集釋出了 REPACK/PROPER 修復版（修正壓制錯誤的重發）時也自動下載。不勾則只認首發版本。",
  "help.session_timeout": "登入會話閒置多少秒後過期，過期後需要重新登入。",
  "help.csrf":
    "防止跨站請求偽造：避免惡意網頁借你的登入狀態操控 qBittorrent。透過反向代理或開發代理訪問時可能誤攔，屆時需臨時關閉。",
  "help.host_validation":
    "校驗 HTTP Host 頭，防止透過非預期域名訪問 WebUI。經代理訪問遇到 401 且賬號密碼正確時，可嘗試關閉此項。",
  "help.clickjacking": "禁止本頁面被其他網站嵌入 iframe，防止點選劫持攻擊。",
  "help.secure_cookie":
    "會話 Cookie 僅透過 HTTPS 傳輸。沒有啟用 HTTPS 時請勿開啟，否則將無法登入。",
  "help.domain_list": "允許訪問 WebUI 的域名白名單，逗號分隔，* 表示全部放行。配合 Host 校驗使用。",
  "help.bypass_local": "從本機(127.0.0.1)訪問 WebUI 時免登入。",
  "help.bypass_subnet":
    "白名單網段內的訪問免登入，例如家裡的區域網。注意：任何能偽裝成該來源地址的請求同樣免認證，公網環境慎用。",
  "help.https":
    "啟用 HTTPS 需要提供證書和私鑰檔案（可用 OpenSSL 自籤）。自簽證書瀏覽器會提示不受信任，屬正常現象。",
  "help.announce_ip":
    "向 tracker 彙報的 IP 地址，留空則自動檢測。僅在有公網 IP 但檢測不準確時才需要填寫。",
  "help.async_io": "磁碟非同步讀寫執行緒數。機械硬碟建議 4,SSD 或 NVMe 可以適當調大提升吞吐。",
  "help.file_pool":
    "同時保持開啟的檔案數量。包含大量檔案的大種子可以調大，減少反覆開關檔案的開銷。",
  "help.network_interface":
    "強制 BT 流量走指定網絡卡。多網絡卡或 VPN 環境下可以讓下載不走 VPN，留空則由系統決定。",
  "help.resolve_countries": "查詢每個 peer 的國家/地區並在列表中顯示旗幟，會略微增加流量。",
  "help.anonymous":
    "匿名模式：禁用入站連線、隱藏客戶端特徵、只透過代理通訊，會明顯減少可用節點、降低速度，只建議配合可靠代理在特殊需求下開啟。",
  "help.limit_lan": "限速是否對區域網內的節點生效。區域網傳輸很快，一般不勾。",
} satisfies Dictionary;
