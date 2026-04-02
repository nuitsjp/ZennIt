export const SERVICE_DEFINITIONS = Object.freeze({
  chatgpt: Object.freeze({
    id: 'chatgpt',
    selector: '#prompt-textarea',
    promptAssetPath: 'assets/prompt/chatgpt.txt',
    supportedUrlPrefixes: ['https://chatgpt.com/']
  }),
  claude: Object.freeze({
    id: 'claude',
    selector: 'div[contenteditable="true"]',
    promptAssetPath: 'assets/prompt/claude.txt',
    supportedUrlPrefixes: ['https://claude.ai/']
  }),
  gemini: Object.freeze({
    id: 'gemini',
    selector: 'input-area-v2 .ql-editor[role="textbox"]',
    promptAssetPath: 'assets/prompt/gemini.txt',
    supportedUrlPrefixes: ['https://gemini.google.com/']
  }),
  githubcopilot: Object.freeze({
    id: 'githubcopilot',
    selector: '#copilot-chat-textarea',
    promptAssetPath: 'assets/prompt/githubcopilot.txt',
    supportedUrlPrefixes: ['https://github.com/copilot']
  }),
  microsoftcopilot: Object.freeze({
    id: 'microsoftcopilot',
    selector: '#m365-chat-editor-target-element',
    promptAssetPath: 'assets/prompt/microsoftcopilot.txt',
    supportedUrlPrefixes: [
      'https://copilot.cloud.microsoft/',
      'https://m365.cloud.microsoft/chat'
    ]
  })
});

export function getPromptAssetPath(serviceId) {
  return SERVICE_DEFINITIONS[serviceId]?.promptAssetPath ?? null;
}

export function isSupportedPageUrl(url) {
  return Object.values(SERVICE_DEFINITIONS).some(({ supportedUrlPrefixes }) =>
    supportedUrlPrefixes.some((prefix) => url.startsWith(prefix))
  );
}

export function getServiceByUrl(url) {
  return (
    Object.values(SERVICE_DEFINITIONS).find(({ supportedUrlPrefixes }) =>
      supportedUrlPrefixes.some((prefix) => url.includes(prefix))
    ) ?? SERVICE_DEFINITIONS.chatgpt
  );
}
