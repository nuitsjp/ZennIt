// constants.js

import { SERVICE_DEFINITIONS, getServiceByUrl } from './service-config.mjs';

// 共通定数を定義
const STORAGE_KEYS = {
  REPOSITORY: 'repository',
  TOKEN: 'github_token',
  IS_GENERATING: 'is_generating'
};

// サービス情報をオブジェクト化
const SERVICES = {
  CHATGPT: {
    id: SERVICE_DEFINITIONS.chatgpt.id,
    selector: SERVICE_DEFINITIONS.chatgpt.selector
  },
  CLAUDE: {
    id: SERVICE_DEFINITIONS.claude.id,
    selector: SERVICE_DEFINITIONS.claude.selector
  },
  GEMINI: {
    id: SERVICE_DEFINITIONS.gemini.id,
    selector: SERVICE_DEFINITIONS.gemini.selector
  },
  GITHUB_COPILOT: {
    id: SERVICE_DEFINITIONS.githubcopilot.id,
    selector: SERVICE_DEFINITIONS.githubcopilot.selector
  },
  MICROSOFT_COPILOT: {
    id: SERVICE_DEFINITIONS.microsoftcopilot.id,
    selector: SERVICE_DEFINITIONS.microsoftcopilot.selector
  },

  /**
   * URLからサービスオブジェクトを判定する関数
   * @param {string} currentURL - 現在のURL
   * @returns {Object} サービスオブジェクト
   */
  getService(currentURL) {
    const service = getServiceByUrl(currentURL);
    if (service.id === this.CLAUDE.id) {
      return this.CLAUDE;
    }
    if (service.id === this.GEMINI.id) {
      return this.GEMINI;
    }
    if (service.id === this.GITHUB_COPILOT.id) {
      return this.GITHUB_COPILOT;
    }
    if (service.id === this.MICROSOFT_COPILOT.id) {
      return this.MICROSOFT_COPILOT;
    }
    return this.CHATGPT;
  }
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICES };
