import { SharreM } from "./sharre/alphabet.js";
import { K_DISABLED_EXTENSION_ID, K_LAST_SEARCH_USER_INPUT, PConfig } from "./sharre/constant.js";

class ExtensionManager {
    /**
     * @param {Set<string>} excludeTypeSet
     * @param {boolean} enableLastSearchStatus
     */
    constructor(excludeTypeSet, enableLastSearchStatus) {
        this.excludeTypeSet = excludeTypeSet;
        this.enableLastSearchStatus = enableLastSearchStatus;
        this.maxIconSize = 64;
        this.renderTimer = -1;
        this.lastSearchUserInput = "";
        this.diagramWeakMap = new WeakMap();
        this.disabledExtensionIdSet = new Set();
        this.fragemnt = document.createDocumentFragment();
        this.container = document.getElementById("app");
        this.init();
    }

    init() {
        this.getLastSearchUserInput();
        this.getDisabledExtensionIds();
        this.renderFrameContent();
        this.registerUserInputEvent();
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
        list.forEach(id => this.disabledExtensionIdSet.add(id));
    }

    setDisabledExtensionIds() {
        localStorage.setItem(K_DISABLED_EXTENSION_ID, Array.from(this.disabledExtensionIdSet).join(","));
    }

    resetContainerContents() {
        this.container.textContent = "";
    }

    renderFrameContent() {
        const em = document.createElement("em");
        const h1 = document.createElement("h1");
        const ul = document.createElement("ul");
        Array.from(SharreM.keywordSearch.search(this.lastSearchUserInput))
            .sort((prev, next) => prev.name.localeCompare(next.name, "en-US"))
            .forEach(item => {
                if (item.id === chrome.runtime.id) return;
                if (this.excludeTypeSet.has(item.type)) return;
                this.renderItemContent(ul, item);
            });
        this.renderLastSearchUserInput(em);
        this.renderFrameState(h1);
        this.fragemnt.append(em, h1, ul);
        this.resetContainerContents();
        this.container.append(this.fragemnt);
    }

    /**
     * @param {HTMLElement} h1
     */
    renderFrameState(h1) {
        h1.tabIndex = 0;
        h1.textContent = chrome.i18n.getMessage(
            this.disabledExtensionIdSet.size ? "one_key_restore" : "one_key_disable",
        );
    }

    /**
     * @param {HTMLElement} [em]
     */
    renderLastSearchUserInput(em) {
        const node = em || this.container.querySelector("em");
        node.textContent = this.lastSearchUserInput;
    }

    /**
     * @param {HTMLElement} ul
     * @param {chrome.management.ExtensionInfo} item
     */
    renderItemContent(ul, item) {
        const li = document.createElement("li");
        const img = document.createElement("img");
        const span = document.createElement("span");
        li.tabIndex = 0;
        li.append(img, span);
        ul.append(li);
        this.diagramWeakMap.set(li, item);
        this.renderItemState(li);
    }

    /**
     * @param {HTMLElement} li
     */
    renderItemState(li) {
        if (!this.diagramWeakMap.has(li)) return;
        const item = this.diagramWeakMap.get(li);
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
        li.dataset.enabled = item.enabled;
    }

