{

    const ExtensionManager = class {

        constructor() {
            this.impurity = {
                id: chrome.runtime.id,
                type: "theme",
            };
            this.domNodes = {
                h1: document.createElement("h1"),
                ul: document.createElement("ul"),
                controller: document.getElementById("controller"),
            };
            this.allExtensionInfoMap = new WeakMap();
            this.disabledExtensionIdSet = new Set();
            this.extensionIdStorageKey = "disabled_extension_id";
        }

        /** @public */
        decorator() {
            this.readFromStorage();
            this.renderAllExtension();
            this.addGlobalListener();
            return this;
        }

        /** @private */
        readFromStorage() {
            const data = localStorage.getItem(this.extensionIdStorageKey);
            const list = data ? data.split(",") : [];
            list.forEach(id => this.disabledExtensionIdSet.add(id));
        }

        /** @private */
        writeToStorage() {
            localStorage.setItem(this.extensionIdStorageKey, Array.from(this.disabledExtensionIdSet).join(","));
        }

        /** @private */
        renderAllExtension() {
            chrome.management.getAll(list => {
                const fragment = document.createDocumentFragment();

                list.sort((prev, next) => {
                    return prev.name.localeCompare(next.name, "en-US");
                }).forEach(item => {
                    if (item.id !== this.impurity.id && item.type !== this.impurity.type) {
                        const li = document.createElement("li");
                        const img = document.createElement("img");
                        const span = document.createElement("span");

                        span.textContent = item.name;
                        img.alt = item.name;
                        img.src = item.icons ? item.icons[0].url : `chrome://extension-icon/${item.id}/32/0`;
                        li.title = chrome.i18n.getMessage(item.enabled ? "disable_item" : "enable_item");
                        li.dataset.enabled = item.enabled;
                        li.append(img, span);
                        fragment.append(li);

                        this.allExtensionInfoMap.set(li, item);
                    }
                });

                this.domNodes.h1.textContent = chrome.i18n.getMessage(this.disabledExtensionIdSet.size ? "one_key_restore" : "one_key_disable");
                this.domNodes.ul.textContent = this.domNodes.controller.textContent = "";
                this.domNodes.ul.append(fragment);
                this.domNodes.controller.append(this.domNodes.h1, this.domNodes.ul);
            });
        }

        /** @private */
        addGlobalListener() {
            this.domNodes.h1.addEventListener("click", e => {
                if (this.disabledExtensionIdSet.size) {
                    this.restoreDisabledExtension();
                } else {
                    this.disableAllExtension();
                }
            });

            this.domNodes.ul.addEventListener("click", e => {
                const li = e.target.closest("li");
                if (this.allExtensionInfoMap.has(li)) {
                    const item = this.allExtensionInfoMap.get(li);
                    chrome.management.get(item.id, item => chrome.management.setEnabled(item.id, !item.enabled));
                }
            });

            chrome.management.onEnabled.addListener(item => this.transformExtensionState(item, true));
            chrome.management.onDisabled.addListener(item => this.transformExtensionState(item, false));
            chrome.management.onInstalled.addListener(item => this.renderAllExtension());
            chrome.management.onUninstalled.addListener(item => this.renderAllExtension());
            document.addEventListener("contextmenu", e => e.preventDefault());
        }

        /** @private */
        transformExtensionState(item, enabled) {
            for (const li of this.domNodes.ul.children) {
                if (this.allExtensionInfoMap.has(li)) {
                    if (this.allExtensionInfoMap.get(li).id === item.id) {
                        li.title = chrome.i18n.getMessage(enabled ? "disable_item" : "enable_item");
                        li.dataset.enabled = enabled;
                        break;
                    }
                }
            }
        }

        /** @private */
        disableAllExtension() {
            chrome.management.getAll(list => {
                const filtered = list.filter(item => item.id !== this.impurity.id && item.type !== this.impurity.type && item.enabled);
                const tailId = Boolean(filtered.length) && filtered[filtered.length - 1].id;

                while (filtered.length) {
                    const item = filtered.shift();
                    chrome.management.setEnabled(item.id, false, () => {
                        this.disabledExtensionIdSet.add(item.id);
                        if (item.id === tailId) {
                            this.writeToStorage();
                            this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_restore");
                        }
                    })
                }
            });
        }

        /** @private */
        restoreDisabledExtension() {
            chrome.management.getAll(list => {
                const disabledRecently = Array.from(this.disabledExtensionIdSet);
                const disabledExisting = new Set(list.map(item => {
                    if (item.id !== this.impurity.id && item.type !== this.impurity.type && !item.enabled) {
                        return item.id;
                    }
                }));

                while (disabledRecently.length) {
                    const id = disabledRecently.shift();
                    disabledExisting.has(id) && chrome.management.setEnabled(id, true);
                }

                this.disabledExtensionIdSet.clear();
                this.writeToStorage();
                this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_disable");
            });
        }

    };

    new ExtensionManager().decorator();

}
