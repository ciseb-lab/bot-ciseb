import { getConfig } from '../_lib/config.js';
import { applyCors } from '../_lib/http.js';

export default function handler(request, response) {
  const config = getConfig();
  if (config.environment !== 'preview') {
    response.status(404).end();
    return;
  }
  if (!applyCors(request, response, config)) return;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS');
    response.status(405).end();
    return;
  }
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ environment: config.environment, variables: config.envVarStatus });
}
