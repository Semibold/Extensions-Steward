import { K_AUTO_DISPLAY_CHANGELOG, PConfig } from "../sharre/constant.js";

/**
 * Changelog
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: chrome.i18n.getMessage("project_readme"),
        });
    }
    if (details.reason === "update") {
        const [prevMajor, prevMinor] = details.previousVersion.split(".", 2);
        const [major, minor] = chrome.runtime.getManifest().version.split(".", 2);
        // ignore changelog if major and minor have been not changed
        if (prevMajor === major) {
            if (prevMinor || minor) {
                if (prevMinor === minor) return;
            } else {
                return;
            }
        }
        chrome.storage.sync.get(
            {
                [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
            },
            (items) => {
                if (chrome.runtime.lastError) return;
                if (items[K_AUTO_DISPLAY_CHANGELOG]) {
                    chrome.tabs.create({
                        url: chrome.i18n.getMessage("project_changelog"),
                    });
                }
            },
        );
    }
});
