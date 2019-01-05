/**
 * @desc 问题反馈
 */
chrome.contextMenus.create({
    title: chrome.i18n.getMessage("menu_feedback"),
    contexts: ["browser_action"],
    onclick: (info, tab) => {
        chrome.tabs.create({ url: chrome.i18n.getMessage("project_issue") });
    },
});
