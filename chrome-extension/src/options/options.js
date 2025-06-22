// options.js

// Material Web Components imports
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';

// 定数ファイルからストレージキーをインポート
import STORAGE_KEYS, { SERVICES } from '../js/constants.js';
import Analytics from '../js/google-analytics.js';
import { getPrompt } from '../js/prompt-service.js';
import StorageService from '../js/storage-service.js';

// グローバル定数定義
const FEEDBACK_DURATION = 3000; // フィードバック表示時間（ミリ秒）
const FADE_DURATION = 500; // フェードアウト時間（ミリ秒）

console.log("Options script started loading...");

// Fire a page view event on load
window.addEventListener('load', () => {
  Analytics.firePageViewEvent(document.title, document.location.href);
});

// Listen globally for all button events (including MWC buttons)
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLButtonElement || event.target.tagName === 'MD-FILLED-BUTTON' || event.target.tagName === 'MD-PRIMARY-TAB') {
    Analytics.fireEvent('click_button', { id: event.target.id });
  }
});

// DOM操作を簡略化するユーティリティ関数
const $ = document.querySelector.bind(document);

/**
 * 設定の管理を担当するモジュール
 */
const SettingsManager = {
  /**
   * 保存された設定を読み込む
   * @returns {Promise<Object>} 読み込んだ設定
   */
  async load() {
    try {
      // リポジトリのみStorageServiceから取得
      const repository = await StorageService.getRepository();
      
      // プロンプトは全てgetPromptで取得（ストレージ→assetsの順で自動取得）
      const promptChatGPT = await getPrompt(SERVICES.CHATGPT.id);
      const promptClaude = await getPrompt(SERVICES.CLAUDE.id);
      const promptGemini = await getPrompt(SERVICES.GEMINI.id);
      const promptGitHubCopilot = await getPrompt(SERVICES.GITHUB_COPILOT.id);
      const promptMSCopilot = await getPrompt(SERVICES.MICROSOFT_COPILOT.id);
      
      return {
        repository,
        promptChatGPT,
        promptClaude,
        promptGemini,
        promptGitHubCopilot,
        promptMSCopilot
      };
    } catch (error) {
      console.error('設定の読み込み中にエラーが発生しました:', error);
      throw error;
    }
  },

  /**
   * 設定を保存する
   * @param {string} repository リポジトリ設定
   * @param {string} promptChatGPT ChatGPT用のプロンプト設定
   * @param {string} promptClaude Claude用のプロンプト設定
   * @param {string} promptGemini Gemini用のプロンプト設定
   * @param {string} promptGitHubCopilot Copilot用のプロンプト設定
   * @param {string} promptMSCopilot Microsoft Copilot用のプロンプト設定
   * @returns {Promise<void>}
   */
  async save(repository, promptChatGPT, promptClaude, promptGemini, promptGitHubCopilot, promptMSCopilot) {
    try {
      await StorageService.setRepository(repository.trim());
      await StorageService.setPrompts({
        [SERVICES.CHATGPT.id]: promptChatGPT.trim(),
        [SERVICES.CLAUDE.id]: promptClaude.trim(),
        [SERVICES.GEMINI.id]: promptGemini.trim(),
        [SERVICES.GITHUB_COPILOT.id]: promptGitHubCopilot.trim(),
        [SERVICES.MICROSOFT_COPILOT.id]: promptMSCopilot.trim()
      });
      console.log('設定が保存されました');
    } catch (error) {
      console.error('設定の保存中にエラーが発生しました:', error);
      throw error;
    }
  }
};

/**
 * オプションページのUI操作を管理するクラス
 */
class OptionsUI {
  constructor() {
    // DOM要素の取得
    this.repository = $('#repository');
    this.saveButton = $('#save');
    this.repositoryError = $('#repositoryError');
    this.feedbackElement = this.createFeedbackElement();

    // タブ・プロンプト共通要素
    this.tabsElement = $('#serviceTabs');
    this.tabButtons = document.querySelectorAll('md-primary-tab');
    this.promptTextarea = $('#promptTextarea');
    this.promptError = $('#promptError');

    // サービス情報
    this.services = [
      { key: 'ChatGPT', id: SERVICES.CHATGPT.id, label: 'ChatGPT', error: 'ChatGPT用の要約プロンプトを入力してください' },
      { key: 'Claude', id: SERVICES.CLAUDE.id, label: 'Claude', error: 'Claude用の要約プロンプトを入力してください' },
      { key: 'Gemini', id: SERVICES.GEMINI.id, label: 'Gemini', error: 'Gemini用の要約プロンプトを入力してください' },
      { key: 'GitHubCopilot', id: SERVICES.GITHUB_COPILOT.id, label: 'GitHub Copilot', error: 'GitHub Copilot用の要約プロンプトを入力してください' },
      { key: 'MSCopilot', id: SERVICES.MICROSOFT_COPILOT.id, label: 'Microsoft Copilot', error: 'Microsoft Copilot用の要約プロンプトを入力してください' }
    ];

    // サービスごとのプロンプト値
    this.prompts = {};
    // サービスごとのエラー状態
    this.promptErrors = {};

    // 現在選択中のサービス
    this.currentServiceKey = this.services[0].key;

    this.bindEvents();
  }

