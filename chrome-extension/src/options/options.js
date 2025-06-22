// options.js

// 定数ファイルからストレージキーをインポート
import STORAGE_KEYS from '../js/constants.js';
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
      const data = await chrome.storage.sync.get([
        STORAGE_KEYS.REPOSITORY,
        STORAGE_KEYS.PROMPT_CHATGPT,
        STORAGE_KEYS.PROMPT_CLAUDE,
        STORAGE_KEYS.PROMPT_GEMINI,
        STORAGE_KEYS.PROMPT_COPILOT
      ]);
      console.log('load() storage data:', data); // デバッグ用
      
      // ストレージに保存されている値を優先し、ない場合はデフォルトプロンプトを取得
      const promptChatGPT = data[STORAGE_KEYS.PROMPT_CHATGPT] || await getPrompt('chatgpt');
      const promptClaude = data[STORAGE_KEYS.PROMPT_CLAUDE] || await getPrompt('claude');
      const promptGemini = data[STORAGE_KEYS.PROMPT_GEMINI] || await getPrompt('gemini');
      const promptCopilot = data[STORAGE_KEYS.PROMPT_COPILOT] || await getPrompt('copilot');
      
      return {
        repository: data[STORAGE_KEYS.REPOSITORY] || '',
        promptChatGPT,
        promptClaude,
        promptGemini,
        promptCopilot
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
   * @param {string} promptCopilot Copilot用のプロンプト設定
   * @returns {Promise<void>}
   */
  async save(repository, promptChatGPT, promptClaude, promptGemini, promptCopilot) {
    try {
      console.log('save() values:', {repository, promptChatGPT, promptClaude, promptGemini, promptCopilot}); // デバッグ用
      await chrome.storage.sync.set({
        [STORAGE_KEYS.REPOSITORY]: repository.trim(),
        [STORAGE_KEYS.PROMPT_CHATGPT]: promptChatGPT.trim(),
        [STORAGE_KEYS.PROMPT_CLAUDE]: promptClaude.trim(),
        [STORAGE_KEYS.PROMPT_GEMINI]: promptGemini.trim(),
        [STORAGE_KEYS.PROMPT_COPILOT]: promptCopilot.trim()
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
    this.promptCopilot = $('#promptCopilot');
    this.saveButton = $('#save');
    this.repositoryError = $('#repositoryError');
    this.promptChatGPTError = $('#promptChatGPTError');
    this.promptClaudeError = $('#promptClaudeError');
    this.promptGeminiError = $('#promptGeminiError');
    this.promptCopilotError = $('#promptCopilotError');
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
  bindEvents() {    this.repository.addEventListener('input', () => this.validateInputs());
    this.promptChatGPT.addEventListener('input', () => this.validateInputs());
    this.promptClaude.addEventListener('input', () => this.validateInputs());
    this.promptGemini.addEventListener('input', () => this.validateInputs());
    this.promptCopilot.addEventListener('input', () => this.validateInputs());
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
    const isPromptCopilotValid = this.validateField(this.promptCopilot, this.promptCopilotError);
    const isValid = isRepositoryValid && isPromptChatGPTValid && isPromptClaudeValid && isPromptGeminiValid && isPromptCopilotValid;

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
        await SettingsManager.save(this.repository.value, this.promptChatGPT.value, this.promptClaude.value, this.promptGemini.value, this.promptCopilot.value);
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
      this.promptCopilot.value = settings.promptCopilot;
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
