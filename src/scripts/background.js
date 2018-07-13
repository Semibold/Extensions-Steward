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
            chrome.tabs.update({url: url});
            break;
        case "newForegroundTab":
            chrome.tabs.create({url: url, active: true});
            break;
        case "newBackgroundTab":
            chrome.tabs.create({url: url, active: false});
            break;
    }
});