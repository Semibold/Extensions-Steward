import {
    ChromeExtensionType,
    K_AUTO_DISPLAY_CHANGELOG,
    K_DISABLED_EXTENSION_ID,
    K_EXTENSION_TYPE_CHECKED,
    K_KEEP_LAST_SEARCH_STATUS,
    K_LAST_SEARCH_USER_INPUT,
    PConfig,
} from "./constant.js";

interface IChromeStorageLocalInfo {
    [K_DISABLED_EXTENSION_ID]: string;
    [K_LAST_SEARCH_USER_INPUT]: string;
}

interface IChromeStorageSyncInfo {
    [K_EXTENSION_TYPE_CHECKED]: Record<ChromeExtensionType, boolean>;
    [K_AUTO_DISPLAY_CHANGELOG]: boolean;
    [K_KEEP_LAST_SEARCH_STATUS]: boolean;
}

const SADCache = new Map<chrome.storage.AreaName, unknown>();

async function initializeStorageArea<T extends object>(
    areaName: chrome.storage.AreaName,
    keys?: Required<T>,
): Promise<T> {
    const promise = chrome.storage[areaName].get(keys) as Promise<T>;
    promise.then((data) => SADCache.set(areaName, data));
    return promise;
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    const data: Record<string, unknown> = SADCache.get(areaName) || Object.create(null);

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        data[key] = newValue;
    }

    SADCache.set(areaName, data);
});

class ChromeStorageArea<T extends object> {
    readonly __initPromise: Promise<T>;

    get promise(): Promise<T> {
        if (SADCache.has(this.areaName)) {
            return Promise.resolve(SADCache.get(this.areaName)) as Promise<T>;
        } else {
            return this.__initPromise;
        }
    }

    /**
     * @desc 要么提供全部的 keys 参数, 要么不提供。
     */
    constructor(
        readonly areaName: chrome.storage.AreaName,
        keys?: Required<T>,
    ) {
        this.__initPromise = initializeStorageArea<T>(this.areaName, keys);
    }

    get(): T {
        return (SADCache.get(this.areaName) || Object.create(null)) as T;
    }

    set(items: Partial<T>): Promise<void> {
        return chrome.storage[this.areaName].set(items);
    }
}

export const chromeStorageLocal = new ChromeStorageArea<IChromeStorageLocalInfo>("local");

export const chromeStorageSync = new ChromeStorageArea<IChromeStorageSyncInfo>("sync", {
    [K_EXTENSION_TYPE_CHECKED]: null,
    [K_AUTO_DISPLAY_CHANGELOG]: PConfig.defaultOptions.autoDisplayChangelog,
    [K_KEEP_LAST_SEARCH_STATUS]: PConfig.defaultOptions.keepLastSearchStatus,
});
