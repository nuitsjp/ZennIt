// prompt-service.js
// 統一プロンプト取得サービス
// ストレージとassetsフォルダからのプロンプト取得を一本化

import STORAGE_KEYS from './constants.js';

/**
 * プロンプトタイプに対応するストレージキーを取得
 * @param {string} promptType - プロンプトタイプ ('chatgpt' | 'claude' | 'gemini' | 'githubcopilot' | 'mscopilot')
 * @returns {string} ストレージキー
 */
function getStorageKey(promptType) {
  switch (promptType) {
    case 'chatgpt':
      return STORAGE_KEYS.PROMPT_CHATGPT;
    case 'claude':
      return STORAGE_KEYS.PROMPT_CLAUDE;
    case 'gemini':
      return STORAGE_KEYS.PROMPT_GEMINI;
    case 'githubcopilot':
      return STORAGE_KEYS.PROMPT_GITHUBCOPILOT;
    case 'mscopilot':
      return STORAGE_KEYS.PROMPT_MSCOPILOT;
    default:
      throw new Error(`Unsupported prompt type: ${promptType}`);
  }
}

/**
 * assetsフォルダからプロンプトを読み込む
 * @param {string} promptType - プロンプトタイプ
 * @returns {Promise<string>} プロンプトテキスト
 */
async function loadFromAssets(promptType) {
  try {
    const filePath = `assets/prompt/${promptType}.txt`;
    const response = await fetch(chrome.runtime.getURL(filePath));
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
    }
    const text = await response.text();
    console.log(`Prompt loaded from assets: ${promptType}`);
    return text;
  } catch (error) {
    console.error(`Error loading prompt from assets (${promptType}):`, error);
    return ""; // エラー時は空文字列を返す
  }
}

/**
 * ストレージにプロンプトをキャッシュ
 * @param {string} promptType - プロンプトタイプ  
 * @param {string} promptText - プロンプトテキスト
 * @returns {Promise<void>}
 */
async function cacheToStorage(promptType, promptText) {
  try {
    const storageKey = getStorageKey(promptType);
    await chrome.storage.sync.set({ [storageKey]: promptText });
    console.log(`Prompt cached to storage: ${promptType}`);
  } catch (error) {
    console.error(`Error caching prompt to storage (${promptType}):`, error);
  }
}

/**
 * 統一プロンプト取得関数
 * ストレージに存在すればそれを返し、存在しなければassetsから読み込んでキャッシュ
 * @param {string} promptType - プロンプトタイプ ('chatgpt' | 'claude' | 'gemini')
 * @param {boolean} forceReload - 強制的にassetsから再読み込みするかどうか
 * @returns {Promise<string>} プロンプトテキスト
 */
export async function getPrompt(promptType, forceReload = false) {
  try {
    const storageKey = getStorageKey(promptType);
    
    // 強制リロードでない場合、まずストレージをチェック
    if (!forceReload) {
      const result = await chrome.storage.sync.get([storageKey]);
      if (result[storageKey]) {
        console.log(`Prompt retrieved from storage: ${promptType}`);
        return result[storageKey];
      }
    }
    
    // ストレージに存在しないか、強制リロードの場合はassetsから読み込み
    const promptText = await loadFromAssets(promptType);
    
    // 読み込んだプロンプトをストレージにキャッシュ
    if (promptText) {
      await cacheToStorage(promptType, promptText);
    }
    
    return promptText;
  } catch (error) {
    console.error(`Error in getPrompt (${promptType}):`, error);
    return "";
  }
}

export default { getPrompt };