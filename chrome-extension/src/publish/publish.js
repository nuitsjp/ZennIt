// publish.js
// このスクリプトは、ユーザーが入力した記事をGitHubリポジトリに公開するための機能を提供します。
// GitHubのOAuth認証、ファイルの作成、更新、およびエラー処理を含みます。

import GitHubService from '../js/github-service.js';
import STORAGE_KEYS from '../js/constants.js';
import Analytics from '../js/google-analytics.js';
import StorageService from '../js/storage-service.js';

console.log("Publish script started loading...");

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

/**
 * 公開UIを管理するクラス
 * このクラスは、ユーザー入力の処理、GitHub認証、ファイルの公開などの機能を提供します。
 */
class PublishUI {
  constructor() {
    // DOM要素の取得
    this.title = document.getElementById('title');
    this.article = document.getElementById('article');
    this.publishButton = document.getElementById('publish');
    this.closeButton = document.getElementById('close');
    this.titleError = document.getElementById('titleError');
    this.articleError = document.getElementById('articleError');
    this.publishError = document.getElementById('publishError');
  }

  /**
   * UIの初期化
   * GitHubServiceの初期化、イベントのバインド、クリップボードの読み取りを行います。
   */
  async initialize() {
    await GitHubService.initialize();
    this.bindEvents();
    await this.readClipboard();
    this.validateInputs();
  }

  /**
   * イベントリスナーを設定
   */
  bindEvents() {
    this.title.addEventListener('input', () => this.validateInputs());
    this.article.addEventListener('input', () => this.validateInputs());
    this.publishButton.addEventListener('click', () => this.publish());
    this.closeButton.addEventListener('click', () => window.close());
  }

  /**
   * クリップボードからテキストを読み取り、タイトルと記事本文に設定
   */
  async readClipboard() {
    try {
      let text = await navigator.clipboard.readText();
      if (text) {
        let lines = text.split('\n');
        if (lines[0].startsWith('````text')) {
          // 先頭が````textなら先頭と最終行を削除
          lines = lines.slice(1, -1);
          text = lines.join('\n');
        }
        if (lines[0] && lines[0].startsWith('---')) {
          // Markdownフロントマターがある場合、全てを記事本文として扱う
          this.title.value = '';
          this.article.value = text;
        } else {
          // フロントマターがない場合、最初の行をタイトルとして扱う
          this.title.value = lines[0];
          this.article.value = lines.slice(1).join('\n');
        }
        this.validateInputs();
      }
    } catch (error) {
      console.error('クリップボードの読み取りに失敗しました: ', error);
    }
  }

  /**
   * 入力値のバリデーションを行う
   * @returns {boolean} バリデーション結果
   */
  validateInputs() {
    const isTitleValid = this.validateField(this.title, this.titleError);
    const isArticleValid = this.validateField(this.article, this.articleError);
    this.publishButton.disabled = !(isTitleValid && isArticleValid);
    return isTitleValid && isArticleValid;
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
   * Chrome拡張機能のストレージからデータを読み込む
   * @returns {Promise<Object>} ストレージから読み込んだデータ
   */
  async loadStorageData() {
    const repository = await StorageService.getRepository();
    return { [STORAGE_KEYS.REPOSITORY]: repository };
  }

  /**
   * 記事を公開する
   * ユーザーが入力した記事をGitHubリポジトリに公開するメインのプロセスを実行します
   */
  async publish() {
    if (!this.validateInputs()) return;

    try {
      this.clearErrorMessage();

      // 保存されたデータを読み込む
      const data = await this.loadStorageData();
      const { [STORAGE_KEYS.REPOSITORY]: repository } = data;

      // リポジトリ情報やプロンプトが設定されていない場合、オプションページを開く
      if (!repository) {
        chrome.runtime.openOptionsPage();
        return;
      }

      // GitHubの認証を行う
      const token = await GitHubService.authenticate();

      // ファイル名とコンテンツを準備
      const fileName = `articles/${this.title.value.trim()}`;
      const content = this.article.value.trim();
      const commitMessage = `Publish: ${fileName}`;
      
      // 新規ファイルの場合
      const isSuccess = await GitHubService.addNewFile(repository, fileName, content, commitMessage, token);
      if (isSuccess) {
        this.showCompletionMessage(fileName, false);
      } else {
        // ファイルが存在する場合、更新の確認を行う
        const shouldUpdate = await this.confirmUpdate(fileName);
        if (shouldUpdate) {
          if(await GitHubService.updateFile(repository, fileName, content, commitMessage, token)) {
            this.showCompletionMessage(fileName, true);
          } else {
            alert(`ファイル "${fileName}" が更新できませんでした。しばらくしてから再度実行してみてください。`);
          }
        }
      }
    } catch (error) {
      console.error('公開に失敗しました:', error);
      this.showErrorMessage(error);
    }
  }

  /**
   * ファイルの更新確認を行う
   * @param {string} fileName 更新対象のファイル名
   * @returns {Promise<boolean>} 更新を行うかどうか
   */
  async confirmUpdate(fileName) {
    return new Promise((resolve) => {
      const result = confirm(`ファイル "${fileName}" は既に存在します。上書きしますか？`);
      resolve(result);
    });
  }

  /**
   * 完了メッセージを表示する
   * @param {string} fileName 作成または更新されたファイル名
   * @param {boolean} isUpdate 更新の場合はtrue、新規作成の場合はfalse
   */
  showCompletionMessage(fileName, isUpdate) {
    const action = isUpdate ? '更新' : '作成';
    alert(`ファイル "${fileName}" が正常に${action}されました。`);
    window.close();
  }

  /**
   * エラーメッセージを表示する
   * @param {Error} error エラーオブジェクト
   */
  showErrorMessage(error) {
    this.publishError.innerHTML = `${error.message || '公開に失敗しました。'}<br><br>詳細: ${error.detail || error.stack || '詳細情報がありません。'}`;
    this.publishError.style.display = 'block';
    this.publishError.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * エラーメッセージをクリアする
   */
  clearErrorMessage() {
    this.publishError.textContent = '';
    this.publishError.style.display = 'none';
  }
}

// DOMの読み込みが完了したらUIを初期化
document.addEventListener('DOMContentLoaded', async () => {
  const ui = new PublishUI();
  await ui.initialize();
});

console.log("Publish script loaded successfully.");
