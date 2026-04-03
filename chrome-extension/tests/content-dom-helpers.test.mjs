import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pressEnterIntoElement,
  simulateTypingIntoElement
} from '../src/js/content-dom-helpers.mjs';

test('simulateTypingIntoElement appends text to textarea value and dispatches input', async () => {
  const events = [];
  const element = {
    tagName: 'TEXTAREA',
    value: 'hello ',
    dispatchEvent(event) {
      events.push(event);
    }
  };

  await simulateTypingIntoElement(element, 'world', {
    createInputEvent: (type, init) => ({ type, ...init }),
    delay: async () => {}
  });

  assert.equal(element.value, 'hello world');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'input');
  assert.equal(events[0].data, 'world');
});

test('simulateTypingIntoElement appends text to non-textarea textContent', async () => {
  const events = [];
  const element = {
    tagName: 'DIV',
    textContent: 'hello ',
    dispatchEvent(event) {
      events.push(event);
    }
  };

  await simulateTypingIntoElement(element, 'world', {
    createInputEvent: (type, init) => ({ type, ...init }),
    delay: async () => {}
  });

  assert.equal(element.textContent, 'hello world');
  assert.equal(events[0].type, 'input');
});

test('pressEnterIntoElement dispatches keydown and trailing input event', async () => {
  const events = [];
  const element = {
    textContent: 'before',
    dispatchEvent(event) {
      events.push(event);
    }
  };

  await pressEnterIntoElement(element, {
    createKeyboardEvent: (type, init) => ({ type, ...init }),
    createEvent: (type, init) => ({ type, ...init })
  });

  assert.equal(element.textContent, 'before\n');
  assert.equal(events[0].type, 'keydown');
  assert.equal(events[0].key, 'Enter');
  assert.equal(events[1].type, 'input');
});
