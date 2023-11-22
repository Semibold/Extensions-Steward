import {
    K_DISABLED_EXTENSION_ID,
    K_EXTENSION_TYPE_CHECKED,
    K_KEEP_LAST_SEARCH_STATUS,
    K_LAST_SEARCH_USER_INPUT,
    PConfig,
} from "./sharre/constant.js";

class ExtensionManager {
    excludeTypeSet: Set<string>;
    enableLastSearchStatus: boolean;
    maxIconSize: number;
    renderTimer: number;
    maxInputLength: number;
    lastSearchUserInput: string;
    diagramWeakMap: WeakMap<HTMLElement, string>;
    disabledExtensionIdSet: Set<string>;
    fragment: DocumentFragment;
    container: HTMLElement;

    /**
     * @param {Set<string>} excludeTypeSet
     * @param {boolean} enableLastSearchStatus
     */
    constructor(excludeTypeSet: Set<string>, enableLastSearchStatus: boolean) {
        this.excludeTypeSet = excludeTypeSet;
        this.enableLastSearchStatus = enableLastSearchStatus;
        this.maxIconSize = 64;
        this.renderTimer = -1;
        this.maxInputLength = 64;
        this.lastSearchUserInput = "";
        this.diagramWeakMap = new WeakMap();
        this.disabledExtensionIdSet = new Set();
        this.fragment = document.createDocumentFragment();
        this.container = document.getElementById("app");
        this.init();
    }

    async init() {
        this.getLastSearchUserInput();
        this.getDisabledExtensionIds();
        await this.renderFrameContent();
        this.registerAutoFocusEvent();
        this.registerUserInputEvent();
        this.registerOtherEvents();
    }

    getLastSearchUserInput() {
        if (this.enableLastSearchStatus) {
            const data = localStorage.getItem(K_LAST_SEARCH_USER_INPUT);
            if (typeof data === "string") {
                this.lastSearchUserInput = data;
            }
        }
    }

    setLastSearchUserInput() {
        localStorage.setItem(K_LAST_SEARCH_USER_INPUT, this.lastSearchUserInput);
    }

    getDisabledExtensionIds() {
        const data = localStorage.getItem(K_DISABLED_EXTENSION_ID);
        const list = data ? data.split(",") : [];
        list.forEach((id) => this.disabledExtensionIdSet.add(id));
    }

    setDisabledExtensionIds() {
        localStorage.setItem(K_DISABLED_EXTENSION_ID, Array.from(this.disabledExtensionIdSet).join(","));
    }

    resetContainerContents() {
        this.container.textContent = "";
    }

    /**
     * @param {string} [input]
     * @return {chrome.management.ExtensionInfo[]}
     */
    async getTargetExtensionInfos(input = ""): Promise<chrome.management.ExtensionInfo[]> {
        return Array.from(await this.fetchKeywordSearch(input)).filter(
            (item) => !(item.id === chrome.runtime.id || this.excludeTypeSet.has(item.type)),
        );
    }

