// @ts-check
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  // テストのタイムアウト（30秒）
  timeout: 30000,
  // テスト実行時のリトライ回数
  retries: 0,
  // 並列実行は拡張機能テストでは無効（ブラウザコンテキスト共有の制約）
  workers: 1,
  // レポーター設定
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  // 失敗時のスクリーンショットとトレース設定
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
