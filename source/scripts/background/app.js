import {Config} from "../sharre/config.js";

/**
 * @desc 右键菜单：卸载扩展
 */
chrome.contextMenus.create({
  id: Config.removeExtensionId,
  title: chrome.i18n.getMessage("remove_extension"),
  visible: false,
  contexts: ["page"],
  documentUrlPatterns: [chrome.runtime.getURL("popup.html")],
});

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
  const url = `https://chrome.google.com/webstore/search/${text}`;
  switch (disposition) {
    case "currentTab":
      chrome.tabs.query({active: true, highlighted: true,}, tabs => {
        for (const tab of tabs) chrome.tabs.update(tab.id, {url: url});
      });
      break;
    case "newForegroundTab":
      chrome.tabs.create({url: url, active: true});
      break;
    case "newBackgroundTab":
      chrome.tabs.create({url: url, active: false});
      break;
  }
});