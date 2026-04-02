// publish.spec.js
// パブリッシュページのE2Eテスト

const { test, expect } = require('../fixtures/extension');

test.describe('パブリッシュページ', () => {
  let publishPage;

  test.beforeEach(async ({ context, extensionId }) => {
    publishPage = await context.newPage();
    await publishPage.goto(`chrome-extension://${extensionId}/publish/publish.html`);
    await publishPage.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (publishPage && !publishPage.isClosed()) {
      await publishPage.close();
    }
  });

  test('パブリッシュページが正しく表示される', async () => {
    const heading = publishPage.locator('h1');
    await expect(heading).toHaveText('Zenn It! - Publish');
  });

  test('ファイル名入力フィールドが存在する', async () => {
    const titleInput = publishPage.locator('#title');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveAttribute('placeholder', '例: yyyy-MM-dd-title.md');
  });

  test('記事テキストエリアが存在する', async () => {
    const articleArea = publishPage.locator('#article');
    await expect(articleArea).toBeVisible();
  });

  test('ファイル名が空の場合にエラーメッセージが表示される', async () => {
    const titleInput = publishPage.locator('#title');
    const titleError = publishPage.locator('#titleError');

    // フィールドをクリアしてバリデーションをトリガー
    await titleInput.clear();
    await titleInput.dispatchEvent('input');

    await expect(titleError).toBeVisible();
    await expect(titleError).toContainText('ファイル名を入力してください');
  });

  test('記事が空の場合にエラーメッセージが表示される', async () => {
    const articleArea = publishPage.locator('#article');
    const articleError = publishPage.locator('#articleError');

    await articleArea.clear();
    await articleArea.dispatchEvent('input');

    await expect(articleError).toBeVisible();
    await expect(articleError).toContainText('記事を記載してください');
  });

  test('両フィールド入力時に発行ボタンが有効になる', async () => {
    const titleInput = publishPage.locator('#title');
    const articleArea = publishPage.locator('#article');
    const publishBtn = publishPage.locator('#publish');

    // 両方のフィールドに入力
    await titleInput.fill('2025-01-01-test-article.md');
    await articleArea.fill('---\ntitle: テスト記事\n---\nこれはテスト記事です。');

    await expect(publishBtn).toBeEnabled();
  });

  test('発行ボタンが存在する', async () => {
    const publishBtn = publishPage.locator('#publish');
    await expect(publishBtn).toBeVisible();
    await expect(publishBtn).toContainText('発行');
  });

  test('閉じるボタンが存在する', async () => {
    const closeBtn = publishPage.locator('#close');
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toContainText('閉じる');
  });
});
