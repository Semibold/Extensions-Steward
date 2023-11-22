/**
 * @desc chrome.StorageArea
 */
export const K_EXTENSION_TYPE_CHECKED = "extension_type_checked"; // 用于存储扩展类型的状态
export const K_AUTO_DISPLAY_CHANGELOG = "auto_display_changelog";
export const K_KEEP_LAST_SEARCH_STATUS = "keep_last_search_status";

/**
 * chrome.StorageArea schema
 */
interface ChromeStorageArea {
    [K_EXTENSION_TYPE_CHECKED]: Record<ChromeExtensionType, boolean>;
    [K_AUTO_DISPLAY_CHANGELOG]: boolean;
    [K_KEEP_LAST_SEARCH_STATUS]: boolean;
}

/**
 * @desc for `popup` page
 * @desc localStorage/sessionStorage
 */
export const K_DISABLED_EXTENSION_ID = "disabled_extension_id"; // 用于存储被批量方式禁用的扩展ID
export const K_LAST_SEARCH_USER_INPUT = "last_search_user_input";

/**
 * localStorage schema
 */
interface WebLocalStorage {
    [K_DISABLED_EXTENSION_ID]: string;
    [K_LAST_SEARCH_USER_INPUT]: string;
}

/**
 * @enum
 * @see https://developer.chrome.com/extensions/management#type-ExtensionType
 */
export type ChromeExtensionType =
    | "extension"
    | "hosted_app"
    | "packaged_app"
    | "legacy_packaged_app"
    | "theme"
    | "login_screen_extension";

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
            login_screen_extension: false,
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
            login_screen_extension: false,
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
