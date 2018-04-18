/**
 * @readonly
 * @desc public config
 */
export class Config {

  /**
   * @desc key of chrome.StorageArea
   * @desc 用于存储扩展类型的状态
   */
  static get etcKey() {
    return "extension_type_checked";
  }

  /**
   * @desc key of browser.StorageArea
   * @desc 用于存储被批量方式禁用的扩展 id
   */
  static get deiKey() {
    return "disabled_extension_id"
  }

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

}