import { isInstitutionalEmail } from '../../shared/authPolicy.ts';

interface FirebaseIdentity {
  uid: string;
  email: string;
}

interface AuthConfig {
  firebaseProjectId: string;
}

export class AuthenticationError extends Error {
  constructor(
    readonly status: 401 | 403 | 503,
    readonly responseCode: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

type JwtKeySet = import('jose').JWTVerifyGetKey;

let remoteKeySet: JwtKeySet | undefined;

async function getRemoteKeySet(): Promise<JwtKeySet> {
  if (!remoteKeySet) {
    const { createRemoteJWKSet } = await import('jose');
    remoteKeySet = createRemoteJWKSet(new URL(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    ));
  }
  return remoteKeySet;
}

function isInvalidTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error) || typeof error.code !== 'string') {
    return false;
  }
  return error.code.startsWith('ERR_JWT')
    || error.code.startsWith('ERR_JWS')
    || error.code === 'ERR_JWKS_NO_MATCHING_KEY';
}

export async function verifyFirebaseIdToken(
  token: string,
  config: AuthConfig,
  keySet?: JwtKeySet,
): Promise<FirebaseIdentity> {
  if (!config.firebaseProjectId) {
    throw new AuthenticationError(503, 'AUTH_NOT_CONFIGURED', 'A autenticação ainda não está configurada.');
  }
  if (!token) {
    throw new AuthenticationError(401, 'AUTH_REQUIRED', 'Entre com seu e-mail institucional para continuar.');
  }

  const { jwtVerify } = await import('jose');
  let payload;
  try {
    ({ payload } = await jwtVerify(token, keySet || await getRemoteKeySet(), {
      algorithms: ['RS256'],
      audience: config.firebaseProjectId,
      issuer: `https://securetoken.google.com/${config.firebaseProjectId}`,
      clockTolerance: 5,
    }));
  } catch (error) {
    if (isInvalidTokenError(error)) {
      throw new AuthenticationError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.');
    }
    throw new AuthenticationError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'Não foi possível validar sua sessão no servidor. Tente novamente.');
  }

  const firebase = payload.firebase;
  if (typeof payload.sub !== 'string' || !payload.sub
    || payload.email_verified !== true
    || typeof payload.email !== 'string'
    || !isInstitutionalEmail(payload.email)
    || !firebase || typeof firebase !== 'object'
    || !('sign_in_provider' in firebase)
    || firebase.sign_in_provider !== 'google.com') {
    throw new AuthenticationError(
      403,
      'GOOGLE_INSTITUTIONAL_ACCOUNT_REQUIRED',
      'Acesse com uma conta Google verificada de um domínio institucional autorizado.',
    );
  }

  return { uid: payload.sub, email: payload.email.toLowerCase() };
}

export function readBearerToken(authorization: string | undefined): string {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}
