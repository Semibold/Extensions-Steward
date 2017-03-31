{

    class Steward {

        constructor() {
            this.disabled = new Set();
            this.keyTable = {disabled: "chrome.recently_disabled"};
            this.impurity = {id: chrome.runtime.id, type: "theme"};
            this.domNodes = {
                h1: document.createElement("h1"),
                ul: document.createElement("ul"),
                fragment: document.createDocumentFragment(),
                controller: document.getElementById("controller"),
            };
            this.decorator();
        }

        decorator() {
            this.loadStart();
            this.renderItems();
            this.addListener();
        }

        loadStart() {
            let buffer = JSON.parse(localStorage.getItem(this.keyTable.disabled));
            Array.isArray(buffer) && buffer.forEach(id => typeof id === "string" && this.disabled.add(id));
        }

        renderItems() {
            chrome.management.getAll(raw => {
                raw.sort((prev, next) => {
                    return prev.name.localeCompare(next.name, "en-US");
                }).forEach(item => {
                    if (item.id !== this.impurity.id && item.type !== this.impurity.type) {
                        let li = document.createElement("li");
                        let img = document.createElement("img");
                        let span = document.createElement("span");

                        span.textContent = item.name;
                        img.alt = item.name;
                        img.src = item.icons ? item.icons[0].url : `chrome://extension-icon/${item.id}/32/0`;
                        li.title = chrome.i18n.getMessage(item.enabled ? "disable_item" : "enable_item");
                        li.dataset.id = item.id;
                        li.dataset.enabled = item.enabled;
                        li.appendChild(img);
                        li.appendChild(span);
                        this.domNodes.fragment.appendChild(li);
                    }
                });

                this.domNodes.h1.textContent = chrome.i18n.getMessage(this.disabled.size ? "one_key_restore" : "one_key_disable");
                this.domNodes.ul.textContent = this.domNodes.controller.textContent = "";
                this.domNodes.ul.appendChild(this.domNodes.fragment);
                this.domNodes.controller.appendChild(this.domNodes.h1);
                this.domNodes.controller.appendChild(this.domNodes.ul);
            });
        }

        addListener() {
            this.domNodes.h1.addEventListener("click", e => this.disabled.size ? this.restoreItems() : this.disableItems());
            this.domNodes.ul.addEventListener("click", e => {
                let li = e.target.closest("li");
                li && chrome.management.get(li.dataset.id, item => chrome.management.setEnabled(item.id, !item.enabled));
            });

            chrome.management.onEnabled.addListener(item => Steward.transformItem(item, true));
            chrome.management.onDisabled.addListener(item => Steward.transformItem(item, false));
            chrome.management.onInstalled.addListener(item => this.renderItems());
            chrome.management.onUninstalled.addListener(item => this.renderItems());
            document.addEventListener("contextmenu", e => e.preventDefault());
        }

        disableItems() {
            chrome.management.getAll(raw => {
                let result = raw.filter(item => item.id !== this.impurity.id && item.type !== this.impurity.type && item.enabled);
                while (result.length) {
                    let item = result.shift();
                    chrome.management.setEnabled(item.id, false, n => {
                        this.disabled.add(item.id);
                        if (!result.length) {
                            this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_restore");
                            this.setCachePool();
                        }
                    });
                }
            });
        }

        restoreItems() {
            chrome.management.getAll(raw => {
                let disabledExisting = new Set(raw.map(item => {
                    if (item.id !== this.impurity.id && item.type !== this.impurity.type && !item.enabled) {
                        return item.id;
                    }
                }));
                let disabledRecently = [...disabledExisting].filter(id => this.disabled.has(id));

                while (disabledRecently.length) {
                    chrome.management.setEnabled(disabledRecently.shift(), true, n => {
                        if (!disabledRecently.length) {
                            this.disabled.clear();
                            this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_disable");
                            this.setCachePool();
                        }
                    });
                }
            });
        }

        setCachePool() {
            localStorage.setItem(this.keyTable.disabled, Array.from(this.disabled));
        }

        static transformItem(item, enabled) {
            let li = document.querySelector(`li[data-id="${item.id}"]`);
            if (li) {
                li.title = chrome.i18n.getMessage(enabled ? "disable_item" : "enable_item");
                li.dataset.enabled = enabled;
            }
        }

    }

    new Steward();

}
