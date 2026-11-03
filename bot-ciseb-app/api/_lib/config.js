export const ENVIRONMENT_VARIABLE_NAMES = [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_PROJECT_ID',
  'GEMINI_API_KEY',
  'APP_ORIGINS',
  'APP_CHECK_REQUIRED',
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
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_API_BASE_URL',
  'VITE_FIREBASE_APP_CHECK_ENABLED',
  'VITE_FIREBASE_APP_CHECK_SITE_KEY',
];

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getConfig(env = process.env) {
  return {
    environment: env.VERCEL_ENV || env.NODE_ENV || 'development',
    appOrigins: (env.APP_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    firebaseProjectId: env.FIREBASE_PROJECT_ID
      || env.GOOGLE_CLOUD_PROJECT
      || env.GCLOUD_PROJECT
      || '',
    geminiTimeoutMs: positiveInteger(env.GEMINI_TIMEOUT_MS, 45_000),
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
      typeof env[name] === 'string' && env[name].trim().length > 0 ? 'present' : 'missing',
    ])),
  };
}