    /**
     * Fetches keyword search results.
     *
     * @param {string} input - The keyword to search for.
     * @return {Promise<chrome.management.ExtensionInfo[]>} A promise that resolves to an array of ExtensionInfo objects.
     */
    async fetchKeywordSearch(input: string): Promise<chrome.management.ExtensionInfo[]> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                {
                    type: "keywordSearch",
                    input: input,
                },
                (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                },
            );
        });
    }

    async renderFrameContent() {
        const em = document.createElement("em");
        const h1 = document.createElement("h1");
        const ul = document.createElement("ul");
        const list = await this.getTargetExtensionInfos(this.lastSearchUserInput);
        list.sort((prev, next) => prev.name.localeCompare(next.name, "en-US")).forEach((item) =>
            this.renderItemContent(ul, item),
        );
        this.renderLastSearchUserInput(em);
        this.renderFrameState(h1);
        this.fragment.append(em, h1, ul);
        this.resetContainerContents();
        this.container.append(this.fragment);
    }

    /**
     * @param {HTMLElement} h1
     */
    renderFrameState(h1: HTMLElement) {
        h1.tabIndex = this.lastSearchUserInput.length ? -1 : 0;
        h1.textContent = chrome.i18n.getMessage(
            this.disabledExtensionIdSet.size ? "one_key_restore" : "one_key_disable",
        );
    }

    /**
     * @param {HTMLElement} [em]
     */
    renderLastSearchUserInput(em?: HTMLElement) {
        const node = em || this.container.querySelector("em");
        if (em) node.textContent = this.lastSearchUserInput;
    }

    /**
     * @param {HTMLElement} ul
     * @param {chrome.management.ExtensionInfo} item
     */
    renderItemContent(ul: HTMLUListElement, item: chrome.management.ExtensionInfo) {
        const li = document.createElement("li");
        const img = document.createElement("img");
        const span = document.createElement("span");
        li.tabIndex = 0;
        li.append(img, span);
        ul.append(li);
        this.renderItemState(li, item);
        this.diagramWeakMap.set(li, item.id);
    }

    /**
     * @param {HTMLElement} li
     * @param {chrome.management.ExtensionInfo} item
     */
    renderItemState(li: HTMLElement, item: chrome.management.ExtensionInfo) {
        const img = li.querySelector("img");
        const span = li.querySelector("span");
        const iconInfo = { size: 32, url: `chrome://extension-icon/${item.id}/32/0` };
        if (item.icons && item.icons.length) {
            const firstIcon = item.icons[0];
            const restIcons = item.icons.slice(1);
            iconInfo.size = firstIcon.size;
            iconInfo.url = firstIcon.url;
            for (const icon of restIcons) {
                if (icon.size > iconInfo.size && icon.size < this.maxIconSize) {
                    iconInfo.size = icon.size;
                    iconInfo.url = icon.url;
                }
            }
        }
        span.textContent = img.alt = item.shortName || item.name;
        img.src = `${iconInfo.url}${item.enabled ? "" : "?grayscale=true"}`;
        li.title = chrome.i18n.getMessage(item.enabled ? "disable_extension" : "enable_extension");
        li.dataset.enabled = item.enabled.toString();
    }

    registerAutoFocusEvent() {
        this.container.addEventListener("mouseover", (e) => {
            const node = e.target as HTMLElement;
            if (!node) return;
            const s = node.closest("h1") || node.closest("li");
            if (s && s !== document.activeElement) {
                s.focus();
            }
        });
    }

    registerUserInputEvent() {
        // prettier-ignore
        const validCharSet = new Set([
            'Escape', 'Backspace', '@',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        ]);
        document.addEventListener("keydown", (e) => {
            if (validCharSet.has(e.key)) {
                const startLength = this.lastSearchUserInput.length;
                switch (e.key) {
                    case "Escape":
                        if (this.lastSearchUserInput) {
                            e.preventDefault();
                            this.lastSearchUserInput = "";
                        }
                        break;
                    case "Backspace":
                        if (this.lastSearchUserInput) {
                            e.preventDefault();
                            this.lastSearchUserInput = this.lastSearchUserInput.slice(0, -1);
                        }
                        break;
                    default:
                        if (this.lastSearchUserInput.length <= this.maxInputLength) {
                            e.preventDefault();
                            this.lastSearchUserInput += e.key;
                        }
                        break;
                }
                if (startLength !== this.lastSearchUserInput.length) {
                    this.renderLastSearchUserInput();
                    this.continuousFilterFrameContent();
                }
            }
        });
    }

    continuousFilterFrameContent() {
        clearTimeout(this.renderTimer);
        this.renderTimer = window.setTimeout(() => {
            this.renderFrameContent();
            this.setLastSearchUserInput();
        }, 100);
    }

    registerOtherEvents() {
        this.container.addEventListener("click", (e) => {
            const node = e.target as HTMLElement;
            if (!node) return;
            if (node.closest("h1")) {
                this.disabledExtensionIdSet.size ? this.oneKeyRestore() : this.oneKeyDisable();
            } else {
                const li = node.closest("li");
                if (this.diagramWeakMap.has(li)) {
                    chrome.management.get(this.diagramWeakMap.get(li), (item) =>
                        chrome.management.setEnabled(item.id, !item.enabled),
                    );
                }
            }
        });
        document.addEventListener("keyup", (e) => {
            const node = e.target as HTMLElement;
            if (!node) return;
            if (e.key === "Enter") {
                const s = node.closest("h1") || node.closest("li");
                if (s) {
                    e.preventDefault();
                    s.click();
                }
            }
        });
        chrome.management.onEnabled.addListener((item) => this.toggleItemState(item));
        chrome.management.onDisabled.addListener((item) => this.toggleItemState(item));
        chrome.management.onInstalled.addListener((item) => this.continuousFilterFrameContent());
        chrome.management.onUninstalled.addListener((id) => this.continuousFilterFrameContent());
    }

    /**
     * Toggles the state of an item.
     */
    toggleItemState(item: chrome.management.ExtensionInfo) {
        for (const li of document.querySelectorAll("li")) {
            if (this.diagramWeakMap.has(li)) {
                if (this.diagramWeakMap.get(li) === item.id) {
                    this.renderItemState(li, item);
                    break;
                }
            }
        }
    }

    /**
     * Asynchronously disables all enabled extensions.
     */
    async oneKeyDisable() {
        const list = await this.getTargetExtensionInfos();
        const filtered = list.filter((item) => item.enabled);
        const tailId = Boolean(filtered.length) && filtered[filtered.length - 1].id;
        while (filtered.length) {
            const item = filtered.shift();
            chrome.management.setEnabled(item.id, false, () => {
                this.disabledExtensionIdSet.add(item.id);
                if (item.id === tailId) {
                    const h1 = this.container.querySelector("h1");
                    this.setDisabledExtensionIds();
                    if (h1) {
                        h1.textContent = chrome.i18n.getMessage("one_key_restore");
                    }
                }
            });
        }
    }

    /**
     * Asynchronously restores the target extension by enabling previously disabled extensions.
     */
    async oneKeyRestore() {
        const list = await this.getTargetExtensionInfos();
        const disabledRecently = Array.from(this.disabledExtensionIdSet);
        const disabledExisting = new Set(
            list.map((item) => {
                if (!item.enabled) {
                    return item.id;
                }
            }),
        );
        const h1 = this.container.querySelector("h1");
        while (disabledRecently.length) {
            const id = disabledRecently.shift();
            disabledExisting.has(id) && chrome.management.setEnabled(id, true);
        }
        this.disabledExtensionIdSet.clear();
        this.setDisabledExtensionIds();
        if (h1) {
            h1.textContent = chrome.i18n.getMessage("one_key_disable");
        }
    }
}

chrome.storage.sync.get([K_EXTENSION_TYPE_CHECKED, K_KEEP_LAST_SEARCH_STATUS], (items) => {
    const excludeTypeSet: Set<string> = new Set();
    const eTypeChecked = Object.assign(PConfig.eTypeChecked, items[K_EXTENSION_TYPE_CHECKED]);
    const enableLastSearchStatus = Boolean(
        items[K_KEEP_LAST_SEARCH_STATUS] == null
            ? PConfig.defaultOptions.keepLastSearchStatus
            : items[K_KEEP_LAST_SEARCH_STATUS],
    );
    for (const [type, checked] of Object.entries(eTypeChecked)) {
        if (!checked) excludeTypeSet.add(type);
    }
    new ExtensionManager(excludeTypeSet, enableLastSearchStatus);
});
