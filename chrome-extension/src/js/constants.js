// constants.js

// 共通定数を定義
const STORAGE_KEYS = {
  REPOSITORY: 'repository',
  TOKEN: 'github_token',
  IS_GENERATING: 'is_generating'
};

// サービス情報をオブジェクト化
const SERVICES = {
  CHATGPT: {
    id: 'chatgpt',
    selector: '#prompt-textarea'
  },
  CLAUDE: {
    id: 'claude',
    selector: 'div[contenteditable="true"]'
  },
  GEMINI: {
    id: 'gemini',
    selector: 'input-area-v2 .ql-editor[role="textbox"]'
  },
  GITHUB_COPILOT: {
    id: 'githubcopilot',
    selector: '#copilot-chat-textarea'
  },
  MICROSOFT_COPILOT: {
    id: 'microsoftcopilot',
    selector: '#m365-chat-editor-target-element'
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
    if (currentURL.includes("m365.cloud.microsoft/chat")) {
      return this.MICROSOFT_COPILOT;
    }
    return this.CHATGPT;
  }
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICES };