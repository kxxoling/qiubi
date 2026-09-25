/**
 * Minimal browser shims for the two Node builtins @ctrl/torrent-file
 * imports: createHash('sha1'|'sha256') and path.sep.
 *
 * Replaces the earlier crypto-browserify polyfill (~240 modules, +1.4 MB to
 * the bundle) — hashing via the tiny audited @noble/hashes; the only path
 * API the library touches is the separator.
 */
import { sha1 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export function createHash(algorithm) {
  let data = new Uint8Array();
  return {
    update(chunk) {
      const incoming = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
      const merged = new Uint8Array(data.length + incoming.length);
      merged.set(data);
      merged.set(incoming, data.length);
      data = merged;
      return this;
    },
    digest(encoding) {
      const bytes = algorithm === "sha1" ? sha1(data) : sha256(data);
      return encoding === "hex" ? toHex(bytes) : bytes;
    },
  };
}

export const sep = "/";
