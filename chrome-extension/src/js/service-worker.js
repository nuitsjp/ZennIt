// service-worker.js
// このスクリプトは、Chrome拡張機能のバックグラウンドプロセスを管理します。
// 主な機能は、拡張機能のインストール/アップデート時の初期化と、デフォルト設定の管理です。

import STORAGE_KEYS from './constants.js';
import Analytics from './google-analytics.js';
import StorageService from './storage-service.js';

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
async function initializeDefaultSettings() {
  try {
    const repository = await StorageService.getRepository();
    if (!repository) {
      await StorageService.setRepository("");
      console.log("Initializing default repository setting.");
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}

/**
 * 設定を保存する関数
 * @param {Object} updates - 保存する設定のオブジェクト
 */
async function saveSettings(updates) {
  if (Object.keys(updates).length > 0) {
    try {
      await StorageService.set(updates);
      console.log('Settings saved successfully:', updates);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}
