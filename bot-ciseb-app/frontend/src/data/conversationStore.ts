import type { Message } from '../components/ChatView.tsx';
import { supabase } from '../supabase/client.ts';

export interface StoredConversationSummary {
  id: string;
  title: string;
  timestamp: string;
  updatedAt: number;
  messageCount: number;
}

export interface ConversationCursor {
  id: string;
  updatedAt: string;
}

export interface ConversationPage {
  conversations: StoredConversationSummary[];
  cursor?: ConversationCursor;
}

function requireSupabase() {
  if (!supabase) throw new Error('O Supabase não está configurado neste ambiente.');
  return supabase;
}

async function assertCurrentUser(uid: string): Promise<void> {
  const client = requireSupabase();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user || user.id !== uid) throw new Error('A sessão não corresponde à conta solicitada.');
}

function toSummary(row: {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}): StoredConversationSummary {
  return {
    id: row.id,
    title: row.title || 'Conversa',
    timestamp: 'Histórico',
    updatedAt: Date.parse(row.updated_at),
    messageCount: Number.isInteger(row.message_count) ? row.message_count : 0,
  };
}

export async function listConversations(
  uid: string,
  pageSize = 20,
  cursor?: ConversationCursor,
): Promise<ConversationPage> {
  await assertCurrentUser(uid);
  const client = requireSupabase();
  let query = client.from('conversations')
    .select('id,title,updated_at,message_count')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize);
  if (cursor) {
    query = query.or(`updated_at.lt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.lt.${cursor.id})`);
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const last = rows.at(-1);
  return {
    conversations: rows.map(toSummary),
    ...(last ? { cursor: { id: last.id, updatedAt: last.updated_at } } : {}),
  };
}

export async function getMessagePage(
  uid: string,
  conversationId: string,
  pageSize = 50,
  beforeSequence?: number,
): Promise<{ messages: Message[]; hasMore: boolean }> {
  await assertCurrentUser(uid);
  const client = requireSupabase();
  let query = client.from('conversation_messages')
    .select('id,sequence,role,content,created_at,grounded_documents')
    .eq('user_id', uid)
    .eq('conversation_id', conversationId)
    .order('sequence', { ascending: false })
    .limit(pageSize);
  if (beforeSequence !== undefined) query = query.lt('sequence', beforeSequence);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const messages = rows.map(row => ({
    id: row.id,
    sequence: row.sequence,
    role: row.role === 'user' ? 'user' as const : 'assistant' as const,
    content: row.content || '',
    timestamp: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '',
    groundedDocuments: Array.isArray(row.grounded_documents) ? row.grounded_documents : [],
  } satisfies Message)).reverse();
  return { messages, hasMore: rows.length === pageSize };
}

export async function persistMessage(
  uid: string,
  conversationId: string,
  title: string,
  message: Message,
): Promise<void> {
  await assertCurrentUser(uid);
  const client = requireSupabase();
  const { error } = await client.rpc('persist_conversation_message', {
    p_conversation_id: conversationId,
    p_title: title.slice(0, 100),
    p_message_id: message.id,
    p_role: message.role,
    p_content: message.content.slice(0, 12_000),
    p_grounded_documents: (message.groundedDocuments || []).slice(0, 5).map(reference => ({
      source: reference.source,
      title: reference.title,
      ...(reference.pageNumber ? { pageNumber: reference.pageNumber } : {}),
    })),
  });
  if (error) throw error;
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  await assertCurrentUser(uid);
  const client = requireSupabase();
  const { error } = await client.from('conversations')
    .delete()
    .eq('user_id', uid)
    .eq('id', conversationId);
  if (error) throw error;
}

export async function importLegacyConversations(
  uid: string,
  conversations: Array<{ id: string; title: string; messages: Message[]; updatedAt: number }>,
): Promise<void> {
  for (const legacy of conversations) {
    for (const message of legacy.messages.slice(-100)) {
      await persistMessage(uid, legacy.id, legacy.title, message);
    }
  }
}
