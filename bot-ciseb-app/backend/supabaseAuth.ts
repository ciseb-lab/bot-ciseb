import { isInstitutionalEmail } from '../shared/authPolicy.ts';

export interface AuthenticatedIdentity {
  uid: string;
  email: string;
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

interface AuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function readBearerToken(authorization: string | undefined): string {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

export async function verifySupabaseAccessToken(
  token: string,
  config: AuthConfig,
): Promise<AuthenticatedIdentity> {
  if (!token) {
    throw new AuthenticationError(401, 'AUTH_REQUIRED', 'Entre com seu e-mail institucional para continuar.');
  }
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new AuthenticationError(503, 'AUTH_NOT_CONFIGURED', 'A autenticação ainda não está configurada.');
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      const status = error && 'status' in error ? Number(error.status) : 0;
      if (status === 401 || status === 403 || error?.code === 'user_not_found') {
        throw new AuthenticationError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.');
      }
      throw new AuthenticationError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'Não foi possível validar sua sessão no servidor. Tente novamente.');
    }

    const providers = user.app_metadata.providers;
    if (typeof user.email !== 'string'
      || !isInstitutionalEmail(user.email)
      || typeof user.email_confirmed_at !== 'string'
      || (user.app_metadata.provider !== 'google'
        && !(Array.isArray(providers) && providers.includes('google')))) {
      throw new AuthenticationError(
        403,
        'GOOGLE_INSTITUTIONAL_ACCOUNT_REQUIRED',
        'Acesse com uma conta Google verificada de um domínio institucional autorizado.',
      );
    }
    return { uid: user.id, email: user.email.toLowerCase() };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'Não foi possível validar sua sessão no servidor. Tente novamente.');
  }
}
