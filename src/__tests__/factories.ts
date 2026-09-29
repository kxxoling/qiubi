/**
 * Typed test-data factories (faker for filler values, explicit overrides for
 * what the test actually cares about):
 *
 *   const t = buildTorrent({ name: "ubuntu", state: "downloading" });
 *
 * The repo already ships @faker-js/faker (demo server seeding); these
 * factories just expose the same idea to unit tests so suites stop
 * hand-rolling half-complete fixtures (missing fields typed as required,
 * copy-pasted between files).
 */
import { faker } from "@faker-js/faker/locale/en";
import type { RssArticle, RssFeed, TorrentInfo } from "@/types/qbt";
import { TORRENT_STATES } from "@/types/qbt";

export function buildTorrent(over: Partial<TorrentInfo> = {}): TorrentInfo {
  return {
    hash: faker.string.hexadecimal({ length: 40, casing: "lower" }),
    name: faker.system.fileName(),
    state: faker.helpers.arrayElement(TORRENT_STATES),
    category: "",
    tags: "",
    tracker: faker.internet.url(),
    progress: faker.number.float({ min: 0, max: 1 }),
    dlspeed: faker.number.int({ min: 0, max: 5_000_000 }),
    upspeed: faker.number.int({ min: 0, max: 1_000_000 }),
    size: faker.number.int({ min: 1_000_000, max: 20_000_000_000 }),
    downloaded: faker.number.int({ min: 0, max: 20_000_000_000 }),
    uploaded: faker.number.int({ min: 0, max: 2_000_000_000 }),
    eta: faker.number.int({ min: 0, max: 86_400 }),
    ratio: faker.number.float({ min: 0, max: 8 }),
    num_seeds: faker.number.int({ min: 0, max: 60 }),
    num_complete: faker.number.int({ min: 0, max: 500 }),
    num_leechs: faker.number.int({ min: 0, max: 30 }),
    num_incomplete: faker.number.int({ min: 0, max: 500 }),
    amount_left: faker.number.int({ min: 0, max: 20_000_000_000 }),
    time_active: faker.number.int({ min: 0, max: 500_000 }),
    added_on: faker.number.int({ min: 1_600_000_000, max: 1_760_000_000 }),
    availability: faker.number.float({ min: 0, max: 2 }),
    ...over,
  } as TorrentInfo;
}

export function buildArticle(over: Partial<RssArticle> = {}): RssArticle {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(4),
    link: faker.internet.url(),
    torrentURL: "",
    isRead: false,
    date: "2026-09-28T00:00:00Z",
    ...over,
  } as RssArticle;
}

/** articles accepts plain titles for brevity: buildFeed({ articles: ["x", "y"] }) */
export function buildFeed(
  over: Partial<Omit<RssFeed, "articles">> & { articles?: string[] } = {},
): RssFeed {
  const { articles: titles, ...rest } = over;
  return {
    uid: faker.string.uuid(),
    url: faker.internet.url(),
    title: faker.lorem.words(2),
    articles: (titles ?? []).map((t) => buildArticle({ title: t })),
    ...rest,
  } as RssFeed;
}
