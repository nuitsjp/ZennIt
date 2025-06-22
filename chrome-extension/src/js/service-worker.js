// service-worker.js
// このスクリプトは、Chrome拡張機能のバックグラウンドプロセスを管理します。
// 主な機能は、拡張機能のインストール/アップデート時の初期化と、デフォルト設定の管理です。

import STORAGE_KEYS from './constants.js';
import Analytics from './google-analytics.js';

console.log("Zenn It! extension background loading...");

addEventListener('unhandledrejection', async (event) => {
  Analytics.fireErrorEvent(event.reason);
});


// 拡張機能のインストール時やアップデート時に実行されるリスナー
chrome.runtime.onInstalled.addListener((details) => {
  Analytics.fireEvent('install');
  console.log(`Zenn It! extension ${details.reason}.`);
  initializeDefaultSettings();
});

/**
 * デフォルト設定を初期化する関数
 * リポジトリ設定が未設定の場合、デフォルト値を設定します。
 * プロンプトは必要時に動的に読み込まれるため、ここでは初期化しません。
 */
function initializeDefaultSettings() {
  chrome.storage.sync.get([STORAGE_KEYS.REPOSITORY], (result) => {
    const updates = {};

    // リポジトリ設定の初期化
    if (!result[STORAGE_KEYS.REPOSITORY]) {
      updates[STORAGE_KEYS.REPOSITORY] = "";
      console.log("Initializing default repository setting.");
    }

    if (Object.keys(updates).length > 0) {
      saveSettings(updates);
    }
  });
}

/**
 * 設定を保存する関数
 * @param {Object} updates - 保存する設定のオブジェクト
 */
function saveSettings(updates) {
  if (Object.keys(updates).length > 0) {
    chrome.storage.sync.set(updates, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
      } else {
        console.log('Settings saved successfully:', updates);
      }
    });
  }
}
