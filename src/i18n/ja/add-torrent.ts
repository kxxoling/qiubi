// Add-torrent dialog — links, local files, per-torrent options, result toasts.
import type { Dictionary } from "@/i18n/types";

export default {
  "Add Torrent": "新しいダウンロード",
  "Add from URL": "URL から追加",
  "Add from Magnet": "マグネットから追加",
  "Add from File": "ファイルから追加",
  Links: "リンク",
  "Magnet, URL or infohash — one per line": "マグネット・URL・infohash を 1 行に 1 つずつ",
  "Links (magnet / URL / infohash, one per line)":
    "リンク(マグネット / URL / infohash、1 行に 1 つ)",
  "Torrent files": "トレントファイル",
  "Click to choose or drop .torrent files": "クリックして .torrent ファイルを選択、またはドロップ",
  "Choose or drop .torrent files": ".torrent ファイルを選択またはドロップ",
  "files selected": "個のファイルを選択",
  "Only .torrent files are supported": ".torrent ファイルのみ対応しています",
  "Select files to download": "ダウンロードするファイルを選択",
  "Toggle all": "すべて切り替え",
  "(multiple select supported)": "(複数選択可)",
  "Download Directory": "ダウンロード先",
  "Create subfolder": "サブフォルダを作成",
  "Skip hash check": "ハッシュチェックを省略",
  "Do not start download automatically": "自動的にダウンロードを開始しない",
  "Original name": "元の名前",
  Cookie: "Cookie",
  "Download Limit": "ダウンロード制限",
  "Upload Limit": "アップロード制限",
  "Share Ratio Limit": "共有比の制限",
  "Seeding Time Limit": "シード時間の制限",
  "Torrent already exists": "トレントは既に存在します",
  "Added successfully": "追加しました",
  "Torrent added": "トレントを追加しました",
} satisfies Dictionary;
