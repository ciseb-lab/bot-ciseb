import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AuthenticationError,
  readBearerToken,
  verifySupabaseAccessToken,
} from '../backend/supabaseAuth.ts';

test('bearer token parser handles missing and malformed headers', () => {
  assert.equal(readBearerToken('Bearer token-placeholder'), 'token-placeholder');
  assert.equal(readBearerToken(undefined), '');
  assert.equal(readBearerToken('Basic token-placeholder'), '');
});

test('Supabase verification rejects a missing token before any network call', async () => {
  await assert.rejects(
    verifySupabaseAccessToken('', { supabaseUrl: '', supabaseAnonKey: '' }),
    (error: unknown) => error instanceof AuthenticationError && error.status === 401,
  );
});

test('Supabase verification gives a clear unavailable error without configuration', async () => {
  await assert.rejects(
    verifySupabaseAccessToken('token-placeholder', { supabaseUrl: '', supabaseAnonKey: '' }),
    (error: unknown) => error instanceof AuthenticationError && error.status === 503,
  );
});
