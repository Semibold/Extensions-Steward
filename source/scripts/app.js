class Steward {

    constructor() {
        this.state = {
            disabled: false,
            recently: [],
        };
        this.local = {
            disabled: "chrome.disabled",
            recently: "chrome.recently",
        };
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
        this.getLocal();
        this.renderer();
        this.addEvent();
    }

    getLocal() {
        let disabled = JSON.parse(localStorage.getItem(this.local.disabled));
        let recently = JSON.parse(localStorage.getItem(this.local.recently));

        this.state.disabled = Boolean(disabled);
        this.state.recently = Array.isArray(recently) ? recently : [];
    }

    setLocal() {
        localStorage.setItem(this.local.disabled, JSON.stringify(this.state.disabled));
        localStorage.setItem(this.local.recently, JSON.stringify(this.state.recently));
    }

    renderer() {
        chrome.management.getAll(result => {
            result.sort((prev, next) => {
                return prev.name.localeCompare(next.name, "en-US");
            }).forEach(item => {
                console.log(item.name);
                if (item.id !== this.filter.id && item.type !== this.filter.type) {
                    let li = document.createElement("li");
                    let img = document.createElement("img");
                    let span = document.createElement("span");

                    span.textContent = item.name;
                    img.alt = item.name;
                    img.src = item.icons ? item.icons[0].url : `chrome://extension-icon/${item.id}/32/0`;
                    li.title = chrome.i18n.getMessage(item.enabled ? "DisableItem" : "EnableItem");
                    li.dataset.id = img.dataset.id = span.dataset.id = item.id;
                    li.dataset.enabled = item.enabled;
                    li.appendChild(img);
                    li.appendChild(span);
                    this.domNodes.fragment.appendChild(li);
                }
            });

            this.domNodes.h1.textContent = chrome.i18n.getMessage(this.state.disabled ? "OneKeyRestore" : "OneKeyDisable");
            this.domNodes.ul.textContent = this.domNodes.controller.textContent = "";
            this.domNodes.ul.appendChild(this.domNodes.fragment);
            this.domNodes.controller.appendChild(this.domNodes.h1);
            this.domNodes.controller.appendChild(this.domNodes.ul);
        });
    }

    addEvent() {
        let changeItemStatus = (item, enabled) => {
            let li = document.querySelector(`li[data-id="${item.id}"]`);

            if (li) {
                li.title = chrome.i18n.getMessage(enabled ? "DisableItem" : "EnableItem");
                li.dataset.enabled = enabled;
            }
        };

        this.domNodes.h1.addEventListener("click", () => {
            this.state.disabled ? this.lastRestore() : this.disableAll();
        });

        this.domNodes.ul.addEventListener("click", e => {
            if (e.target.dataset.id) {
                chrome.management.get(e.target.dataset.id, item => {
                    chrome.management.setEnabled(item.id, !item.enabled);
                });
            }
        });

        chrome.management.onEnabled.addListener(item => changeItemStatus(item, true));
        chrome.management.onDisabled.addListener(item => changeItemStatus(item, false));
        chrome.management.onInstalled.addListener(item => this.renderer());
        chrome.management.onUninstalled.addListener(item => this.renderer());
        window.addEventListener("contextmenu", e => e.preventDefault());
    }

    disableAll() {
        chrome.management.getAll(result => {
            result.forEach(item => {
                if (item.id !== this.filter.id && item.type !== this.filter.type && item.enabled) {
                    chrome.management.setEnabled(item.id, false, () => {
                        this.state.recently.push(item.id);
                        this.setLocal();
                    });
                }
            });

            this.domNodes.h1.textContent = chrome.i18n.getMessage("OneKeyRestore");
            this.state.disabled = true;
        });
    }

    lastRestore() {
        while (this.state.recently.length) {
            chrome.management.setEnabled(this.state.recently.shift(), true, () => {
                this.setLocal();
            });
        }

        this.domNodes.h1.textContent = chrome.i18n.getMessage("OneKeyDisable");
        this.state.disabled = false;
    }

}

new Steward();
