import { locale } from "./sharre/locale.js";
import {
    PConfig,
    K_EXTENSION_TYPE_CHECKED,
    K_AUTO_DISPLAY_CHANGELOG,
    K_KEEP_LAST_SEARCH_STATUS,
} from "./sharre/constant.js";

/**
 * @desc i18n
 */
locale();

function setOptionsItem(node: HTMLInputElement | null, items: Record<string, any>, key: string) {
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

chrome.storage.sync.get(
    {
        [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
        [K_KEEP_LAST_SEARCH_STATUS]: PConfig.defaultOptions.keepLastSearchStatus,
    },
    (items) => {
        if (chrome.runtime.lastError) return;
        setOptionsItem(document.querySelector(`input[value="update_details"]`), items, K_AUTO_DISPLAY_CHANGELOG);
        setOptionsItem(document.querySelector(`input[value="search_status"]`), items, K_KEEP_LAST_SEARCH_STATUS);
    },
);

/**
 * @desc 配置数据同步
 */
chrome.storage.sync.get(K_EXTENSION_TYPE_CHECKED, (items) => {
    if (chrome.runtime.lastError) return;
    const eTypeChecked = Object.assign(PConfig.eTypeChecked, items[K_EXTENSION_TYPE_CHECKED]);
    for (const [type, checked] of Object.entries<boolean>(eTypeChecked)) {
        const node = document.querySelector<HTMLInputElement>(`input[value="${type}"]`);
        const disabled =
            PConfig.eTypeDisabled[
                type as "extension" | "hosted_app" | "packaged_app" | "legacy_packaged_app" | "theme"
            ];
        if (!node) continue;
        node.checked = checked;
        node.disabled = disabled;
        node.addEventListener("click", (e) => {
            if (!disabled) {
                eTypeChecked[type] = node.checked;
                chrome.storage.sync.set({
                    [K_EXTENSION_TYPE_CHECKED]: eTypeChecked,
                });
            }
        });
    }
});