  /**
   * フィードバック表示用の要素を作成
   * @returns {HTMLElement} 作成したフィードバック要素
   */
  createFeedbackElement() {
    const element = document.createElement('div');
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'polite');
    element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border-radius: 4px;
      display: none;
      transition: opacity ${FADE_DURATION}ms;
    `;
    document.body.appendChild(element);
    return element;
  }

  /**
   * イベントリスナーを設定
   */
  bindEvents() {
    this.repository.addEventListener('input', () => this.validateInputs());
    this.promptTextarea.addEventListener('input', () => this.handlePromptInput());

    this.saveButton.addEventListener('click', () => this.save());

    // Material Design Tabs events
    this.tabsElement.addEventListener('change', (event) => {
      const activeTabIndex = event.target.activeTabIndex;
      const activeTab = this.tabButtons[activeTabIndex];
      if (activeTab && activeTab.dataset.service) {
        this.openTab(event, activeTab.dataset.service);
      }
    });

    // Individual tab click events for backward compatibility
    this.tabButtons.forEach(button => {
      button.addEventListener('click', (event) => this.openTab(event, button.dataset.service));
    });
  }

  handlePromptInput() {
    // 入力値を現在のサービスに保存
    this.prompts[this.currentServiceKey] = this.promptTextarea.value;
    this.validateInputs();
  }

  openTab(event, serviceKey) {
    // 現在のテキストエリア内容を保存
    this.prompts[this.currentServiceKey] = this.promptTextarea.value;

    // タブの選択状態を更新 (Material Design tabs handle this automatically)
    this.currentServiceKey = serviceKey;

    // Material Design Tabs: Set active tab programmatically
    const tabIndex = this.services.findIndex(service => service.key === serviceKey);
    if (tabIndex >= 0) {
      this.tabsElement.activeTabIndex = tabIndex;
    }

    // テキストエリアとエラー表示を切り替え
    this.promptTextarea.value = this.prompts[serviceKey] || '';
    this.updatePromptError();
    this.validateInputs();
  }

  updatePromptError() {
    const service = this.services.find(s => s.key === this.currentServiceKey);
    const isValid = (this.prompts[this.currentServiceKey] || '').trim() !== '';
    this.promptError.textContent = isValid ? '' : service.error;
    this.promptError.style.display = isValid ? 'none' : 'block';
    this.promptTextarea.classList.toggle('error', !isValid);
  }

  /**
   * 入力値のバリデーションを行う
   * @returns {boolean} バリデーション結果
   */
  validateInputs() {
    const isRepositoryValid = this.validateField(this.repository, this.repositoryError);

    // 全サービス分のプロンプトバリデーション
    let allPromptsValid = true;
    this.services.forEach(service => {
      const value = (this.prompts[service.key] || '').trim();
      const valid = value !== '';
      this.promptErrors[service.key] = !valid;
      if (service.key === this.currentServiceKey) {
        this.updatePromptError();
      }
      if (!valid) allPromptsValid = false;
    });

    this.saveButton.disabled = !(isRepositoryValid && allPromptsValid);
    return isRepositoryValid && allPromptsValid;
  }

  /**
   * 個別のフィールドのバリデーションを行う
   * @param {HTMLInputElement} field 検証対象のフィールド
   * @param {HTMLElement} errorElement エラーメッセージ表示要素
   * @returns {boolean} バリデーション結果
   */
  validateField(field, errorElement) {
    const isValid = field.value.trim() !== '';
    field.classList.toggle('error', !isValid);
    errorElement.style.display = isValid ? 'none' : 'block';
    return isValid;
  }

  /**
   * フィードバックメッセージを表示
   * @param {string} message 表示するメッセージ
   */
  showFeedback(message) {
    this.feedbackElement.textContent = message;
    this.feedbackElement.style.display = 'block';
    this.feedbackElement.style.opacity = '1';
    
    setTimeout(() => {
      this.feedbackElement.style.opacity = '0';
      setTimeout(() => {
        this.feedbackElement.style.display = 'none';
      }, FADE_DURATION);
    }, FEEDBACK_DURATION);
  }

  /**
   * 設定を保存
   */
  async save() {
    if (this.validateInputs()) {
      try {
        // サービス順に値を渡す
        await SettingsManager.save(
          this.repository.value,
          this.prompts.ChatGPT || '',
          this.prompts.Claude || '',
          this.prompts.Gemini || '',
          this.prompts.GitHubCopilot || '',
          this.prompts.MSCopilot || ''
        );
        this.showFeedback('設定が保存されました');
      } catch (error) {
        this.showFeedback('設定の保存中にエラーが発生しました');
      }
    }
  }

  /**
   * UIの初期化
   */
  async initialize() {
    try {
      const settings = await SettingsManager.load();
      this.repository.value = settings.repository;
      // サービスごとにプロンプト値をセット
      this.prompts.ChatGPT = settings.promptChatGPT;
      this.prompts.Claude = settings.promptClaude;
      this.prompts.Gemini = settings.promptGemini;
      this.prompts.GitHubCopilot = settings.promptGitHubCopilot;
      this.prompts.MSCopilot = settings.promptMSCopilot;

      // 最初のタブをアクティブに (Material Design tabs)
      this.tabsElement.activeTabIndex = 0;
      this.promptTextarea.value = this.prompts[this.currentServiceKey] || '';
      this.updatePromptError();
      this.validateInputs();
    } catch (error) {
      this.showFeedback('設定の読み込み中にエラーが発生しました');
    }
  }
}

// DOMの読み込みが完了したらアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
  const ui = new OptionsUI();
  await ui.initialize();
});

console.log("Options script loaded successfully.");
