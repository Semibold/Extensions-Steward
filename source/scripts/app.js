{
    class Steward {

        constructor() {
            this.recently = [];
            this.localKey = "chrome.recently";
            this.filter = {
                id: chrome.i18n.getMessage("@@extension_id"),
                type: "theme",
            };
            this.domNodes = {
                h1: document.createElement("h1"),
                ul: document.createElement("ul"),
                fragment: document.createDocumentFragment(),
                controller: document.getElementById("controller"),
            };
            this.decorator();
        }

        decorator() {
            this.getArray();
            this.renderer();
            this.addEvent();
        }

        getArray() {
            let recently = JSON.parse(localStorage.getItem(this.localKey));
            Array.isArray(recently) && (this.recently = recently);
        }

        setArray() {
            localStorage.setItem(this.localKey, JSON.stringify(this.recently));
        }

        renderer() {
            chrome.management.getAll(result => {
                result.sort((prev, next) => {
                    return prev.name.localeCompare(next.name, "en-US");
                }).forEach(item => {
                    if (item.id !== this.filter.id && item.type !== this.filter.type) {
                        let li = document.createElement("li");
                        let img = document.createElement("img");
                        let span = document.createElement("span");

                        span.textContent = item.name;
                        img.alt = item.name;
                        img.src = item.icons ? item.icons[0].url : `chrome://extension-icon/${item.id}/32/0`;
                        li.title = chrome.i18n.getMessage(item.enabled ? "disable_item" : "enable_item");
                        li.dataset.id = img.dataset.id = span.dataset.id = item.id;
                        li.dataset.enabled = item.enabled;
                        li.appendChild(img);
                        li.appendChild(span);
                        this.domNodes.fragment.appendChild(li);
                    }
                });

                this.domNodes.h1.textContent = chrome.i18n.getMessage(this.recently.length ? "one_key_restore" : "one_key_disable");
                this.domNodes.ul.textContent = this.domNodes.controller.textContent = "";
                this.domNodes.ul.appendChild(this.domNodes.fragment);
                this.domNodes.controller.appendChild(this.domNodes.h1);
                this.domNodes.controller.appendChild(this.domNodes.ul);
            });
        }

        addEvent() {
            let flushItem = (item, enabled) => {
                let li = document.querySelector(`li[data-id="${item.id}"]`);

                if (li) {
                    li.title = chrome.i18n.getMessage(enabled ? "disable_item" : "enable_item");
                    li.dataset.enabled = enabled;
                }
            };

            this.domNodes.h1.addEventListener("click", () => {
                this.recently.length ? this.lastRestore() : this.disableAll();
            });

            this.domNodes.ul.addEventListener("click", e => {
                if (e.target.dataset.id) {
                    chrome.management.get(e.target.dataset.id, item => {
                        chrome.management.setEnabled(item.id, !item.enabled);
                    });
                }
            });

            chrome.management.onEnabled.addListener(item => flushItem(item, true));
            chrome.management.onDisabled.addListener(item => flushItem(item, false));
            chrome.management.onInstalled.addListener(item => this.renderer());
            chrome.management.onUninstalled.addListener(item => this.renderer());
            document.addEventListener("contextmenu", e => e.preventDefault());
        }

        disableAll() {
            chrome.management.getAll(result => {
                let filterResult = result.filter(item => item.id !== this.filter.id && item.type !== this.filter.type && item.enabled);

                while (filterResult.length) {
                    let item = filterResult.shift();

                    chrome.management.setEnabled(item.id, false, () => {
                        this.recently.push(item.id);

                        if (!filterResult.length) {
                            this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_restore");
                            this.setArray();
                        }
                    });
                }
            });
        }

        lastRestore() {
            chrome.management.getAll(result => {
                let filterResult = {};

                result.forEach(item => {
                    if (item.id !== this.filter.id && item.type !== this.filter.type && !item.enabled) {
                        filterResult[item.id] = true;
                    }
                });

                while (this.recently.length) {
                    let id = this.recently.shift();

                    if (filterResult[id]) {
                        chrome.management.setEnabled(id, true, () => {
                            if (!this.recently.length) {
                                this.domNodes.h1.textContent = chrome.i18n.getMessage("one_key_disable");
                                this.setArray();
                            }
                        });
                    }
                }
            });
        }

    }

    new Steward();
}
