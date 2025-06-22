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
  }
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICES };