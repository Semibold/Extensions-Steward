import {locale} from "./locale.js";
import {Config} from "./config.js";

/**
 * @desc i18n
 */
locale();

/**
 * @desc 配置数据同步
 */
chrome.storage.sync.get(Config.etcKey, items => {
    const eTypeChecked = Object.assign(Config.eTypeChecked, items[Config.etcKey]);
    for (const [type, checked] of Object.entries(eTypeChecked)) {
        const node = document.querySelector(`input[value="${type}"]`);
        const disabled = Config.eTypeDisabled[type];
        if (!node) continue;
        node.checked = checked;
        node.disabled = disabled;
        node.addEventListener("click", e => {
            if (!disabled) {
                eTypeChecked[type] = node.checked;
                chrome.storage.sync.set({
                    [Config.etcKey]: eTypeChecked,
                });
            }
        });
    }
});