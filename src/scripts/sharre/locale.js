/**
 * @desc 自定义的 i18n
 * @desc selector = "[data-i18n]"
 */
export function locale() {
    const nodes = document.querySelectorAll("[data-i18n]");
    for (const node of nodes) {
        node.textContent = chrome.i18n.getMessage(node.dataset.i18n || "");
    }
}
