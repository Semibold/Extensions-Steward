/**
 * @desc chrome.StorageArea
 */
export const K_EXTENSION_TYPE_CHECKED = "extension_type_checked"; // 用于存储扩展类型的状态
export const K_AUTO_DISPLAY_CHANGELOG = "auto_display_changelog";
export const K_KEEP_LAST_SEARCH_STATUS = "keep_last_search_status";

/**
 * @desc localStorage/sessionStorage
 */
export const K_DISABLED_EXTENSION_ID = "disabled_extension_id"; // 用于存储被批量方式禁用的扩展ID
export const K_LAST_SEARCH_USER_INPUT = "last_search_user_input";

/**
 * @static
 */
export class PConfig {
    /**
     * @enum
     * @see https://developer.chrome.com/extensions/management#type-ExtensionType
     */
    static get eTypeChecked() {
        return {
            extension: true,
            hosted_app: false,
            packaged_app: false,
            legacy_packaged_app: false,
            theme: false,
        };
    }

    /**
     * @enum
     * @see https://developer.chrome.com/extensions/management#type-ExtensionType
     */
    static get eTypeDisabled() {
        return {
            extension: true,
            hosted_app: false,
            packaged_app: false,
            legacy_packaged_app: false,
            theme: false,
        };
    }

    /**
     * @desc 默认的选项配置
     */
    static get defaultOptions() {
        return {
            autoDisplayChangelog: true,
            keepLastSearchStatus: false,
        };
    }
}
