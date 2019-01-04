/**
 * @desc 仅需要引入让其执行
 */
import "./background/start-changelog.js";

import { KeywordSearch } from "./background/keyword-search.js";

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

/**
 * @desc Core Share Module (APIs)
 */
self.coreAPIs = {
    keywordSearch: new KeywordSearch(),
};
