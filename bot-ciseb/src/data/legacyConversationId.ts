export function legacyConversationDocumentId(localConversationId: string): string {
  const encoded = Array.from(new TextEncoder().encode(localConversationId))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return `legacy-${encoded}`;
}
