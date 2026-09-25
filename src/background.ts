/// <reference types="chrome" />
/**
 * Plasmo background service worker (MV3).
 *
 * qiubi talks to the qBittorrent Web API directly from its page — no
 * messaging is needed. The only job here: open the UI in a new tab when the
 * toolbar icon is clicked (the extension deliberately does NOT override the
 * browser's new-tab page).
 */
chrome.action.onClicked.addListener(() => {
  void chrome.tabs.create({ url: chrome.runtime.getURL("app/index.html") });
});
