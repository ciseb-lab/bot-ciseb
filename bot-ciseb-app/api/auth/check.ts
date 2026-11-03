import { getConfig } from '../_lib/config.js';
import { AuthenticationError, readBearerToken, verifyFirebaseIdToken } from '../_lib/firebaseAuth.ts';
import { applyCors } from '../_lib/http.js';

interface AuthRequest {
  method?: string;
  headers?: Record<string, string | undefined>;
}

interface AuthResponse {
  status(code: number): AuthResponse;
  setHeader(name: string, value: string): void;
  json(value: unknown): AuthResponse;
  end(): AuthResponse;
}

export default async function handler(request: AuthRequest, response: AuthResponse) {
  const config = getConfig();
  if (config.environment !== 'preview') {
    response.status(404).end();
    return;
  }
  if (!applyCors(request, response, config)) return;
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET, OPTIONS');
    response.status(405).end();
    return;
  }

  try {
    const identity = await verifyFirebaseIdToken(
      readBearerToken(request.headers?.authorization),
      config,
    );
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).json({ authenticated: true });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      response.status(error.status).json({ code: error.responseCode, error: error.message });
      return;
    }
    console.error(JSON.stringify({
      severity: 'ERROR',
      event: 'firebase_token_verification_failed',
      errorName: error instanceof Error ? error.name : 'UnknownError',
    }));
    response.status(503).json({
      code: 'AUTH_VERIFICATION_UNAVAILABLE',
      error: 'Não foi possível validar sua sessão no servidor. Tente novamente.',
    });
  }
}
