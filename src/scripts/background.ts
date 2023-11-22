/**
 * @desc 仅需要引入让其执行
 */
import "./background/context-menu.js";
import "./background/start-changelog.js";
import "./background/omnibox.js";

import { KeywordSearch } from "./background/keyword-search.js";

const keywordSearch = new KeywordSearch();

chrome.runtime.onMessage.addListener((message: RuntimeMessageSchema, sender, sendResponse) => {
    if (!message) return;

    switch (message.type) {
        case "keywordSearch":
            sendResponse(keywordSearch.search(message.input));
            break;
    }
});
