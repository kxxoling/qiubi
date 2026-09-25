// Add-torrent dialog — links, local files, per-torrent options, result toasts.
import type { Dictionary } from "@/i18n/types";

export default {
  "Add Torrent": "新建下载任务",
  "Add from URL": "从 URL 添加",
  "Add from Magnet": "从磁力链接添加",
  "Add from File": "从文件添加",
  Links: "链接",
  "Magnet, URL or infohash — one per line": "Magnet、URL 或 infohash，一行一个",
  "Links (magnet / URL / infohash, one per line)":
    "链接（magnet / URL / infohash，一行一个，可混贴）",
  "Torrent files": "种子文件",
  "Click to choose or drop .torrent files": "点击选择或拖入 .torrent 文件",
  "Choose or drop .torrent files": "选择或拖入 .torrent 文件",
  "files selected": "个文件已选",
  "Only .torrent files are supported": "仅支持 .torrent 文件",
  "Select files to download": "选择要下载的文件",
  "Toggle all": "全选/全不选",
  "(multiple select supported)": "（支持多选）",
  "Download Directory": "下载目录",
  "Create subfolder": "创建子文件夹",
  "Skip hash check": "跳过哈希校验",
  "Do not start download automatically": "不自动开始下载",
  "Original name": "原始名称",
  Cookie: "Cookie",
  "Download Limit": "下载限速",
  "Upload Limit": "上传限速",
  "Share Ratio Limit": "分享率限制",
  "Seeding Time Limit": "做种时长限制",
  "Torrent already exists": "种子已存在",
  "Added successfully": "添加成功",
  "Torrent added": "种子已添加",
} satisfies Dictionary;
