// constants.js

// 共通定数を定義
const STORAGE_KEYS = {
  REPOSITORY: 'repository',
  TOKEN: 'github_token'
};

// サービス情報をオブジェクト化
const SERVICES = {
  CHATGPT: {
    id: 'chatgpt'
  },
  CLAUDE: {
    id: 'claude'
  },
  GEMINI: {
    id: 'gemini'
  },
  GITHUB_COPILOT: {
    id: 'githubcopilot'
  },
  MICROSOFT_COPILOT: {
    id: 'microsoftcopilot'
  },

  /**
   * URLからサービスオブジェクトを判定する関数
   * @param {string} currentURL - 現在のURL
   * @returns {Object} サービスオブジェクト
   */
  getService(currentURL) {
    if (currentURL.includes("claude.ai")) {
      return this.CLAUDE;
    }
    if (currentURL.includes("gemini.google.com")) {
      return this.GEMINI;
    }
    if (currentURL.includes("github.com/copilot")) {
      return this.GITHUB_COPILOT;
    }
    if (currentURL.includes("copilot.cloud.microsoft")) {
      return this.MICROSOFT_COPILOT;
    }
    return this.CHATGPT;
  }
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICES };