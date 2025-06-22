// constants.js

// 共通定数を定義
const STORAGE_KEYS = {
  REPOSITORY: 'repository',
  TOKEN: 'github_token'
};

// サービス名
const SERVICE_NAMES = {
  CHATGPT: 'chatgpt',
  CLAUDE: 'claude',
  GEMINI: 'gemini',
  GITHUB_COPILOT: 'githubcopilot',
  MICROSOFT_COPILOT: 'microsoftcopilot'
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICE_NAMES };