export function applyStatusToElement(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
  element.hidden = false;
}

export function clearStatusElement(element) {
  element.hidden = true;
  element.classList.toggle('error', false);
  element.textContent = '';
}
