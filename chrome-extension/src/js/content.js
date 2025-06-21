// content-script.js
// このスクリプトは、ウェブページ上で動作し、要約生成のためのプロンプト入力を自動化します。
// 
// サポートされているプラットフォーム:
// - Claude (claude.ai)
// - ChatGPT (chatgpt.com および他のプラットフォーム - デフォルト)
// - Gemini (gemini.google.com)
//
// 新しいプラットフォーム追加方法:
// 1. getPlatformType() 関数に新しいプラットフォームの判定を追加
// 2. getInputSelector() 関数に新しいプラットフォームのセレクタを追加  
// 3. getPromptKey() 関数に新しいプラットフォームのプロンプトキーを追加

import STORAGE_KEYS from './constants.js';

// 定数定義
const RETRY_INTERVAL = 500; // 要素を再チェックする間隔（ミリ秒）
const INPUT_DELAY = 50; // 入力後の遅延時間（ミリ秒）
const DEBUG = true; // デバッグモードの制御

console.log("Zenn It! content script loaded");

/**
 * デバッグメッセージをコンソールに出力する関数
 * @param {string} message - ログメッセージ
 */
function debugLog(message) {
  if (DEBUG) {
    console.log(`Content script: ${message}`);
  }
}

/**
 * URLからプラットフォームタイプを判定する関数
 * @param {string} currentURL - 現在のURL
 * @returns {string} プラットフォーム名 ('claude' | 'chatgpt' | 'gemini')
 */
function getPlatformType(currentURL) {
  if (currentURL.includes("claude.ai")) {
    return 'claude';
  }
  if (currentURL.includes("gemini.google.com")) {
    return 'gemini';
  }
  return 'chatgpt';
}

/**
 * プラットフォームに応じた入力要素のセレクタを取得する関数
 * @param {string} platform - プラットフォーム名
 * @returns {string} CSSセレクタ
 */
function getInputSelector(platform) {
  switch (platform) {
    case 'claude':
      return 'div[contenteditable="true"]';
    case 'gemini':
      return 'input-area-v2 .ql-editor[role="textbox"]';
    case 'chatgpt':
    default:
      return '#prompt-textarea';
  }
}

/**
 * プラットフォームに応じたプロンプトのストレージキーを取得する関数
 * @param {string} platform - プラットフォーム名
 * @returns {string} ストレージキー
 */
function getPromptKey(platform) {
  switch (platform) {
    case 'claude':
      return STORAGE_KEYS.PROMPT_CLAUDE;
    case 'gemini':
      return STORAGE_KEYS.PROMPT_GEMINI;
    case 'chatgpt':
    default:
      return STORAGE_KEYS.PROMPT_CHATGPT;
  }
}

/**
 * Chrome拡張機能からのメッセージを処理するリスナー
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog(`Message received: ${JSON.stringify(request)}`);
  
  if (request.action === "generateSummary") {
    generateSummary()
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        debugLog(`Error in generateSummary: ${error.message}`);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 非同期レスポンスを示すために true を返す
  }
});

/**
 * 要約を生成するメイン関数
 * 入力要素を見つけ、プロンプトを入力し、Enterキーを押す一連の処理を行う
 */
async function generateSummary() {
  try {
    debugLog("Determining platform...");
    const currentURL = window.location.href;
    const platform = getPlatformType(currentURL);
    const path = getInputSelector(platform);

    debugLog(`Waiting for input element. Platform: ${platform}, Path: ${path}`);
    const inputElement = await waitForElement(path);
    debugLog(`Input element found. Element: ${inputElement}`);
    await inputPrompt(inputElement);
    await pressEnter(inputElement);
  } catch (error) {
    debugLog(`Error in generateSummary: ${error.message}`);
    throw error;
  }
}

/**
 * 指定されたセレクタの要素が見つかるまで待機する関数
 * @param {string} selector - CSS セレクタ
 * @returns {Promise<Element>} 見つかった要素
 */
function waitForElement(selector) {
  return new Promise((resolve) => {
    debugLog(`Starting waitForElement for: ${selector}`);
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        debugLog("Element found");
        resolve(element);
      } else {
        debugLog(`Element not found, retrying in ${RETRY_INTERVAL}ms`);
        setTimeout(checkElement, RETRY_INTERVAL);
      }
    };
    checkElement();
  });
}

/**
 * プロンプトを入力エリアに入力する関数
 * @param {Element} inputArea - 入力エリアの要素
 */
async function inputPrompt(inputArea) {
  debugLog("Inputting prompt");
  
  try {
    const data = await new Promise((resolve) => chrome.storage.sync.get([STORAGE_KEYS.PROMPT_CHATGPT, STORAGE_KEYS.PROMPT_CLAUDE, STORAGE_KEYS.PROMPT_GEMINI], resolve));
    const currentURL = window.location.href;
    const platform = getPlatformType(currentURL);
    const promptKey = getPromptKey(platform);
    let promptText = data[promptKey];
    
    await simulateTyping(inputArea, promptText);
    debugLog("Prompt inputted");
  } catch (error) {
    debugLog(`Error in inputPrompt: ${error.message}`);
    throw error;
  }
}

/**
 * タイピングをシミュレートする関数
 * @param {Element} element - 入力対象の要素
 * @param {string} text - 入力するテキスト
 */
async function simulateTyping(element, text) {
  element.textContent += text;
  const event = new InputEvent('input', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  await new Promise(resolve => setTimeout(resolve, INPUT_DELAY));
}

/**
 * 指定された要素にEnterキーイベントを発生させる関数
 * @param {Element} element - 対象の要素
 */
async function pressEnter(element) {
  const enterEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
    keyCode: 13
  });
  element.dispatchEvent(enterEvent);
  element.textContent += '\n';
  element.dispatchEvent(new Event('input', { bubbles: true }));
  await Promise.resolve();
}