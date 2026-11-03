import assert from 'node:assert/strict';
import test from 'node:test';
import { getConfig } from '../api/_lib/config.js';
import healthHandler from '../api/health.ts';
import envHandler from '../api/health/env.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('configuração usa defaults sensatos para variáveis ausentes ou vazias', () => {
  const config = getConfig({
    APP_ORIGINS: '',
    CHAT_RATE_LIMIT_PER_MINUTE: '',
    GEMINI_TIMEOUT_MS: '0',
  });
  assert.deepEqual(config.appOrigins, []);
  assert.equal(config.chatPerMinute, 10);
  assert.equal(config.geminiTimeoutMs, 45_000);
});

test('health responde sem importar o backend antigo e bloqueia origem não permitida', () => {
  const allowedResponse = mockResponse();
  healthHandler({ method: 'GET', headers: {} }, allowedResponse);
  assert.equal(allowedResponse.statusCode, 200);
  assert.deepEqual(allowedResponse.body, { status: 'ok' });

  const deniedResponse = mockResponse();
  healthHandler({ method: 'GET', headers: { origin: 'https://not-allowed.example' } }, deniedResponse);
  assert.equal(deniedResponse.statusCode, 403);
});

test('endpoint de ambiente informa somente presença e existe apenas em preview', () => {
  const previewResponse = mockResponse();
  const originalEnvironment = process.env.VERCEL_ENV;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  process.env.VERCEL_ENV = 'preview';
  process.env.GEMINI_API_KEY = 'test-secret-placeholder';
  try {
    envHandler({ method: 'GET', headers: {} }, previewResponse);
    assert.equal(previewResponse.statusCode, 200);
    assert.equal(previewResponse.body.variables.GEMINI_API_KEY, 'present');
    assert.equal(JSON.stringify(previewResponse.body).includes('test-secret-placeholder'), false);
  } finally {
    if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment;
    if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGeminiKey;
  }

  const productionResponse = mockResponse();
  process.env.VERCEL_ENV = 'production';
  try {
    envHandler({ method: 'GET', headers: {} }, productionResponse);
  } finally {
    if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment;
  }
  assert.equal(productionResponse.statusCode, 404);
});
