import assert from 'node:assert/strict';
import test from 'node:test';
import { getConfig } from '../backend/config.ts';

test('configuração aplica defaults sem transformar valores vazios em limites zero', () => {
  const config = getConfig({
    NODE_ENV: 'production',
    APP_ORIGINS: '',
    CHAT_RATE_LIMIT_PER_MINUTE: '',
    CHAT_RATE_LIMIT_PER_DAY: '0',
    GEMINI_TIMEOUT_MS: '0',
  });

  assert.deepEqual(config.appOrigins, []);
  assert.equal(config.chatPerMinute, 10);
  assert.equal(config.chatPerDay, 100);
  assert.equal(config.geminiTimeoutMs, 45_000);
});

test('configuração mantém origens locais no desenvolvimento e limita variáveis a estados', () => {
  const config = getConfig({ NODE_ENV: 'development', GEMINI_API_KEY: 'test-secret-placeholder' });

  assert.deepEqual(config.appOrigins, ['http://localhost:5173', 'http://localhost:3000']);
  assert.equal(config.envVarStatus.GEMINI_API_KEY, 'present');
  assert.equal(JSON.stringify(config.envVarStatus).includes('test-secret-placeholder'), false);
});
