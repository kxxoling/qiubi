/**
 * Client-side .torrent file parsing (based on @ctrl/torrent-file)
 *
 * Extracted from the .torrent binary:
 * - Torrent name
 * - File list (path + size; for v1 take info.files[], for v2/hybrid take the
 *   file tree's depth-first key order, matching qBT/libtorrent's file index
 *   order — selective download sends filePrio by index, so a mismatched order
 *   would skip the wrong files)
 * - infohash (v1 SHA-1 / v2 SHA-256, whichever is available per torrent version)
 *
 * Parsing is async (doesn't block the UI); returns null on failure (without
 * affecting the normal add flow).
 */
import { hashes, info, files as torrentFiles } from "@ctrl/torrent-file";

export type ParsedTorrentFile = {
  /** File path (multi-file torrents include directories) */
  path: string;
  /** File size (bytes) */
  size: number;
};

export type ParsedTorrent = {
  name: string;
  files: ParsedTorrentFile[];
  /** infohash (hex; v1 is a 40-char SHA-1, v2 a 64-char SHA-256) */
  infoHash: string;
};

/**
 * Parse a .torrent file, extracting the name and file list.
 * Async, non-blocking; returns null on failure (not a torrent / corrupted data).
 */
export async function parseTorrentFile(file: File): Promise<ParsedTorrent | null> {
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    const meta = info(data);
    const fileList = torrentFiles(data);
    const { infoHash, infoHashV2 } = hashes(data);

    const files: ParsedTorrentFile[] = fileList.files.map((f) => ({
      path: f.path,
      size: f.length,
    }));
    if (!meta.name || files.length === 0) return null;

    return { name: meta.name, files, infoHash: infoHash ?? infoHashV2 ?? "" };
  } catch {
    return null;
  }
}
