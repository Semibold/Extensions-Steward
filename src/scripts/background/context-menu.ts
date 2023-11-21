/**
 * @desc 问题反馈
 */
chrome.contextMenus.create({
    id: "menu_feedback",
    title: chrome.i18n.getMessage("menu_feedback"),
    contexts: ["action"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "menu_feedback") {
        chrome.tabs.create({ url: chrome.i18n.getMessage("project_issue") });
    }
});
