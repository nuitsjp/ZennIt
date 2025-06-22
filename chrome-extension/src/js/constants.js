// constants.js

// 共通定数を定義
const STORAGE_KEYS = {
  REPOSITORY: 'repository',
  TOKEN: 'github_token'
};

// サービス名とストレージキーのマッピング
const SERVICE_STORAGE_KEYS = {
  chatgpt: 'promptChatGPT',
  claude: 'promptClaude', 
  gemini: 'promptGemini',
  githubcopilot: 'promptGitHubCopilot',
  mscopilot: 'promptMSCopilot'
};

// このファイルを他のスクリプトで利用できるようにする
export default STORAGE_KEYS;
export { SERVICE_STORAGE_KEYS };