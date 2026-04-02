// extension.js
// Chrome拡張機能をロードした状態でPlaywrightテストを実行するためのカスタムフィクスチャ

const { test: base, chromium } = require('@playwright/test');
const path = require('path');

/**
 * Chrome拡張機能テスト用のカスタムフィクスチャ
 * 
 * 提供するフィクスチャ:
 * - context: 拡張機能がロードされたブラウザコンテキスト
 * - extensionId: ロードされた拡張機能のID
 */
const test = base.extend({
  // 拡張機能をロードしたPersistentContextを作成
  context: async ({}, use) => {
    const pathToExtension = path.resolve(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });
    await use(context);
    await context.close();
  },

  // 拡張機能のIDをService Workerから取得
  extensionId: async ({ context }, use) => {
    // Service Workerが登録されるのを待つ
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    // URLから拡張IDを抽出 (chrome-extension://<id>/js/service-worker.bundle.js)
    const extensionId = sw.url().split('/')[2];
    await use(extensionId);
  },
});

const { expect } = require('@playwright/test');

module.exports = { test, expect };
