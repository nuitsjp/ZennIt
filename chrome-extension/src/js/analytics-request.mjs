export function buildAnalyticsEndpoint(baseUrl, debug) {
  if (!baseUrl) {
    return null;
  }

  return debug ? `${baseUrl}?debug=true` : baseUrl;
}

export function buildAnalyticsBody(clientId, name, params) {
  return JSON.stringify({
    client_id: clientId,
    events: [
      {
        name,
        params
      }
    ]
  });
}
