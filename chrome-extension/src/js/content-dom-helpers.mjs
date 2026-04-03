export async function simulateTypingIntoElement(element, text, {
  createInputEvent,
  delay
}) {
  if (element.tagName === 'TEXTAREA') {
    element.value += text;
  } else {
    element.textContent += text;
  }

  element.dispatchEvent(createInputEvent('input', {
    inputType: 'insertText',
    data: text,
    bubbles: true,
    cancelable: true
  }));

  await delay();
}

export async function pressEnterIntoElement(element, {
  createKeyboardEvent,
  createEvent
}) {
  element.dispatchEvent(createKeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
    keyCode: 13
  }));

  element.textContent += '\n';
  element.dispatchEvent(createEvent('input', { bubbles: true }));
  await Promise.resolve();
}
