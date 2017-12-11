/**
 * 右键菜单：获取更多扩展程序
 */
chrome.contextMenus.create({
    title: chrome.i18n.getMessage("get_more_extensions"),
    contexts: ["browser_action"],
    onclick: () => {
        chrome.tabs.create({
            url: "https://chrome.google.com/webstore/category/extensions",
        });
    },
});
