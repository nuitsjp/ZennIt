// storage-service.js
// このスクリプトは、Chrome拡張機能のストレージ操作を統一化するサービスクラスを提供します。
// chrome.storage.sync, local, sessionへの直接アクセスを抽象化し、一貫したAPIとエラーハンドリングを提供します。

import STORAGE_KEYS from './constants.js';

/**
 * Chrome拡張機能のストレージ操作を統一化するサービスクラス
 * 型安全性の向上とエラーハンドリングの統一を提供します
 */
class StorageService {
  /**
   * ストレージからデータを取得する
   * @param {string|string[]|Object} keys 取得するキー（文字列、配列、またはデフォルト値を持つオブジェクト）
   * @param {string} storageType ストレージタイプ ('sync'|'local'|'session')
   * @returns {Promise<Object>} 取得したデータ
   */
  async get(keys, storageType = 'sync') {
    try {
      const storage = this._getStorage(storageType);
      return await storage.get(keys);
    } catch (error) {
      console.error(`StorageService.get error (${storageType}):`, error);
      throw new Error(`ストレージからの読み込みに失敗しました: ${error.message}`);
    }
  }

  /**
   * ストレージにデータを保存する
   * @param {Object} data 保存するデータ
   * @param {string} storageType ストレージタイプ ('sync'|'local'|'session')
   * @returns {Promise<void>}
   */
  async set(data, storageType = 'sync') {
    try {
      const storage = this._getStorage(storageType);
      await storage.set(data);
    } catch (error) {
      console.error(`StorageService.set error (${storageType}):`, error);
      throw new Error(`ストレージへの保存に失敗しました: ${error.message}`);
    }
  }

  /**
   * ストレージからデータを削除する
   * @param {string|string[]} keys 削除するキー
   * @param {string} storageType ストレージタイプ ('sync'|'local'|'session')
   * @returns {Promise<void>}
   */
  async remove(keys, storageType = 'sync') {
    try {
      const storage = this._getStorage(storageType);
      await storage.remove(keys);
    } catch (error) {
      console.error(`StorageService.remove error (${storageType}):`, error);
      throw new Error(`ストレージからの削除に失敗しました: ${error.message}`);
    }
  }

  /**
   * ストレージをクリアする
   * @param {string} storageType ストレージタイプ ('sync'|'local'|'session')
   * @returns {Promise<void>}
   */
  async clear(storageType = 'sync') {
    try {
      const storage = this._getStorage(storageType);
      await storage.clear();
    } catch (error) {
      console.error(`StorageService.clear error (${storageType}):`, error);
      throw new Error(`ストレージのクリアに失敗しました: ${error.message}`);
    }
  }

  /**
   * リポジトリ設定を取得する
   * @returns {Promise<string>} リポジトリ設定（未設定の場合は空文字列）
   */
  async getRepository() {
    try {
      const result = await this.get(STORAGE_KEYS.REPOSITORY);
      return result[STORAGE_KEYS.REPOSITORY] || '';
    } catch (error) {
      console.error('getRepository error:', error);
      return '';
    }
  }

  /**
   * リポジトリ設定を保存する
   * @param {string} repository リポジトリ設定
   * @returns {Promise<void>}
   */
  async setRepository(repository) {
    await this.set({ [STORAGE_KEYS.REPOSITORY]: repository });
  }

  /**
   * GitHubトークンを取得する
   * @returns {Promise<string|null>} トークン（未設定の場合はnull）
   */
  async getToken() {
    try {
      const result = await this.get(STORAGE_KEYS.TOKEN);
      return result[STORAGE_KEYS.TOKEN] || null;
    } catch (error) {
      console.error('getToken error:', error);
      return null;
    }
  }

  /**
   * GitHubトークンを保存する
   * @param {string} token GitHubトークン
   * @returns {Promise<void>}
   */
  async setToken(token) {
    await this.set({ [STORAGE_KEYS.TOKEN]: token });
  }

  /**
   * プロンプトを取得する
   * @param {string} serviceName サービス名
   * @returns {Promise<string|null>} プロンプト（未設定の場合はnull）
   */
  async getPrompt(serviceName) {
    try {
      const result = await this.get(serviceName);
      return result[serviceName] || null;
    } catch (error) {
      console.error(`getPrompt error (${serviceName}):`, error);
      return null;
    }
  }

  /**
   * プロンプトを保存する
   * @param {string} serviceName サービス名
   * @param {string} prompt プロンプトテキスト
   * @returns {Promise<void>}
   */
  async setPrompt(serviceName, prompt) {
    await this.set({ [serviceName]: prompt });
  }

  /**
   * 複数のプロンプトを一括保存する
   * @param {Object} prompts プロンプトのオブジェクト
   * @returns {Promise<void>}
   */
  async setPrompts(prompts) {
    await this.set(prompts);
  }

  /**
   * 指定されたストレージタイプに対応するstorageオブジェクトを取得する
   * @param {string} storageType ストレージタイプ
   * @returns {Object} chrome.storageオブジェクト
   * @private
   */
  _getStorage(storageType) {
    switch (storageType) {
      case 'sync':
        return chrome.storage.sync;
      case 'local':
        return chrome.storage.local;
      case 'session':
        return chrome.storage.session;
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }
}

// シングルトンインスタンスをエクスポート
export default new StorageService();