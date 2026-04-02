// popup.spec.js
// ポップアップページのE2Eテスト

const { test, expect } = require('../fixtures/extension');

test.describe('ポップアップページ', () => {
  let popupPage;

  test.beforeEach(async ({ context, extensionId }) => {
    // 拡張機能のポップアップページに直接アクセス
    popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (popupPage && !popupPage.isClosed()) {
      await popupPage.close();
    }
  });

  test('ポップアップが正しく表示される', async () => {
    // タイトルが表示されていることを確認
    const heading = popupPage.locator('h1');
    await expect(heading).toHaveText('Zenn It!');
  });

  test('要約ボタンが存在する', async () => {
    const generateBtn = popupPage.locator('#generateSummary');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText('要約');
  });

  test('発行ボタンが存在する', async () => {
    const publishBtn = popupPage.locator('#publishArticle');
    await expect(publishBtn).toBeVisible();
    await expect(publishBtn).toContainText('発行');
  });

  test('設定ボタンが存在する', async () => {
    const settingsBtn = popupPage.locator('#openSettings');
    await expect(settingsBtn).toBeVisible();
  });

  test('ステータスメッセージ領域が存在する', async () => {
    const statusMessage = popupPage.locator('#statusMessage');
    await expect(statusMessage).toBeAttached();
  });

  test('設定ボタンクリックでオプションページが開く', async ({ context, extensionId }) => {
    // 新しいページが開かれるのを待つ
    const pagePromise = context.waitForEvent('page');
    await popupPage.locator('#openSettings').click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');

    // オプションページのURLを確認
    expect(newPage.url()).toContain('options/options.html');
    await newPage.close();
  });
});
