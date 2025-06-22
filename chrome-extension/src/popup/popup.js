// popup.js
// このスクリプトは、Chrome拡張機能のポップアップUIの動作を制御します。
// 主な機能は、記事の要約生成と公開プロセスの開始です。

// Material Web Components imports
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';

// 共通の定数をインポート（ストレージキーなど）
import STORAGE_KEYS from '../js/constants.js';
import Analytics from '../js/google-analytics.js';
import StorageService from '../js/storage-service.js';

console.log("Popup script started loading...");

// Fire a page view event on load
window.addEventListener('load', () => {
  Analytics.firePageViewEvent(document.title, document.location.href);
});

// Listen globally for all button events (including MWC buttons)
document.addEventListener('click', (event) => {
  if (event.target instanceof HTMLButtonElement || event.target.tagName === 'MD-FILLED-BUTTON' || event.target.tagName === 'MD-ICON-BUTTON') {
    Analytics.fireEvent('click_button', { id: event.target.id });
  }
});

// DOMの操作を簡略化するユーティリティ関数
const $ = document.querySelector.bind(document);

/**
 * ポップアップUIの管理を担当するクラス
 */
class PopupUI {
  constructor() {
    // UIの構成要素
    this.generateSummaryBtn = $('#generateSummary');
    this.publishArticleBtn = $('#publishArticle');
    this.openSettingsBtn = $('#openSettings'); // 設定ボタンの取得
    this.statusMessage = $('#statusMessage');
    // 許可されたURLのリスト
    this.allowedUrls = [
      "https://claude.ai/", 
      "https://chatgpt.com/", 
      "https://gemini.google.com/",
      "https://github.com/copilot",
      "https://copilot.cloud.microsoft/"
    ];
  }

  /**
   * UIの初期化
   * イベントリスナーの設定とボタンの初期状態を設定します
   */
  initialize() {
    this.bindEvents();
    this.updateButtonStates();
  }

  /**
   * イベントリスナーの設定
   * ボタンクリックイベントを対応するメソッドにバインドします
   */
  bindEvents() {
    this.generateSummaryBtn.addEventListener('click', () => this.generateSummary());
    this.publishArticleBtn.addEventListener('click', () => this.publish());
    this.openSettingsBtn.addEventListener('click', () => this.openOptionsPage()); // 設定ページを開く
  }

  /**
   * ボタンの状態を更新
   * 要約生成中かどうか、および現在のURLが許可されているかどうかに基づいてボタンの有効/無効を切り替えます
   */
  async updateButtonStates() {
    const isGenerating = await this.isGeneratingSummary();
    const isAllowedUrl = await this.checkCurrentUrl();
    
    this.generateSummaryBtn.disabled = isGenerating || !isAllowedUrl;
    this.publishArticleBtn.disabled = isGenerating || !isAllowedUrl;
  }

  /**
   * 要約生成中かどうかを確認
   * @returns {Promise<boolean>} 要約生成中の場合はtrue、そうでない場合はfalse
   */
  async isGeneratingSummary() {
    try {
      const result = await StorageService.get(STORAGE_KEYS.IS_GENERATING, 'local');
      return result[STORAGE_KEYS.IS_GENERATING] || false;
    } catch (error) {
      console.error('Error checking generation status:', error);
      return false;
    }
  }

  /**
   * 現在のURLが許可されているかどうかを確認
   * @returns {Promise<boolean>} 許可されたURLの場合はtrue、そうでない場合はfalse
   */
  async checkCurrentUrl() {
    return new Promise(resolve => {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (tabs.length > 0) {
          console.log(`Current tab: ${tabs[0]} URL: ${tabs[0].url}`);
          const currentUrl = tabs[0].url;
          const isAllowed = this.allowedUrls.some(url => currentUrl.startsWith(url));
          resolve(isAllowed);
        } else {
          resolve(false);
        }
      });
    });
  }

  /**
   * ステータスメッセージを表示
   * @param {string} message 表示するメッセージ
   * @param {boolean} isError エラーメッセージの場合はtrue
   */
  showStatus(message, isError = false) {
    this.statusMessage.textContent = message;
    this.statusMessage.classList.toggle('error', isError);
    this.statusMessage.hidden = false;
  }

  /**
   * ステータスメッセージをクリア
   * メッセージを非表示にし、内容をクリアします
   */
  clearStatus() {
    this.statusMessage.hidden = true;
    this.statusMessage.classList.toggle('error', false);
    this.statusMessage.textContent = '';
  }

  /**
   * 要約生成プロセスを開始
   * アクティブなタブに要約生成のメッセージを送信します
   */
  async generateSummary() {
    this.clearStatus();
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tabs || tabs.length === 0) {
        console.error('[Popup] No active tab found');
        throw new Error("アクティブなタブが見つかりません");
      }

      const message = {action: 'generateSummary'};
      const response = await chrome.tabs.sendMessage(tabs[0].id, message);
      window.close();
    } catch (error) {
      console.error("要約生成中にエラーが発生しました:", error);
      this.showStatus("要約生成中にエラーが発生しました", true);
    } finally {
      this.updateButtonStates();
    }
  }

  /**
   * 記事公開プロセスを開始
   * リポジトリの設定を確認し、適切な次のステップを実行します
   */
  async publish() {
    this.clearStatus();
    try {
      const repository = await StorageService.getRepository();
      if (!repository) {
        this.showStatus("リポジトリが設定されていません", true);
        await this.openOptionsPage();
      } else {
        await this.openPublishPage();
      }
    } catch (error) {
      console.error("公開プロセス開始中にエラーが発生しました:", error);
      this.showStatus("公開プロセス開始中にエラーが発生しました", true);
    }
  }

  /**
   * オプションページを開く
   * chrome.runtime.openOptionsPage APIをサポートしていない場合は
   * 代替方法でオプションページを開きます
   */
  async openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
      await chrome.runtime.openOptionsPage();
    } else {
      await chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
    window.close();
  }

  /**
   * 公開ページを開く
   * 新しいタブで公開ページを開き、現在のポップアップを閉じます
   */
  async openPublishPage() {
    try {
      // 現在のアクティブなタブを取得
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      // 現在のアクティブタブのインデックスの1個右側に新しいタブを作成
      await chrome.tabs.create({
        url: chrome.runtime.getURL('../publish/publish.html'),
        index: activeTab.index + 1 // 現在のアクティブタブの1つ右側
      });
      window.close();
    } catch (error) {
      console.error("タブを開く際にエラーが発生しました:", error);
    }
  }
}

// DOMの読み込みが完了したらUIを初期化
document.addEventListener('DOMContentLoaded', () => {
  const ui = new PopupUI();
  ui.initialize();
});

console.log("Popup script loaded successfully.");