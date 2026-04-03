import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyStatusToElement,
  clearStatusElement
} from '../src/js/popup-status.mjs';

function createStatusElement() {
  const classes = new Set();
  return {
    hidden: true,
    textContent: '',
    classList: {
      toggle(name, enabled) {
        if (enabled) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      contains(name) {
        return classes.has(name);
      }
    }
  };
}

test('applyStatusToElement shows the message and toggles error class', () => {
  const element = createStatusElement();

  applyStatusToElement(element, '失敗しました', true);

  assert.equal(element.hidden, false);
  assert.equal(element.textContent, '失敗しました');
  assert.equal(element.classList.contains('error'), true);
});

test('clearStatusElement hides the message and removes error class', () => {
  const element = createStatusElement();
  applyStatusToElement(element, '失敗しました', true);

  clearStatusElement(element);

  assert.equal(element.hidden, true);
  assert.equal(element.textContent, '');
  assert.equal(element.classList.contains('error'), false);
});
