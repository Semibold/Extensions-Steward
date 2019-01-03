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
            this.caches.set(item.id, {
                item: item,
                tokens: getPinyinFromHanzi(item.name),
            });
        }
    }

    /**
     * @public
     * @param {string} keyword
     * @return {ExtensionInfo[]}
     */
    search(keyword) {
        const result = [];
        if (!keyword) {
            return this.list;
        }
        for (const cache of this.caches.values()) {
            if (this.isKeywordMatchName(cache.item.id, keyword)) {
                result.push(cache.item);
            }
        }
        return result;
    }

    /**
     * @private
     * @param {string} id - Extension ID
     * @param {string} keyword - User input
     * @return {boolean}
     */
    isKeywordMatchName(id, keyword) {
        const cache = this.caches.get(id);
        const chars = keyword
            .toLowerCase()
            .replace(/\s+/, "")
            .split("");
        if (!Array.isArray(cache.tokens)) {
            return false;
        }
        const pointers = { target: 0, source: 0 };
        const contents = { target: "", source: "" };
        for (const token of cache.tokens) {
            contents.target += token.target.toLowerCase();
            contents.source += token.source.toLowerCase();
        }
        for (const char of chars) {
            if (pointers.target !== -1) {
                pointers.target = contents.target.indexOf(char, pointers.target);
            }
            if (pointers.source !== -1) {
                pointers.source = contents.source.indexOf(char, pointers.source);
            }
            if (pointers.target === -1 && pointers.source === -1) {
                return false;
            }
        }
        return true;
    }
}
