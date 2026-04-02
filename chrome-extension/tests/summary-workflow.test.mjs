import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSummaryFailureMessage,
  ensureSummaryGenerationSucceeded
} from '../src/js/summary-response.mjs';
import { waitForElement } from '../src/js/dom-waiter.mjs';

test('ensureSummaryGenerationSucceeded throws the content-script error message', () => {
  assert.throws(
    () => ensureSummaryGenerationSucceeded({ success: false, error: '入力欄が見つかりません' }),
    /入力欄が見つかりません/
  );
});

test('ensureSummaryGenerationSucceeded throws when the response is missing', () => {
  assert.throws(
    () => ensureSummaryGenerationSucceeded(undefined),
    /要約生成の結果を受信できませんでした/
  );
});

test('createSummaryFailureMessage keeps the user-facing prefix', () => {
  assert.equal(
    createSummaryFailureMessage(new Error('入力欄が見つかりません')),
    '要約生成中にエラーが発生しました: 入力欄が見つかりません'
  );
});

test('waitForElement rejects with a timeout error when the element never appears', async () => {
  await assert.rejects(
    () =>
      waitForElement({
        findElement: () => null,
        retryIntervalMs: 1,
        timeoutMs: 5,
        timeoutMessage: '入力欄が見つかりません'
      }),
    /入力欄が見つかりません/
  );
});
