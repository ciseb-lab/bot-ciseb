export function applyCors(request, response, config) {
  const origin = request.headers?.origin;
  if (origin && !config.appOrigins.includes(origin)) {
    response.status(403).end();
    return false;
  }

  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Firebase-AppCheck');
    response.setHeader('Access-Control-Max-Age', '600');
  }

  if (request.method === 'OPTIONS') {
    response.status(origin ? 204 : 403).end();
    return false;
  }
  return true;
}
