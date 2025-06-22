// options.js

// 定数ファイルからストレージキーをインポート
import STORAGE_KEYS, { SERVICES } from '../js/constants.js';
import Analytics from '../js/google-analytics.js';
import { getPrompt } from '../js/prompt-service.js';

// グローバル定数定義
const FEEDBACK_DURATION = 3000; // フィードバック表示時間（ミリ秒）
const FADE_DURATION = 500; // フェードアウト時間（ミリ秒）

console.log("Options script started loading...");

// Fire a page view event on load
window.addEventListener('load', () => {
  Analytics.firePageViewEvent(document.title, document.location.href);
});

// Listen globally for all button events
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLButtonElement) {
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
      // リポジトリのみストレージから直接取得
      const data = await chrome.storage.sync.get(STORAGE_KEYS.REPOSITORY);
      
      // プロンプトは全てgetPromptで取得（ストレージ→assetsの順で自動取得）
      const promptChatGPT = await getPrompt(SERVICES.CHATGPT.id);
      const promptClaude = await getPrompt(SERVICES.CLAUDE.id);
      const promptGemini = await getPrompt(SERVICES.GEMINI.id);
      const promptGitHubCopilot = await getPrompt(SERVICES.GITHUB_COPILOT.id);
      const promptMSCopilot = await getPrompt(SERVICES.MICROSOFT_COPILOT.id);
      
      return {
        repository: data[STORAGE_KEYS.REPOSITORY] || '',
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
      await chrome.storage.sync.set({
        [STORAGE_KEYS.REPOSITORY]: repository.trim(),
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
    this.promptChatGPT = $('#promptChatGPT');
    this.promptClaude = $('#promptClaude');
    this.promptGemini = $('#promptGemini');
    this.promptGitHubCopilot = $('#promptGitHubCopilot');
    this.promptMSCopilot = $('#promptMSCopilot');
    this.saveButton = $('#save');
    this.repositoryError = $('#repositoryError');
    this.promptChatGPTError = $('#promptChatGPTError');
    this.promptClaudeError = $('#promptClaudeError');
    this.promptGeminiError = $('#promptGeminiError');
    this.promptGitHubCopilotError = $('#promptGitHubCopilotError');
    this.promptMSCopilotError = $('#promptMSCopilotError');
    this.feedbackElement = this.createFeedbackElement();

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
    this.promptChatGPT.addEventListener('input', () => this.validateInputs());
    this.promptClaude.addEventListener('input', () => this.validateInputs());
    this.promptGemini.addEventListener('input', () => this.validateInputs());
    this.promptGitHubCopilot.addEventListener('input', () => this.validateInputs());
    this.promptMSCopilot.addEventListener('input', () => this.validateInputs());
    this.saveButton.addEventListener('click', () => this.save());

    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (event) => this.openTab(event, button.dataset.tab));
    });
  }

  /**
   * 入力値のバリデーションを行う
   * @returns {boolean} バリデーション結果
   */
  validateInputs() {
    const isRepositoryValid = this.validateField(this.repository, this.repositoryError);
    const isPromptChatGPTValid = this.validateField(this.promptChatGPT, this.promptChatGPTError);
    const isPromptClaudeValid = this.validateField(this.promptClaude, this.promptClaudeError);
    const isPromptGeminiValid = this.validateField(this.promptGemini, this.promptGeminiError);
    const isPromptGitHubCopilotValid = this.validateField(this.promptGitHubCopilot, this.promptGitHubCopilotError);
    const isPromptMSCopilotValid = this.validateField(this.promptMSCopilot, this.promptMSCopilotError);
    const isValid = isRepositoryValid && isPromptChatGPTValid && isPromptClaudeValid && isPromptGeminiValid && isPromptGitHubCopilotValid && isPromptMSCopilotValid;

    this.saveButton.disabled = !isValid;
    return isValid;
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
        await SettingsManager.save(this.repository.value, this.promptChatGPT.value, this.promptClaude.value, this.promptGemini.value, this.promptGitHubCopilot.value, this.promptMSCopilot.value);
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
      this.promptChatGPT.value = settings.promptChatGPT;
      this.promptClaude.value = settings.promptClaude;
      this.promptGemini.value = settings.promptGemini;
      this.promptGitHubCopilot.value = settings.promptGitHubCopilot;
      this.promptMSCopilot.value = settings.promptMSCopilot;
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
