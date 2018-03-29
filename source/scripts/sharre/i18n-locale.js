/**
 * @desc 自定义的 i18n
 */
export const i18nLocale = (selector = "[data-i18n]") => {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    node.textContent = chrome.i18n.getMessage(node.dataset.i18n);
  }
};