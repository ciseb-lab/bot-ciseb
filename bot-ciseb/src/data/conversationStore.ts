import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Message } from '../components/ChatView.tsx';
import { firestore } from '../firebase/client.ts';
import { legacyConversationDocumentId } from './legacyConversationId.ts';

export interface StoredConversationSummary {
  id: string;
  title: string;
  timestamp: string;
  updatedAt: number;
  messageCount: number;
}

export interface ConversationPage {
  conversations: StoredConversationSummary[];
  cursor?: QueryDocumentSnapshot<DocumentData>;
}

function requireFirestore() {
  if (!firestore) throw new Error('O Firestore não está configurado neste ambiente.');
  return firestore;
}

function getConversationRef(uid: string, conversationId: string) {
  return doc(requireFirestore(), 'users', uid, 'conversations', conversationId);
}

function toSummary(id: string, data: DocumentData): StoredConversationSummary {
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now();
  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Conversa',
    timestamp: 'Histórico',
    updatedAt,
    messageCount: Number.isInteger(data.messageCount) ? data.messageCount : 0,
  };
}

export async function listConversations(
  uid: string,
  pageSize = 20,
  cursor?: QueryDocumentSnapshot<DocumentData>,
): Promise<ConversationPage> {
  const conversationsRef = collection(requireFirestore(), 'users', uid, 'conversations');
  const pageQuery = query(conversationsRef, orderBy('updatedAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(pageSize));
  const snapshot = await getDocs(pageQuery);
  return {
    conversations: snapshot.docs.map(item => toSummary(item.id, item.data())),
    cursor: snapshot.docs.at(-1),
  };
}

export async function getMessagePage(
  uid: string,
  conversationId: string,
  pageSize = 50,
  beforeSequence?: number,
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const messagesRef = collection(getConversationRef(uid, conversationId), 'messages');
  const constraints = [
    ...(beforeSequence === undefined ? [] : [where('sequence', '<', beforeSequence)]),
    orderBy('sequence', 'desc'),
    limit(pageSize),
  ];
  const snapshot = await getDocs(query(messagesRef, ...constraints));
  const messages = snapshot.docs.map(item => {
    const data = item.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
    return {
      id: item.id,
      sequence: data.sequence,
      role: data.role === 'user' ? 'user' : 'assistant',
      content: typeof data.content === 'string' ? data.content : '',
      timestamp: createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      groundedDocuments: Array.isArray(data.groundedDocuments) ? data.groundedDocuments : [],
    } satisfies Message;
  }).reverse();
  return { messages, hasMore: snapshot.size === pageSize };
}

export async function persistMessage(uid: string, conversationId: string, title: string, message: Message): Promise<void> {
  const database = requireFirestore();
  const conversationRef = doc(database, 'users', uid, 'conversations', conversationId);
  const messageRef = doc(collection(conversationRef, 'messages'), message.id);

  await runTransaction(database, async transaction => {
    const conversationSnapshot = await transaction.get(conversationRef);
    if (!conversationSnapshot.exists() && message.role !== 'user') {
      throw new Error('A conversa precisa começar com uma mensagem do usuário.');
    }
    const existing = conversationSnapshot.data();
    const sequence = typeof existing?.messageCount === 'number' && Number.isInteger(existing.messageCount) ? existing.messageCount : 0;
    transaction.set(conversationRef, {
      title: existing?.title || title.slice(0, 100),
      schemaVersion: 1,
      messageCount: sequence + 1,
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(messageRef, {
      role: message.role,
      content: message.content.slice(0, 12_000),
      sequence,
      createdAt: serverTimestamp(),
      groundedDocuments: (message.groundedDocuments || []).slice(0, 5).map(reference => ({
        source: reference.source,
        title: reference.title,
        ...(reference.pageNumber ? { pageNumber: reference.pageNumber } : {}),
      })),
    });
  });
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  const conversationRef = getConversationRef(uid, conversationId);
  const messagesRef = collection(conversationRef, 'messages');
  while (true) {
    const page = await getDocs(query(messagesRef, orderBy('sequence', 'asc'), limit(400)));
    if (page.empty) break;
    const batch = writeBatch(requireFirestore());
    page.docs.forEach(message => batch.delete(message.ref));
    await batch.commit();
    if (page.size < 400) break;
  }
  await deleteDoc(conversationRef);
}

export async function importLegacyConversations(uid: string, conversations: Array<{ id: string; title: string; messages: Message[]; updatedAt: number }>): Promise<void> {
  const database = requireFirestore();
  for (const legacy of conversations) {
    const id = legacyConversationDocumentId(legacy.id);
    const conversationRef = doc(database, 'users', uid, 'conversations', id);
    if ((await getDoc(conversationRef)).exists()) continue;
    const batch = writeBatch(database);
    const messages = legacy.messages.slice(-100);
    batch.set(conversationRef, {
      title: legacy.title.slice(0, 100),
      schemaVersion: 1,
      messageCount: messages.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    messages.forEach((message, sequence) => {
      const messageRef = doc(collection(conversationRef, 'messages'), `legacy-${sequence}`);
      batch.set(messageRef, {
        role: message.role,
        content: message.content.slice(0, 12_000),
        sequence,
        createdAt: serverTimestamp(),
        groundedDocuments: (message.groundedDocuments || []).slice(0, 5),
      });
    });
    await batch.commit();
  }
}
