import {
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore/lite';
import type { Message } from '../components/ChatView.tsx';
import { getFirestoreDatabase } from '../firebase/client.ts';
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

async function getFirestoreContext() {
  const [database, firestoreSdk] = await Promise.all([
    getFirestoreDatabase(),
    import('firebase/firestore/lite'),
  ]);
  if (!database) throw new Error('O Firestore não está configurado neste ambiente.');
  return { database, firestoreSdk };
}

function getConversationRef(
  database: Firestore,
  firestoreSdk: typeof import('firebase/firestore/lite'),
  uid: string,
  conversationId: string,
) {
  return firestoreSdk.doc(database, 'users', uid, 'conversations', conversationId);
}

function toSummary(id: string, data: DocumentData): StoredConversationSummary {
  const updatedAt = typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : Date.now();
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
  const { database, firestoreSdk } = await getFirestoreContext();
  const conversationsRef = firestoreSdk.collection(database, 'users', uid, 'conversations');
  const pageQuery = firestoreSdk.query(
    conversationsRef,
    firestoreSdk.orderBy('updatedAt', 'desc'),
    ...(cursor ? [firestoreSdk.startAfter(cursor)] : []),
    firestoreSdk.limit(pageSize),
  );
  const snapshot = await firestoreSdk.getDocs(pageQuery);
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
  const { database, firestoreSdk } = await getFirestoreContext();
  const messagesRef = firestoreSdk.collection(
    getConversationRef(database, firestoreSdk, uid, conversationId),
    'messages',
  );
  const constraints = [
    ...(beforeSequence === undefined ? [] : [firestoreSdk.where('sequence', '<', beforeSequence)]),
    firestoreSdk.orderBy('sequence', 'desc'),
    firestoreSdk.limit(pageSize),
  ];
  const snapshot = await firestoreSdk.getDocs(firestoreSdk.query(messagesRef, ...constraints));
  const messages = snapshot.docs.map(item => {
    const data = item.data();
    const createdAt = typeof data.createdAt?.toDate === 'function' ? data.createdAt.toDate() : new Date();
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
  const { database, firestoreSdk } = await getFirestoreContext();
  const conversationRef = getConversationRef(database, firestoreSdk, uid, conversationId);
  const messageRef = firestoreSdk.doc(
    firestoreSdk.collection(conversationRef, 'messages'),
    message.id,
  );

  await firestoreSdk.runTransaction(database, async transaction => {
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
      createdAt: existing?.createdAt || firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    }, { merge: true });
    transaction.set(messageRef, {
      role: message.role,
      content: message.content.slice(0, 12_000),
      sequence,
      createdAt: firestoreSdk.serverTimestamp(),
      groundedDocuments: (message.groundedDocuments || []).slice(0, 5).map(reference => ({
        source: reference.source,
        title: reference.title,
        ...(reference.pageNumber ? { pageNumber: reference.pageNumber } : {}),
      })),
    });
  });
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  const { database, firestoreSdk } = await getFirestoreContext();
  const conversationRef = getConversationRef(database, firestoreSdk, uid, conversationId);
  const messagesRef = firestoreSdk.collection(conversationRef, 'messages');
  while (true) {
    const page = await firestoreSdk.getDocs(firestoreSdk.query(
      messagesRef,
      firestoreSdk.orderBy('sequence', 'asc'),
      firestoreSdk.limit(400),
    ));
    if (page.empty) break;
    const batch = firestoreSdk.writeBatch(database);
    page.docs.forEach(message => batch.delete(message.ref));
    await batch.commit();
    if (page.size < 400) break;
  }
  await firestoreSdk.deleteDoc(conversationRef);
}

export async function importLegacyConversations(uid: string, conversations: Array<{ id: string; title: string; messages: Message[]; updatedAt: number }>): Promise<void> {
  const { database, firestoreSdk } = await getFirestoreContext();
  for (const legacy of conversations) {
    const id = legacyConversationDocumentId(legacy.id);
    const conversationRef = firestoreSdk.doc(database, 'users', uid, 'conversations', id);
    if ((await firestoreSdk.getDoc(conversationRef)).exists()) continue;
    const batch = firestoreSdk.writeBatch(database);
    const messages = legacy.messages.slice(-100);
    batch.set(conversationRef, {
      title: legacy.title.slice(0, 100),
      schemaVersion: 1,
      messageCount: messages.length,
      createdAt: firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    });
    messages.forEach((message, sequence) => {
      const messageRef = firestoreSdk.doc(
        firestoreSdk.collection(conversationRef, 'messages'),
        `legacy-${sequence}`,
      );
      batch.set(messageRef, {
        role: message.role,
        content: message.content.slice(0, 12_000),
        sequence,
        createdAt: firestoreSdk.serverTimestamp(),
        groundedDocuments: (message.groundedDocuments || []).slice(0, 5),
      });
    });
    await batch.commit();
  }
}
