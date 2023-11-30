import { locale } from "./sharre/locale.js";
import {
    PConfig,
    K_EXTENSION_TYPE_CHECKED,
    K_AUTO_DISPLAY_CHANGELOG,
    K_KEEP_LAST_SEARCH_STATUS,
    ChromeExtensionType,
} from "./sharre/constant.js";
import { chromeStorageSync } from "./sharre/chrome-storage.js";

/**
 * @desc i18n
 */
locale();

function setOptionsItem(node: HTMLInputElement, items: Record<string, any>, key: string) {
    if (!node) return;
    node.checked = Boolean(items[key]);
    node.addEventListener("click", (e) => {
        const target = e.target as HTMLInputElement;
        const checked = target.checked;
        chrome.storage.sync.set({ [key]: checked }, () => {
            if (chrome.runtime.lastError) {
                node.checked = !checked;
            }
        });
    });
}

chromeStorageSync.promise.then((items) => {
    setOptionsItem(document.querySelector(`input[value="update_details"]`), items, K_AUTO_DISPLAY_CHANGELOG);
    setOptionsItem(document.querySelector(`input[value="search_status"]`), items, K_KEEP_LAST_SEARCH_STATUS);
});

/**
 * @desc 配置数据同步
 */
chromeStorageSync.promise.then((items) => {
    const eTypeChecked = Object.assign(PConfig.eTypeChecked, items[K_EXTENSION_TYPE_CHECKED]);
    for (const [type, checked] of Object.entries<boolean>(eTypeChecked)) {
        const node = document.querySelector<HTMLInputElement>(`input[value="${type}"]`);
        const disabled = PConfig.eTypeDisabled[type as ChromeExtensionType];
        if (!node) continue;
        node.checked = checked;
        node.disabled = disabled;
        node.addEventListener("click", (e) => {
            if (!disabled) {
                eTypeChecked[type as ChromeExtensionType] = node.checked;
                chrome.storage.sync.set({
                    [K_EXTENSION_TYPE_CHECKED]: eTypeChecked,
                });
            }
        });
    }
});
