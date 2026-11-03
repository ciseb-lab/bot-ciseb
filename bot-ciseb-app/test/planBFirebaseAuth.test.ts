import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { AuthenticationError, readBearerToken, verifyFirebaseIdToken } from '../api/_lib/firebaseAuth.ts';
import authCheckHandler from '../api/auth/check.ts';

const projectId = 'ciseb-test-project';
const config = { firebaseProjectId: projectId };

async function createToken(
  overrides: Record<string, unknown> = {},
  expiration: string | number = '1h',
) {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test-key';
  jwk.alg = 'RS256';
  jwk.use = 'sig';
  const token = await new SignJWT({
    email: 'teste@seduc.pa.gov.br',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setSubject('test-user')
    .setIssuer(`https://securetoken.google.com/${projectId}`)
    .setAudience(projectId)
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(privateKey);
  return { token, keySet: createLocalJWKSet({ keys: [jwk] }) };
}

test('Firebase ID token válido retorna apenas a identidade mínima', async () => {
  const { token, keySet } = await createToken();
  assert.deepEqual(await verifyFirebaseIdToken(token, config, keySet), {
    uid: 'test-user',
    email: 'teste@seduc.pa.gov.br',
  });
});

test('rejeita token expirado e token com assinatura inválida', async () => {
  const expired = await createToken({}, Math.floor(Date.now() / 1000) - 3600);
  await assert.rejects(
    verifyFirebaseIdToken(expired.token, config, expired.keySet),
    (error: unknown) => error instanceof AuthenticationError && error.status === 401,
  );

  const invalid = await createToken();
  const otherKey = await generateKeyPair('RS256');
  const invalidSignatureToken = await new SignJWT({
    email: 'teste@seduc.pa.gov.br',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setSubject('test-user')
    .setIssuer(`https://securetoken.google.com/${projectId}`)
    .setAudience(projectId)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(otherKey.privateKey);
  await assert.rejects(
    verifyFirebaseIdToken(invalidSignatureToken, config, invalid.keySet),
    (error: unknown) => error instanceof AuthenticationError && error.status === 401,
  );
});

test('rejeita identidade não institucional e configuração ausente', async () => {
  const { token, keySet } = await createToken({ email: 'teste@example.com' });
  await assert.rejects(
    verifyFirebaseIdToken(token, config, keySet),
    (error: unknown) => error instanceof AuthenticationError && error.status === 403,
  );
  await assert.rejects(
    verifyFirebaseIdToken('token', { firebaseProjectId: '' }, keySet),
    (error: unknown) => error instanceof AuthenticationError && error.status === 503,
  );
});

test('extrai token Bearer sem registrar nem alterar seu conteúdo', () => {
  assert.equal(readBearerToken('Bearer token-de-teste'), 'token-de-teste');
  assert.equal(readBearerToken(undefined), '');
  assert.equal(readBearerToken('Basic token-de-teste'), '');
});

test('endpoint de verificação em Preview retorna 401 sem token ou com token malformado', async () => {
  const originalEnvironment = process.env.VERCEL_ENV;
  const originalProjectId = process.env.FIREBASE_PROJECT_ID;
  process.env.VERCEL_ENV = 'preview';
  process.env.FIREBASE_PROJECT_ID = projectId;
  const createResponse = () => ({
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    json(value: unknown) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  });

  try {
    const missingResponse = createResponse();
    await authCheckHandler({ method: 'GET', headers: {} }, missingResponse);
    assert.equal(missingResponse.statusCode, 401);

    const invalidResponse = createResponse();
    await authCheckHandler({
      method: 'GET',
      headers: { authorization: 'Bearer not-a-jwt' },
    }, invalidResponse);
    assert.equal(invalidResponse.statusCode, 401);
  } finally {
    if (originalEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalEnvironment;
    if (originalProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = originalProjectId;
  }
});
