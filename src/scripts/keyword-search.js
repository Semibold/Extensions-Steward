import { getPinyinFromHanzi } from "./hanzi-to-pinyin.js";

/**
 * Search chrome extensions
 */
export class KeywordSearch {
    /**
     * @param {ExtensionInfo[]} list
     */
    constructor(list) {
        this.list = list;
        this.caches = new Map();
        this.generateCaches();
    }

    /**
     * @private
     */
    generateCaches() {
        for (const item of this.list) {
            const tokens = getPinyinFromHanzi(item.name);
            const contents = { target: "", source: "" };
            for (const token of tokens) {
                contents.target += token.target.toLowerCase();
                contents.source += token.source.toLowerCase();
            }
            this.caches.set(item.id, { item, tokens, contents });
        }
    }

    /**
     * @public
     * @param {string} keyword - User input
     * @return {ExtensionInfo[]}
     */
    search(keyword) {
        const result = [];
        if (!keyword) {
            return this.list;
        }
        const chars = keyword
            .toLowerCase()
            .replace(/\s+/, "")
            .split("");
        for (const cache of this.caches.values()) {
            if (this.isKeywordMatchName(cache.item.id, chars)) {
                result.push(cache.item);
            }
        }
        return result;
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
