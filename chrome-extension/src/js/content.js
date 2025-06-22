// content-script.js
// このスクリプトは、ウェブページ上で動作し、要約生成のためのプロンプト入力を自動化します。
// 
// サポートされているプラットフォーム:
// - Claude (claude.ai)
// - ChatGPT (chatgpt.com および他のプラットフォーム - デフォルト)
// - Gemini (gemini.google.com)
// - GitHub Copilot (github.com/copilot)
//
// 新しいプラットフォーム追加方法:
// 1. getPlatformType() 関数に新しいプラットフォームの判定を追加
// 2. getInputSelector() 関数に新しいプラットフォームのセレクタを追加  
// 3. getPromptKey() 関数に新しいプラットフォームのプロンプトキーを追加

import STORAGE_KEYS, { SERVICE_STORAGE_KEYS, SERVICE_NAMES } from './constants.js';
import { getPrompt } from './prompt-service.js';

// 定数定義
const RETRY_INTERVAL = 500; // 要素を再チェックする間隔（ミリ秒）
const INPUT_DELAY = 50; // 入力後の遅延時間（ミリ秒）

console.log("Zenn It! content script loaded");

/**
 * URLからプラットフォームタイプを判定する関数
 * @param {string} currentURL - 現在のURL
 * @returns {string} サービス名 ('claude' | 'chatgpt' | 'gemini' | 'githubcopilot' | 'mscopilot')
 */
function getPlatformType(currentURL) {
  if (currentURL.includes("claude.ai")) {
    return SERVICE_NAMES.CLAUDE;
  }
  if (currentURL.includes("gemini.google.com")) {
    return SERVICE_NAMES.GEMINI;
  }
  if (currentURL.includes("github.com/copilot")) {
    return SERVICE_NAMES.GITHUB_COPILOT;
  }
  if (currentURL.includes("copilot.cloud.microsoft")) {
    return SERVICE_NAMES.MICROSOFT_COPILOT;
  }
  return SERVICE_NAMES.CHATGPT;
}

/**
 * プラットフォームに応じた入力要素のセレクタを取得する関数
 * @param {string} serviceName - サービス名
 * @returns {string} CSSセレクタ
 */
function getInputSelector(serviceName) {
  switch (serviceName) {
    case SERVICE_NAMES.CLAUDE:
      return 'div[contenteditable="true"]';
    case SERVICE_NAMES.GEMINI:
      return 'input-area-v2 .ql-editor[role="textbox"]';
    case SERVICE_NAMES.GITHUB_COPILOT:
      return '#copilot-chat-textarea';
    case SERVICE_NAMES.MICROSOFT_COPILOT:
      return '#m365-chat-editor-target-element';
    case SERVICE_NAMES.CHATGPT:
    default:
      return '#prompt-textarea';
  }
}

/**
 * Chrome拡張機能からのメッセージを処理するリスナー
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] onMessage received:', request, sender);
  if (request.action === "generateSummary") {
    generateSummary()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
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
    const currentURL = window.location.href;
    const serviceName = getPlatformType(currentURL);
    const path = getInputSelector(serviceName);
    const inputElement = await waitForElement(path);
    await inputPrompt(inputElement);
    await pressEnter(inputElement);
  } catch (error) {
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
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else {
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
  try {
    const currentURL = window.location.href;
    const serviceName = getPlatformType(currentURL);
    const promptText = await getPrompt(serviceName);
    await simulateTyping(inputArea, promptText);
  } catch (error) {
    throw error;
  }
}

/**
 * タイピングをシミュレートする関数
 * @param {Element} element - 入力対象の要素
 * @param {string} text - 入力するテキスト
 */
async function simulateTyping(element, text) {
  // textareaの場合はvalueを使う
  if (element.tagName === 'TEXTAREA') {
    element.value += text;
    const event = new InputEvent('input', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  } else {
    element.textContent += text;
    const event = new InputEvent('input', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }
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