    registerUserInputEvent() {
        // prettier-ignore
        const validCharSet = new Set([
            'Escape', 'Backspace', '@',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        ]);
        document.addEventListener("keydown", e => {
            if (validCharSet.has(e.key)) {
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
                        e.preventDefault();
                        this.lastSearchUserInput += e.key;
                        break;
                }
                this.renderLastSearchUserInput();
                this.continuousFilterFrameContent();
            }
        });
    }

    continuousFilterFrameContent() {
        clearTimeout(this.renderTimer);
        this.renderTimer = setTimeout(() => {
            this.renderFrameContent();
        }, 100);
    }

    // registerEvents() {
    // chrome.management.onEnabled.addListener(item => this.toggleItemState(item));
    // chrome.management.onDisabled.addListener(item => this.toggleItemState(item));
    // chrome.management.onInstalled.addListener(item => this.renderFrameContent());
    // chrome.management.onUninstalled.addListener(id => this.renderFrameContent());
    // document.addEventListener("keyup", e => {
    //     if (e.key === "Enter") {
    //         e.preventDefault();
    //         e.target.click();
    //     }
    // });
    // document.addEventListener("keydown", e => {
    //     switch (e.key) {
    //         case "Tab":
    //             e.preventDefault();
    //             this.focusClickableElement(e.shiftKey ? -1 : 1);
    //             break;
    //         case "ArrowUp":
    //             e.preventDefault();
    //             this.focusClickableElement(-1);
    //             break;
    //         case "ArrowDown":
    //             e.preventDefault();
    //             this.focusClickableElement(1);
    //             break;
    //     }
    // });
    // this.container.addEventListener("click", e => {
    //     const node = e.target;
    //     if (!node) return;
    //     if (node.closest('h1')) {
    //         this.disabledExtensionIdSet.size ? this.oneKeyRestore() : this.oneKeyDisable();
    //     } else {
    //         const li = node.closest('li');
    //         if (this.diagramWeakMap.has(li)) {
    //             chrome.management.get(this.diagramWeakMap.get(li).id, item => chrome.management.setEnabled(item.id, !item.enabled));
    //         }
    //     }
    // });
    // }

    // toggleItemState(item) {
    //     for (const li of document.querySelectorAll('li')) {
    //         if (this.diagramWeakMap.has(li)) {
    //             if (this.diagramWeakMap.get(li).id === item.id) {
    //                 this.renderItemState(li);
    //                 break;
    //             }
    //         }
    //     }
    // }
    //
    // focusClickableElement(offset) {
    //     const clickableElements = [this.nodes.h1].concat(Array.from(this.nodes.ul.children));
    //     const index = clickableElements.findIndex(element => element === document.activeElement);
    //     switch (offset) {
    //         case 1: {
    //             clickableElements[(index + offset) % clickableElements.length].focus();
    //             break;
    //         }
    //         case -1: {
    //             clickableElements[
    //             (Math.max(index, 0) + offset + clickableElements.length) % clickableElements.length
    //                 ].focus();
    //             break;
    //         }
    //     }
    // }
    //
    // oneKeyDisable() {
    //     chrome.management.getAll(list => {
    //         const filtered = list.filter(
    //             item => item.id !== chrome.runtime.id && !this.excludeType.has(item.type) && item.enabled,
    //         );
    //         const tailId = Boolean(filtered.length) && filtered[filtered.length - 1].id;
    //         while (filtered.length) {
    //             const item = filtered.shift();
    //             chrome.management.setEnabled(item.id, false, () => {
    //                 this.eidDisabledSet.add(item.id);
    //                 if (item.id === tailId) {
    //                     this.writeToLocal();
    //                     this.nodes.h1.textContent = chrome.i18n.getMessage("one_key_restore");
    //                 }
    //             });
    //         }
    //     });
    // }
    //
    // oneKeyRestore() {
    //     chrome.management.getAll(list => {
    //         const disabledRecently = Array.from(this.eidDisabledSet);
    //         const disabledExisting = new Set(
    //             list.map(item => {
    //                 if (item.id !== chrome.runtime.id && !this.excludeType.has(item.type) && !item.enabled) {
    //                     return item.id;
    //                 }
    //             }),
    //         );
    //         while (disabledRecently.length) {
    //             const id = disabledRecently.shift();
    //             disabledExisting.has(id) && chrome.management.setEnabled(id, true);
    //         }
    //         this.eidDisabledSet.clear();
    //         this.writeToLocal();
    //         this.nodes.h1.textContent = chrome.i18n.getMessage("one_key_disable");
    //     });
    // }
}

chrome.storage.sync.get([K_DISABLED_EXTENSION_ID, K_LAST_SEARCH_USER_INPUT], items => {
    const excludeTypeSet = new Set();
    const eTypeChecked = Object.assign(PConfig.eTypeChecked, items[K_DISABLED_EXTENSION_ID]);
    const enableLastSearchStatus = Boolean(items[K_LAST_SEARCH_USER_INPUT]);
    for (const [type, checked] of Object.entries(eTypeChecked)) {
        if (!checked) excludeTypeSet.add(type);
    }
    new ExtensionManager(excludeTypeSet, enableLastSearchStatus);
});
