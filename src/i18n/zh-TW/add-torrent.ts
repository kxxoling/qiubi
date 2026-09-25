// Add-torrent dialog — links, local files, per-torrent options, result toasts.
import type { Dictionary } from "@/i18n/types";

export default {
  "Add Torrent": "新增下載任務",
  "Add from URL": "從 URL 新增",
  "Add from Magnet": "從磁力連結新增",
  "Add from File": "從檔案新增",
  Links: "連結",
  "Magnet, URL or infohash — one per line": "Magnet、URL 或 infohash，一行一個",
  "Links (magnet / URL / infohash, one per line)":
    "連結（magnet / URL / infohash，一行一個，可混貼）",
  "Torrent files": "種子檔案",
  "Click to choose or drop .torrent files": "點選選擇或拖入 .torrent 檔案",
  "Choose or drop .torrent files": "選擇或拖入 .torrent 檔案",
  "files selected": "個檔案已選",
  "Only .torrent files are supported": "僅支援 .torrent 檔案",
  "Select files to download": "選擇要下載的檔案",
  "Toggle all": "全選/全不選",
  "(multiple select supported)": "（支援多選）",
  "Download Directory": "下載目錄",
  "Create subfolder": "建立子資料夾",
  "Skip hash check": "跳過雜湊校驗",
  "Do not start download automatically": "不自動開始下載",
  "Original name": "原始名稱",
  Cookie: "Cookie",
  "Download Limit": "下載限速",
  "Upload Limit": "上傳限速",
  "Share Ratio Limit": "分享率限制",
  "Seeding Time Limit": "做種時長限制",
  "Torrent already exists": "種子已存在",
  "Added successfully": "新增成功",
  "Torrent added": "種子已新增",
} satisfies Dictionary;
