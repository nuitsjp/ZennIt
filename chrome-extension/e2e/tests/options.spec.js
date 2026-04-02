// options.spec.js
// オプションページのE2Eテスト

const { test, expect } = require('../fixtures/extension');

test.describe('オプションページ', () => {
  let optionsPage;

  test.beforeEach(async ({ context, extensionId }) => {
    optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options/options.html`);
    await optionsPage.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    if (optionsPage && !optionsPage.isClosed()) {
      await optionsPage.close();
    }
  });

  test('オプションページが正しく表示される', async () => {
    const heading = optionsPage.locator('h1');
    await expect(heading).toHaveText('Zenn It! - Options');
  });

  test('リポジトリ入力フィールドが存在する', async () => {
    const repoInput = optionsPage.locator('#repository');
    await expect(repoInput).toBeVisible();
    await expect(repoInput).toHaveAttribute('placeholder', 'example/Zenn');
  });

  test('リポジトリが空の場合にエラーメッセージが表示される', async () => {
    const repoInput = optionsPage.locator('#repository');
    const repoError = optionsPage.locator('#repositoryError');

    // フィールドをクリアしてバリデーションをトリガー
    await repoInput.clear();
    await repoInput.dispatchEvent('input');

    await expect(repoError).toBeVisible();
    await expect(repoError).toContainText('リポジトリを入力してください');
  });

  test('全タブボタンが存在する', async () => {
    const tabs = [
      { id: '#tabChatGPT', text: 'ChatGPT' },
      { id: '#tabClaude', text: 'Claude' },
      { id: '#tabGemini', text: 'Gemini' },
      { id: '#tabGitHubCopilot', text: 'GitHub Copilot' },
      { id: '#tabMSCopilot', text: 'Microsoft Copilot' },
    ];

    for (const tab of tabs) {
      const button = optionsPage.locator(tab.id);
      await expect(button).toBeVisible();
      await expect(button).toHaveText(tab.text);
    }
  });

  test('タブ切り替えでアクティブ状態が変わる', async () => {
    // Claudeタブをクリック
    const claudeTab = optionsPage.locator('#tabClaude');
    await claudeTab.click();
    await expect(claudeTab).toHaveClass(/active/);

    // ChatGPTタブはアクティブでなくなる
    const chatGptTab = optionsPage.locator('#tabChatGPT');
    await expect(chatGptTab).not.toHaveClass(/active/);
  });

  test('プロンプトテキストエリアが存在する', async () => {
    const textarea = optionsPage.locator('#promptTextarea');
    await expect(textarea).toBeVisible();
  });

  test('保存ボタンが存在する', async () => {
    const saveBtn = optionsPage.locator('#save');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('保存');
  });

  test('リポジトリとプロンプトを入力して保存ボタンが有効になる', async () => {
    const repoInput = optionsPage.locator('#repository');
    const textarea = optionsPage.locator('#promptTextarea');
    const saveBtn = optionsPage.locator('#save');

    // リポジトリを入力
    await repoInput.fill('test-user/test-repo');

    // 全サービスのプロンプトを入力
    const tabIds = ['#tabChatGPT', '#tabClaude', '#tabGemini', '#tabGitHubCopilot', '#tabMSCopilot'];
    for (const tabId of tabIds) {
      await optionsPage.locator(tabId).click();
      await textarea.fill('テスト用プロンプト');
    }

    // 保存ボタンが有効であること
    await expect(saveBtn).toBeEnabled();
  });

  test('設定保存でフィードバックが表示される', async () => {
    const repoInput = optionsPage.locator('#repository');
    const textarea = optionsPage.locator('#promptTextarea');
    const saveBtn = optionsPage.locator('#save');

    // リポジトリを入力
    await repoInput.fill('test-user/test-repo');

    // 全サービスのプロンプトを入力
    const tabIds = ['#tabChatGPT', '#tabClaude', '#tabGemini', '#tabGitHubCopilot', '#tabMSCopilot'];
    for (const tabId of tabIds) {
      await optionsPage.locator(tabId).click();
      await textarea.fill('テスト用プロンプト');
    }

    // 保存ボタンをクリック
    await saveBtn.click();

    // フィードバックメッセージが表示されることを確認
    const feedback = optionsPage.locator('[role="alert"]');
    await expect(feedback).toContainText('設定が保存されました');
  });
});
