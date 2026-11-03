import path from 'node:path';

export const ENVIRONMENT_VARIABLE_NAMES = [
  'PORT',
  'NODE_ENV',
  'DOCUMENTS_DIR',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'APP_ORIGINS',
  'CHAT_RATE_LIMIT_PER_MINUTE',
  'CHAT_RATE_LIMIT_PER_DAY',
  'CHAT_MAX_INPUT_CHARS',
  'CHAT_HISTORY_MAX_CHARS',
  'CHAT_MAX_CONCURRENCY_PER_USER',
  'API_RATE_LIMIT_PER_IP_PER_MINUTE',
  'PDF_RATE_LIMIT_PER_MINUTE',
  'PDF_RATE_LIMIT_PER_IP_PER_MINUTE',
  'GEMINI_TIMEOUT_MS',
  'TRUST_PROXY_HOPS',
  'API_JSON_LIMIT',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_BASE_URL',
];

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getConfig(env: NodeJS.ProcessEnv = process.env) {
  const environment = env.VERCEL_ENV || env.NODE_ENV || 'development';
  const configuredOrigins = env.APP_ORIGINS?.trim();
  const configuredProxyHops = env.TRUST_PROXY_HOPS?.trim();
  const proxyHops = configuredProxyHops ? Number(configuredProxyHops) : Number.NaN;
  return {
    environment,
    isProduction: env.NODE_ENV === 'production',
    port: positiveInteger(env.PORT, 3000),
    documentsDirectory: path.resolve(
      process.cwd(),
      env.DOCUMENTS_DIR?.trim() || path.join('backend', 'documents'),
    ),
    geminiApiKey: env.GEMINI_API_KEY?.trim() || '',
    appOrigins: (configuredOrigins
      || (environment === 'development' ? 'http://localhost:5173,http://localhost:3000' : ''))
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    supabaseUrl: env.SUPABASE_URL || env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    geminiTimeoutMs: positiveInteger(env.GEMINI_TIMEOUT_MS, 45_000),
    apiJsonLimit: env.API_JSON_LIMIT?.trim() || '200kb',
    trustedProxyHops: Number.isSafeInteger(proxyHops) && proxyHops >= 0
      ? proxyHops
      : (env.K_SERVICE ? 1 : 0),
    chatPerMinute: positiveInteger(env.CHAT_RATE_LIMIT_PER_MINUTE, 10),
    chatPerDay: positiveInteger(env.CHAT_RATE_LIMIT_PER_DAY, 100),
    chatMaxInputChars: positiveInteger(env.CHAT_MAX_INPUT_CHARS, 4000),
    chatHistoryMaxChars: positiveInteger(env.CHAT_HISTORY_MAX_CHARS, 1200),
    chatMaxConcurrencyPerUser: positiveInteger(env.CHAT_MAX_CONCURRENCY_PER_USER, 2),
    apiPerIpMinute: positiveInteger(env.API_RATE_LIMIT_PER_IP_PER_MINUTE, 30),
    pdfPerMinute: positiveInteger(env.PDF_RATE_LIMIT_PER_MINUTE, 5),
    pdfPerIpMinute: positiveInteger(env.PDF_RATE_LIMIT_PER_IP_PER_MINUTE, 10),
    envVarStatus: Object.fromEntries(ENVIRONMENT_VARIABLE_NAMES.map(name => [
      name,
      typeof env[name] === 'string' && env[name]!.trim().length > 0 ? 'present' : 'missing',
    ])),
  };
}
