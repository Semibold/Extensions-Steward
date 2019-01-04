import { getPinyinFromHanzi } from "./hanzi-to-pinyin.js";

/**
 * Search chrome extensions in background page
 */
export class KeywordSearch {
    constructor() {
        this.caches = new Map();
        this.separatorSymbol = "@";
        this.generateAllCaches();
        this.registerEvents();
    }

    /**
     * @private
     */
    generateAllCaches() {
        chrome.management.getAll(result => {
            for (const item of result) {
                this.addItemCache(item);
            }
        });
    }

    /**
     * @private
     * @param {chrome.management.ExtensionInfo} item
     */
    addItemCache(item) {
        const tokens = getPinyinFromHanzi(item.name);
        const contents = { target: "", source: "" };
        for (const token of tokens) {
            contents.target += token.target.toLowerCase();
            contents.source += token.source.toLowerCase();
        }
        this.caches.set(item.id, { item, tokens, contents });
    }

    /**
     * @private
     * @param {string} id
     */
    removeItemCache(id) {
        this.caches.delete(id);
    }

    /**
     * @private
     */
    registerEvents() {
        chrome.management.onInstalled.addListener(item => this.addItemCache(item));
        chrome.management.onUninstalled.addListener(id => this.removeItemCache(id));
    }

    /**
     * @public
     * @param {string} input - User input
     * @return {chrome.management.ExtensionInfo[]}
     */
    search(input) {
        if (!input) {
            return Array.from(this.caches.values());
        }
        const segments = input
            .toLowerCase()
            .replace(/\s+/, "")
            .split(this.separatorSymbol);
        const keyword = segments.shift();
        const qualifier = segments.length > 1 ? segments.pop() : "";
        if (!keyword) {
            return this.filterByQualifier(qualifier);
        }
        const result = [];
        const chars = keyword.split("");
        for (const cache of this.caches.values()) {
            if (this.isKeywordMatchName(cache.item.id, chars)) {
                result.push(cache.item);
            }
        }
        return this.filterByQualifier(qualifier, result);
    }

    /**
     * @private
     * @param {string} qualifier
     * @param {chrome.management.ExtensionInfo[]} [list]
     * @return {chrome.management.ExtensionInfo[]}
     */
    filterByQualifier(qualifier, list) {
        const result = list || Array.from(this.caches.values());
        switch (qualifier) {
            // 打开、启用
            case "dk":
            case "dakai":
            case "qy":
            case "qiyong":
            case "enable":
            case "enabled":
                return result.filter(item => item.enabled);
            // 关闭、禁用
            case "gb":
            case "guanbi":
            case "jy":
            case "jinyong":
            case "disable":
            case "disabled":
                return result.filter(item => !item.enabled);
            default:
                return result;
        }
    }

    /**
     * @private
     * @param {string} id - Extension ID
     * @param {string[]} chars
     * @return {boolean}
     */
    isKeywordMatchName(id, chars) {
        const cache = this.caches.get(id);
        const pointers = { target: 0, source: 0 };
        for (const char of chars) {
            if (pointers.target !== -1) {
                pointers.target = cache.contents.target.indexOf(char, pointers.target);
            }
            if (pointers.source !== -1) {
                pointers.source = cache.contents.source.indexOf(char, pointers.source);
            }
            if (pointers.target === -1 && pointers.source === -1) {
                return false;
            }
        }
        return true;
    }
}
