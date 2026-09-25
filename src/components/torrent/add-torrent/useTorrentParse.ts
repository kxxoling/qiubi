/**
 * Client-side parsing of picked .torrent files into a Map keyed by file name
 * (feeds the selective-download checkbox list).
 */
import { useState } from "react";
import { type ParsedTorrent, parseTorrentFile } from "@/lib/torrentParse";

export function useTorrentParse() {
  /** File name → parsed torrent info (name + file list) */
  const [parsedTorrents, setParsedTorrents] = useState<Map<string, ParsedTorrent>>(new Map());

  /** Parse each .torrent's file list asynchronously (does not block the picker) */
  const parseFiles = (files: File[]) => {
    files.forEach((file) => {
      parseTorrentFile(file)
        .then((parsed) => {
          if (parsed) {
            setParsedTorrents((prev) => new Map(prev).set(file.name, parsed));
          }
        })
        .catch(() => {});
    });
  };

  const resetParsedTorrents = () => setParsedTorrents(new Map());

  return { parsedTorrents, parseFiles, resetParsedTorrents };
}
