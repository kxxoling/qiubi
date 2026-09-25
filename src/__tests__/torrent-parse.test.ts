/**
 * Client-side .torrent parsing unit tests (@ctrl/torrent-file)
 *
 * Minimal valid bencode is hand-crafted: keys must be in dictionary order
 * (strict decoders reject out-of-order keys). Covers v1 single/multi-file,
 * v2 file tree, and malformed input.
 */
import { describe, expect, test } from "vitest";
import { parseTorrentFile } from "@/lib/torrentParse";

/** bencode string → File (for tests; piece hash content is arbitrary — it only
 *  affects hash values, not structure) */
const toFile = (s: string, name = "test.torrent") => new File([new TextEncoder().encode(s)], name);

// prettier-ignore
const PIECES_20 = "01234567890123456789"; // 20 bytes, serving as the single piece's SHA-1

/** v1 single file: info key order length < name < piece length < pieces */
const V1_SINGLE = `d8:announce27:http://example.com/announce4:infod6:lengthi4096e4:name8:test.bin12:piece lengthi32768e6:pieces20:${PIECES_20}ee`;

/** v1 multi-file: info key order files < name < piece length < pieces;
 *  path is a UTF-8 segment list */
const V1_MULTI = `d4:infod5:filesld6:lengthi100e4:pathl3:dir5:a.txteed6:lengthi200e4:pathl3:dir5:b.txteee4:name4:demo12:piece lengthi16384e6:pieces20:${PIECES_20}ee`;

/**
 * v2 (BEP 52): info key order file tree < meta version < name < piece length;
 * leaf keys are empty strings, non-empty files must carry a 32-byte pieces root
 * (Merkle root), and piece length must be a power of 2 ≥ 16KiB — these are the
 * strict validation rules of @ctrl/torrent-file
 */
const V2_TREE =
  "d4:infod9:file treed4:rootd0:d6:lengthi256e11:pieces root32:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaee3:subd4:leafd0:d6:lengthi512e11:pieces root32:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaeeee12:meta versioni2e4:name4:demo12:piece lengthi16384ee12:piece layersdee";

describe("parseTorrentFile", () => {
  test("v1 single-file torrent", async () => {
    const parsed = await parseTorrentFile(toFile(V1_SINGLE));
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe("test.bin");
    expect(parsed?.files).toEqual([{ path: expect.stringContaining("test.bin"), size: 4096 }]);
    expect(parsed?.infoHash).toMatch(/^[0-9a-f]{40}$/);
  });

  test("v1 multi-file torrent preserves file order (filePrio depends on indexes)", async () => {
    const parsed = await parseTorrentFile(toFile(V1_MULTI));
    expect(parsed?.name).toBe("demo");
    expect(parsed?.files).toHaveLength(2);
    expect(parsed?.files[0].size).toBe(100);
    expect(parsed?.files[1].size).toBe(200);
    expect(parsed?.files[0].path).toMatch(/a\.txt$/);
    expect(parsed?.files[1].path).toMatch(/b\.txt$/);
  });

  test("v2 torrent reads file tree (sorted-key depth-first traversal)", async () => {
    const parsed = await parseTorrentFile(toFile(V2_TREE));
    expect(parsed?.name).toBe("demo"); // BEP 52 still keeps info.name
    // Paths carry the torrent-name prefix; order = file tree key order
    // (root < sub), aligned with filePrio indices
    expect(parsed?.files).toEqual([
      { path: "demo/root", size: 256 },
      { path: "demo/sub/leaf", size: 512 },
    ]);
    expect(parsed?.infoHash).toMatch(/^[0-9a-f]{64}$/); // v2 infohash is SHA-256
  });

  test("garbage bytes return null (never throws)", async () => {
    expect(await parseTorrentFile(toFile("this is not a torrent"))).toBeNull();
    expect(await parseTorrentFile(toFile(""))).toBeNull();
    expect(await parseTorrentFile(toFile("d4:infod"))).toBeNull(); // truncated
    expect(await parseTorrentFile(toFile("i42e"))).toBeNull(); // top level is not a dict
  });
});
