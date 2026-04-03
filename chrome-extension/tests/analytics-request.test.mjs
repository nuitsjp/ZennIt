import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAnalyticsBody,
  buildAnalyticsEndpoint
} from '../src/js/analytics-request.mjs';

test('buildAnalyticsEndpoint appends the debug flag when needed', () => {
  assert.equal(
    buildAnalyticsEndpoint('https://example.test/api/TrackAnalytics', true),
    'https://example.test/api/TrackAnalytics?debug=true'
  );
});

test('buildAnalyticsEndpoint returns null without a base url', () => {
  assert.equal(buildAnalyticsEndpoint('', false), null);
});

test('buildAnalyticsBody includes the client id, event name, and params', () => {
  assert.deepEqual(
    JSON.parse(buildAnalyticsBody('client-1', 'page_view', { session_id: '1' })),
    {
      client_id: 'client-1',
      events: [
        {
          name: 'page_view',
          params: { session_id: '1' }
        }
      ]
    }
  );
});
