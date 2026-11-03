import { getConfig } from './_lib/config.js';
import { applyCors } from './_lib/http.js';

interface HealthRequest {
  method?: string;
  headers?: Record<string, string | undefined>;
}

interface HealthResponse {
  status(code: number): HealthResponse;
  setHeader(name: string, value: string): void;
  json(value: unknown): HealthResponse;
  end(): HealthResponse;
}

export default function handler(request: HealthRequest, response: HealthResponse) {
  const config = getConfig();
  if (!applyCors(request, response, config)) return;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS');
    response.status(405).end();
    return;
  }
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ status: 'ok' });
}
