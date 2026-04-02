import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyticsSourcePath = path.resolve(__dirname, '../src/js/google-analytics.js');

test('google-analytics client source does not embed an API secret', async () => {
  const source = await fs.readFile(analyticsSourcePath, 'utf8');

  assert.equal(source.includes('API_SECRET'), false);
});
