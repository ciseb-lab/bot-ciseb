import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyConversationDocumentId } from '../src/data/legacyConversationId.ts';

test('IDs do histórico legado são determinísticos e seguros como IDs de documento', () => {
  const first = legacyConversationDocumentId('chat-1730000000000-a1b2c3');
  assert.equal(first, legacyConversationDocumentId('chat-1730000000000-a1b2c3'));
  assert.match(first, /^legacy-[0-9a-f]+$/);
  assert.notEqual(first, legacyConversationDocumentId('chat-1730000000001-a1b2c3'));
});
