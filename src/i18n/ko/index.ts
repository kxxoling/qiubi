// ko dictionary — merged from per-feature modules; keys stay flat.

import addTorrent from "./add-torrent";
import commandPalette from "./command-palette";
import common from "./common";
import dashboard from "./dashboard";
import detail from "./detail";
import help from "./help";
import layout from "./layout";
import log from "./log";
import login from "./login";
import rss from "./rss";
import search from "./search";
import settings from "./settings";
import torrents from "./torrents";

export default {
  ...common,
  ...login,
  ...layout,
  ...dashboard,
  ...torrents,
  ...addTorrent,
  ...detail,
  ...rss,
  ...search,
  ...log,
  ...commandPalette,
  ...settings,
  ...help,
};
