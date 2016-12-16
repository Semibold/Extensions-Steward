class Steward {

    constructor() {
        this.disabled = false;
        this.recently = [];
        this.chromeDisabled = "chrome.disabled";
        this.chromeRecently = "chrome.recently";
        this.h1 = document.createElement("h1");
        this.ul = document.createElement("ul");
        this.controller = document.getElementById("controller");
        this.selfID = chrome.i18n.getMessage("@@extension_id");
        this.decorator();
    }

    decorator() {
        this.getLocal();
        this.renderer();
        this.addEvent();
    }

    getLocal() {
        let disabled = JSON.parse(localStorage.getItem(this.chromeDisabled));
        let recently = JSON.parse(localStorage.getItem(this.chromeRecently));

        this.disabled = Boolean(disabled);
        this.recently = Array.isArray(recently) ? recently : [];
    }

    setLocal() {
        localStorage.setItem(this.chromeDisabled, JSON.stringify(this.disabled));
        localStorage.setItem(this.chromeRecently, JSON.stringify(this.recently));
    }

    renderer() {
        chrome.management.getAll(result => {
            let fragment = document.createDocumentFragment();
            let sortedResult = result.slice().sort((prev, next) => prev.name.localeCompare(next.name, "en-US"));

            sortedResult.forEach(item => {
                if (item.id !== this.selfID && item.type !== "theme") {
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
                    fragment.appendChild(li);
                }
            });

            this.h1.textContent = chrome.i18n.getMessage(this.disabled ? "OneKeyRestore" : "OneKeyDisable");
            this.ul.textContent = this.controller.textContent = "";
            this.ul.appendChild(fragment);
            this.controller.appendChild(this.h1);
            this.controller.appendChild(this.ul);
        });
    }

    addEvent() {
        this.h1.addEventListener("click", () => {
            this.disabled ? this.lastRestore() : this.disableAll();
        });

        this.ul.addEventListener("click", e => {
            if (e.target.dataset.id) {
                chrome.management.get(e.target.dataset.id, item => {
                    chrome.management.setEnabled(item.id, !item.enabled);
                });
            }
        });

        chrome.management.onEnabled.addListener(item => Steward.changeItemStatus(item, true));
        chrome.management.onDisabled.addListener(item => Steward.changeItemStatus(item, false));
        chrome.management.onInstalled.addListener(item => this.renderer());
        chrome.management.onUninstalled.addListener(item => this.renderer());
    }

    disableAll() {
        chrome.management.getAll(result => {
            let sortedResult = result.filter(item => {
                if (item.id !== this.selfID && item.type !== "theme" && item.enabled) {
                    return item;
                }
            });
            let finalItem = sortedResult[sortedResult.length - 1];

            sortedResult.forEach(item => {
                chrome.management.setEnabled(item.id, false, () => {
                    this.recently.push(item.id);

                    if (item.id === finalItem.id) {
                        this.disabled = true;
                        this.setLocal();
                    }
                });
            });
        });
    }

    lastRestore() {
        this.recently.forEach((id, index) => {
            chrome.management.get(id, item => {
                chrome.management.setEnabled(item.id, true, () => {
                    if (this.recently.length - 1 === index) {
                        this.disabled = false;
                        this.recently.length = 0;
                        this.setLocal();
                    }
                });
            });
        });
    }

    static changeItemStatus(item, enabled) {
        let li = document.querySelector(`li[data-id="${item.id}"]`);

        if (li) {
            li.title = chrome.i18n.getMessage(enabled ? "DisableItem" : "EnableItem");
            li.dataset.enabled = enabled;
        }
    }

}

new Steward();
