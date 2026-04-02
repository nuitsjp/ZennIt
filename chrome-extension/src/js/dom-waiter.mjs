export function waitForElement({
  findElement,
  retryIntervalMs,
  timeoutMs,
  timeoutMessage
}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let retryTimerId = null;

    const timeoutId = setTimeout(() => {
      settled = true;
      if (retryTimerId) {
        clearTimeout(retryTimerId);
      }
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    const checkElement = () => {
      if (settled) {
        return;
      }

      const element = findElement();
      if (element) {
        settled = true;
        clearTimeout(timeoutId);
        resolve(element);
        return;
      }

      retryTimerId = setTimeout(checkElement, retryIntervalMs);
    };

    checkElement();
  });
}
