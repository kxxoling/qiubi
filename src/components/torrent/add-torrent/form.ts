/**
 * Add-torrent dialog form model: default values, shared form types and
 * pasted-link normalization.
 */

export const DEFAULTS = {
  urls: "",
  files: [] as File[],
  category: "",
  savePath: "",
  tags: "",
  rename: "",
  cookie: "",
  dlLimit: "",
  upLimit: "",
  ratioLimit: "",
  seedingTimeLimit: "",
  paused: false,
  rootFolder: true,
  skipChecking: false,
  sequential: false,
  firstLast: false,
  autoTMM: false,
};

export type AddTorrentForm = typeof DEFAULTS;

/** Type-safe setter for a single form field */
export type SetFormField = <K extends keyof AddTorrentForm>(
  key: K,
  value: AddTorrentForm[K],
) => void;

/** Normalize one pasted link line: wrap bare info-hashes into magnet URIs */
export function normalizeLink(line: string): string | null {
  const s = line.trim();
  if (!s) return null;
  if (/^(magnet:|https?:\/\/)/i.test(s)) return s;
  if (/^[a-f0-9]{40}$/i.test(s) || /^[a-z2-7]{32}$/i.test(s)) {
    return `magnet:?xt=urn:btih:${s}`;
  }
  return s;
}
