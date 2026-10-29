import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { createRateLimitMiddleware, hasVerifiedInstitutionalIdentity, isKnownInvalidIdTokenError, validateChatPayload, validatePdfPayload, validateCurriculumQuery } from '../backend/security.ts';

function createResponse() {
  const headers = new Map<string, string>();
  const result = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
  };
  return { response: result as unknown as Response, result, headers };
}

function invokeValidator(validator: typeof validateChatPayload | typeof validatePdfPayload, body: unknown) {
  const { response, result } = createResponse();
  let continued = false;
  validator(
    { body } as Request,
    response,
    (() => { continued = true; }) as NextFunction,
  );
  return { result, continued };
}

describe('Validação de requisições e limites', () => {
  test('distingue tokens inválidos de falhas de infraestrutura do Firebase Auth', () => {
    assert.equal(isKnownInvalidIdTokenError({ code: 'auth/id-token-expired' }), true);
    assert.equal(isKnownInvalidIdTokenError({ code: 'auth/id-token-revoked' }), true);
    assert.equal(isKnownInvalidIdTokenError({ code: 'auth/insufficient-permission' }), false);
    assert.equal(isKnownInvalidIdTokenError(new Error('falha de rede')), false);
  });

  test('só considera válida identidade autenticada, verificada e do domínio exato', () => {
    assert.equal(hasVerifiedInstitutionalIdentity({
      uid: 'user-1',
      email: 'person@escola.seduc.pa.gov.br',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }), true);
    assert.equal(hasVerifiedInstitutionalIdentity({
      uid: 'user-2',
      email: 'person@seduc.pa.gov.br',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }), true);
    assert.equal(hasVerifiedInstitutionalIdentity({
      uid: 'user-1',
      email: 'person@escola.seduc.pa.gov.br',
      email_verified: false,
      firebase: { sign_in_provider: 'google.com' },
    }), false);
    assert.equal(hasVerifiedInstitutionalIdentity({
      uid: 'user-1',
      email: 'person@seduc.pa.gov.br',
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    }), false);
    assert.equal(hasVerifiedInstitutionalIdentity({
      uid: 'user-1',
      email: 'person@outro.gov.br',
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    }), false);
  });

  test('rejeita mensagens inválidas antes de avançar ao rate limiter', () => {
    const empty = invokeValidator(validateChatPayload, { message: '  ' });
    assert.equal(empty.result.statusCode, 400);
    assert.equal(empty.continued, false);

    const oversized = invokeValidator(validateChatPayload, { message: 'x'.repeat(4001) });
    assert.equal(oversized.result.statusCode, 413);
    assert.equal(oversized.continued, false);

    const valid = invokeValidator(validateChatPayload, { message: '  pergunta válida  ' });
    assert.equal(valid.result.statusCode, 200);
    assert.equal(valid.continued, true);
  });

  test('rejeita material PDF ausente ou acima do limite antes de contabilizar uso', () => {
    const missing = invokeValidator(validatePdfPayload, { title: '', content: '' });
    assert.equal(missing.result.statusCode, 400);
    assert.equal(missing.continued, false);

    const oversized = invokeValidator(validatePdfPayload, { title: 'Plano', content: 'á'.repeat(75_001) });
    assert.equal(oversized.result.statusCode, 413);
    assert.equal(oversized.continued, false);
  });

  test('rejeita filtros curriculares com valores repetidos ou excessivos', () => {
    const { response, result } = createResponse();
    let continued = false;
    validateCurriculumQuery(
      { query: { stage: ['EF'] } } as unknown as Request,
      response,
      (() => { continued = true; }) as NextFunction,
    );
    assert.equal(result.statusCode, 400);
    assert.equal(continued, false);
  });

  test('retorna 429 e Retry-After sem expor o identificador do usuário', async () => {
    const { response, result, headers } = createResponse();
    let continued = false;
    const middleware = createRateLimitMiddleware(
      { scope: 'test', uidMinuteLimit: 1, ipMinuteLimit: 1 },
      async attempt => {
        assert.equal(attempt.identity.uid, 'uid-private');
        return { allowed: false, retryAfterSeconds: 23 };
      },
    );
    await middleware(
      { identity: { uid: 'uid-private', email: 'person@escola.seduc.pa.gov.br' }, socket: { remoteAddress: '127.0.0.1' } } as Request,
      response,
      (() => { continued = true; }) as NextFunction,
    );

    assert.equal(result.statusCode, 429);
    assert.equal(headers.get('Retry-After'), '23');
    assert.ok(headers.has('X-RateLimit-Reset'));
    assert.equal(JSON.stringify(result.body).includes('uid-private'), false);
    assert.equal(continued, false);
  });
});
