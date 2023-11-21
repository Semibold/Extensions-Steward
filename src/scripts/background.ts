/**
 * @desc 仅需要引入让其执行
 */
import "./background/context-menu.js";
import "./background/start-changelog.js";

import { KeywordSearch } from "./background/keyword-search.js";

declare global {
    interface Window {
        keywordSearch: KeywordSearch;
    }
}

/**
 * @desc Omnibox default suggestion
 */
chrome.omnibox.setDefaultSuggestion({
    description: chrome.i18n.getMessage("omnibox_default_suggestion"),
});

/**
 * @desc Chrome webstore search
 */
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
    const url = `https://chrome.google.com/webstore/search/${encodeURIComponent(text)}`;
    switch (disposition) {
        case "currentTab":
            chrome.tabs.update({ url: url });
            break;
        case "newForegroundTab":
            chrome.tabs.create({ url: url, active: true });
            break;
        case "newBackgroundTab":
            chrome.tabs.create({ url: url, active: false });
            break;
    }
});

self.keywordSearch = new KeywordSearch();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message) return;

    switch (message.type) {
        case "keywordSearch":
            sendResponse(self.keywordSearch.search(message.input));
            break;
    }
});
