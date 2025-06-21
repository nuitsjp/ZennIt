// prompt-service.js
// 統一プロンプト取得サービス
// ストレージに存在すればそれを返し、存在しなければassetsから読み込んでキャッシュする

import STORAGE_KEYS from './constants.js';

/**
 * 統一プロンプト取得関数
 * @param {string} promptType プロンプトの種類 ('chatgpt' | 'claude' | 'gemini')
 * @param {boolean} forceReload 強制再読み込みフラグ（デフォルト: false）
 * @returns {Promise<string>} プロンプトテキスト
 */
async function getPrompt(promptType, forceReload = false) {
  try {
    const storageKey = getStorageKey(promptType);
    
    // forceReloadが false の場合、まずストレージから取得を試みる
    if (!forceReload) {
      const storedPrompt = await getPromptFromStorage(storageKey);
      if (storedPrompt) {
        console.log(`Prompt loaded from storage: ${promptType}`);
        return storedPrompt;
      }
    }
    
    // ストレージにない場合、またはforceReloadの場合はassetsから読み込む
    const assetPrompt = await loadPromptFromAssets(promptType);
    
    // 読み込んだプロンプトをストレージにキャッシュ
    await cachePromptToStorage(storageKey, assetPrompt);
    
    console.log(`Prompt loaded from assets and cached: ${promptType}`);
    return assetPrompt;
    
  } catch (error) {
    console.error(`Error getting prompt for ${promptType}:`, error);
    return ''; // エラー時は空文字列を返す
  }
}

/**
 * プラットフォームに応じたストレージキーを取得する
 * @param {string} promptType プロンプトの種類
 * @returns {string} ストレージキー
 */
function getStorageKey(promptType) {
  switch (promptType) {
    case 'claude':
      return STORAGE_KEYS.PROMPT_CLAUDE;
    case 'gemini':
      return STORAGE_KEYS.PROMPT_GEMINI;
    case 'chatgpt':
    default:
      return STORAGE_KEYS.PROMPT_CHATGPT;
  }
}

/**
 * ストレージからプロンプトを取得する
 * @param {string} storageKey ストレージキー
 * @returns {Promise<string|null>} プロンプトテキストまたはnull
 */
async function getPromptFromStorage(storageKey) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([storageKey], (result) => {
      const prompt = result[storageKey];
      resolve(prompt && prompt.trim() ? prompt : null);
    });
  });
}

/**
 * assetsフォルダからプロンプトを読み込む
 * @param {string} promptType プロンプトの種類
 * @returns {Promise<string>} プロンプトテキスト
 */
async function loadPromptFromAssets(promptType) {
  const filePath = `assets/prompt/${promptType}.txt`;
  const response = await fetch(chrome.runtime.getURL(filePath));
  
  if (!response.ok) {
    throw new Error(`Failed to load prompt from ${filePath}: ${response.status}`);
  }
  
  return await response.text();
}

/**
 * プロンプトをストレージにキャッシュする
 * @param {string} storageKey ストレージキー
 * @param {string} promptText プロンプトテキスト
 * @returns {Promise<void>}
 */
async function cachePromptToStorage(storageKey, promptText) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [storageKey]: promptText }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

export { getPrompt };