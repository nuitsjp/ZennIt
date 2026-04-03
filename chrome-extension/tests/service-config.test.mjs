import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getServiceByUrl,
  getPromptAssetPath,
  isSupportedPageUrl
} from '../src/js/service-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manifestPath = path.resolve(__dirname, '../src/manifest.json');

test('Microsoft Copilot prompt asset path uses the service id naming convention', () => {
  assert.equal(
    getPromptAssetPath('microsoftcopilot'),
    'assets/prompt/microsoftcopilot.txt'
  );
});

test('manifest exposes the Microsoft Copilot prompt asset', async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const resources = manifest.web_accessible_resources[0].resources;

  assert.ok(resources.includes('assets/prompt/microsoftcopilot.txt'));
});

test('Microsoft 365 Copilot URL is treated as a supported page', () => {
  assert.equal(
    isSupportedPageUrl('https://m365.cloud.microsoft/chat/'),
    true
  );
});

test('service lookup resolves Microsoft 365 Copilot to the Microsoft Copilot service', () => {
  assert.equal(
    getServiceByUrl('https://m365.cloud.microsoft/chat/').id,
    'microsoftcopilot'
  );
});
