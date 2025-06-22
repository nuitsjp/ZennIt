// prompt-service.js
// 統一プロンプト取得サービス
// ストレージとassetsフォルダからのプロンプト取得を一本化


/**
 * assetsフォルダからプロンプトを読み込む
 * @param {string} serviceName - サービス名 ('chatgpt' | 'claude' | 'gemini' | 'githubcopilot' | 'mscopilot')
 * @returns {Promise<string>} プロンプトテキスト
 */
async function loadFromAssets(serviceName) {
  try {
    const filePath = `assets/prompt/${serviceName}.txt`;
    const response = await fetch(chrome.runtime.getURL(filePath));
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
    }
    const text = await response.text();
    console.log(`Prompt loaded from assets: ${serviceName}`);
    return text;
  } catch (error) {
    console.error(`Error loading prompt from assets (${serviceName}):`, error);
    return ""; // エラー時は空文字列を返す
  }
}

/**
 * ストレージにプロンプトをキャッシュ
 * @param {string} serviceName - サービス名  
 * @param {string} promptText - プロンプトテキスト
 * @returns {Promise<void>}
 */
async function cacheToStorage(serviceName, promptText) {
  try {
    await chrome.storage.sync.set({ [serviceName]: promptText });
    console.log(`Prompt cached to storage: ${serviceName}`);
  } catch (error) {
    console.error(`Error caching prompt to storage (${serviceName}):`, error);
  }
}

/**
 * 統一プロンプト取得関数
 * ストレージに存在すればそれを返し、存在しなければassetsから読み込んでキャッシュ
 * @param {string} serviceName - サービス名
 * @param {boolean} forceReload - 強制的にassetsから再読み込みするかどうか
 * @returns {Promise<string>} プロンプトテキスト
 */
export async function getPrompt(serviceName, forceReload = false) {
  try {
    // 強制リロードでない場合、まずストレージをチェック
    if (!forceReload) {
      const result = await chrome.storage.sync.get([serviceName]);
      if (result[serviceName]) {
        console.log(`Prompt retrieved from storage: ${serviceName}`);
        return result[serviceName];
      }
    }
    // ストレージに存在しないか、強制リロードの場合はassetsから読み込み
    const promptText = await loadFromAssets(serviceName);
    // 読み込んだプロンプトをストレージにキャッシュ
    if (promptText) {
      await cacheToStorage(serviceName, promptText);
    }
    return promptText;
  } catch (error) {
    console.error(`Error in getPrompt (${serviceName}):`, error);
    return "";
  }
}

export default { getPrompt };