import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

test('Firebase Admin JWKS helper loads jose through CommonJS', async () => {
  const { retrieveSigningKeys } = require('jwks-rsa/src/utils.js') as {
    retrieveSigningKeys: (jwks: Array<Record<string, unknown>>) => Promise<Array<{ kid?: string; getPublicKey(): string }>>;
  };
  const publicKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ format: 'jwk' });
  const keys = await retrieveSigningKeys([{ ...publicKey, kid: 'test-key', use: 'sig', alg: 'RS256' }]);

  assert.equal(keys.length, 1);
  assert.equal(keys[0].kid, 'test-key');
  assert.match(keys[0].getPublicKey(), /BEGIN PUBLIC KEY/);
});
