import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore/lite';
import { X } from 'lucide-react';
import { apiFetch, readApiJson } from './utils/api.ts';
import { useAuth } from './auth/AuthContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Sidebar, ChatSession } from './components/Sidebar.tsx';
import type { GroundedDocumentReference, Message } from './components/ChatView.tsx';
import { CurriculumSkill } from '../../shared/curriculumData.ts';
import { useModalFocus } from './hooks/useModalFocus.ts';

const DocsModal = lazy(() => import('./components/DocsModal.tsx').then(module => ({ default: module.DocsModal })));
const ChatView = lazy(() => import('./components/ChatView.tsx').then(module => ({ default: module.ChatView })));
const QuickPlanWizard = lazy(() => import('./components/QuickPlanWizard.tsx').then(module => ({ default: module.QuickPlanWizard })));
const PdfExportModal = lazy(() => import('./components/PdfExportModal.tsx').then(module => ({ default: module.PdfExportModal })));
const CurriculumBrowser = lazy(() => import('./components/CurriculumBrowser.tsx').then(module => ({ default: module.CurriculumBrowser })));

interface ChatConversation extends ChatSession {
  messages: Message[];
  updatedAt: number;
  messageCount: number;
}

interface PdfDraft {
  title: string;
  content: string;
}

const CONVERSATIONS_STORAGE_KEY = 'bot-ciseb:conversations:v1';
const MAX_SAVED_CONVERSATIONS = 30;
const MAX_SAVED_MESSAGES = 100;

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<Message>;
  return typeof message.id === 'string'
    && (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string'
    && typeof message.timestamp === 'string';
}

function loadConversations(): ChatConversation[] {
  try {
    const saved = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is ChatConversation => {
        if (!item || typeof item !== 'object') return false;
        const conversation = item as Partial<ChatConversation>;
        return typeof conversation.id === 'string'
          && conversation.id.length <= 256
          && typeof conversation.title === 'string'
          && conversation.title.length <= 100
          && Array.isArray(conversation.messages)
          && conversation.messages.every(isMessage);
      })
      .map(conversation => ({
        ...conversation,
        messages: conversation.messages.slice(-MAX_SAVED_MESSAGES),
        updatedAt: Number.isFinite(conversation.updatedAt) ? conversation.updatedAt : 0,
      }))
      .sort((first, second) => second.updatedAt - first.updatedAt)
      .slice(0, MAX_SAVED_CONVERSATIONS);
  } catch {
    return [];
  }
}

function loadLegacyConversationsForUser(uid: string): ChatConversation[] {
  try {
    if (localStorage.getItem(`bot-ciseb:local-history-imported:v1:${uid}`) === 'true') return [];
  } catch {
    return [];
  }
  return loadConversations();
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 text-sm text-white" role="status" aria-live="polite">
      Carregando…
    </div>
  );
}

function createMessage(role: Message['role'], content: string, extras: Partial<Message> = {}): Message {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: formatTimestamp(),
    ...extras,
  };
}

function getPdfDraft(message: Message): PdfDraft {
  const references = message.groundedDocuments || [];
  const referenceSection = references.length > 0
    ? `\n\n## Referências documentais consultadas\n${references.map(reference => {
        const page = reference.pageNumber ? `, PDF p. ${reference.pageNumber}` : '';
        return `- ${reference.title}${page}`;
      }).join('\n')}`
    : '';

  return {
    title: message.content.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim() || 'Material de apoio',
    content: `${message.content}${referenceSection}`,
  };
}

export default function App() {
  const { configured, loading, user, initializationError, profileSyncError } = useAuth();
  if (loading) return <main className="flex min-h-dvh items-center justify-center bg-[#f2f6fa] text-sm text-slate-500">Restaurando sua sessão institucional…</main>;
  if (!configured || !user || !user.emailVerified) return <LoginScreen />;
  return (
    <div className="relative h-dvh">
      {(initializationError || profileSyncError) && <p role="alert" className="absolute inset-x-3 top-3 z-50 mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow">{initializationError || profileSyncError}</p>}
      <AuthenticatedApp key={user.uid} user={user} />
    </div>
  );
}

function AuthenticatedApp({ user }: { user: User }) {
  const { logout } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [legacyConversations] = useState(() => loadLegacyConversationsForUser(user.uid));
  const [legacyConversationCount, setLegacyConversationCount] = useState(legacyConversations.length);
  const [isImportingLegacy, setIsImportingLegacy] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isLoadingConversationMessages, setIsLoadingConversationMessages] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
  const loadedConversationIds = useRef(new Set<string>());
  const [activeSessionId, setActiveSessionId] = useState('draft');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isLoading, setIsLoading] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isPlanBuilderOpen, setIsPlanBuilderOpen] = useState(false);
  const [pdfDraft, setPdfDraft] = useState<PdfDraft | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const curriculumDialogRef = useModalFocus<HTMLDivElement>(
    isCurriculumOpen,
    () => setIsCurriculumOpen(false),
  );
  const planBuilderDialogRef = useModalFocus<HTMLDivElement>(
    isPlanBuilderOpen,
    () => setIsPlanBuilderOpen(false),
  );

  const activeConversation = useMemo(
    () => conversations.find(conversation => conversation.id === activeSessionId),
    [activeSessionId, conversations],
  );
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    try {
      void conversations;
    } catch (error) {
      console.warn('Não foi possível salvar o histórico deste navegador.', error);
    }
  }, [conversations]);

  useEffect(() => {
    let active = true;
    setIsHistoryLoading(true);
    import('./data/conversationStore.ts')
      .then(({ listConversations }) => listConversations(user.uid))
      .then(page => {
        if (!active) return;
        cursorRef.current = page.cursor;
        setConversations(page.conversations.map(conversation => ({ ...conversation, messages: [] })));
        setHasMoreConversations(page.conversations.length === 20);
        setActiveSessionId(current => current.startsWith('draft') && page.conversations.length > 0 ? page.conversations[0].id : current);
      })
      .catch(() => {
        if (active) setHistoryError('Não foi possível carregar seu histórico. Verifique a conexão e tente novamente.');
      })
      .finally(() => { if (active) setIsHistoryLoading(false); });
    return () => { active = false; };
  }, [user.uid]);

  useEffect(() => {
    if (!activeSessionId || activeSessionId.startsWith('draft') || loadedConversationIds.current.has(activeSessionId)) return;
    let active = true;
    setIsLoadingConversationMessages(true);
    setHasOlderMessages(false);
    import('./data/conversationStore.ts')
      .then(({ getMessagePage }) => getMessagePage(user.uid, activeSessionId))
      .then(page => {
        if (!active) return;
        loadedConversationIds.current.add(activeSessionId);
        setConversations(previous => previous.map(conversation => conversation.id === activeSessionId
          ? { ...conversation, messages: page.messages }
          : conversation));
        setHasOlderMessages(page.hasMore);
      })
      .catch(() => { if (active) setHistoryError('Não foi possível carregar as mensagens desta conversa. Tente selecioná-la novamente.'); })
      .finally(() => { if (active) setIsLoadingConversationMessages(false); });
    return () => { active = false; };
  }, [activeSessionId, user.uid]);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(`draft-${Date.now()}`);
    setHasOlderMessages(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        handleNewChat();
      }
      if (event.key === 'Escape') {
        setIsDocsOpen(false);
        setIsCurriculumOpen(false);
        setIsPlanBuilderOpen(false);
        setPdfDraft(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const selected = conversations.find(conversation => conversation.id === id);
    setHasOlderMessages(Boolean(selected && selected.messageCount > selected.messages.length));
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleLoadMoreConversations = async () => {
    if (!cursorRef.current || isLoadingMoreConversations) return;
    setIsLoadingMoreConversations(true);
    try {
      const { listConversations } = await import('./data/conversationStore.ts');
      const page = await listConversations(user.uid, 20, cursorRef.current);
      cursorRef.current = page.cursor;
      setConversations(previous => {
        const existingIds = new Set(previous.map(conversation => conversation.id));
        return [...previous, ...page.conversations.filter(conversation => !existingIds.has(conversation.id)).map(conversation => ({ ...conversation, messages: [] }))];
      });
      setHasMoreConversations(page.conversations.length === 20);
    } catch {
      setHistoryError('Não foi possível carregar mais conversas. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoadingMoreConversations(false);
    }
  };

  const handleLoadOlderMessages = async () => {
    const firstSequence = messages[0]?.sequence;
    if (firstSequence === undefined || isLoadingOlderMessages) return;
    setIsLoadingOlderMessages(true);
    try {
      const { getMessagePage } = await import('./data/conversationStore.ts');
      const page = await getMessagePage(user.uid, activeSessionId, 50, firstSequence);
      setConversations(previous => previous.map(conversation => conversation.id === activeSessionId
        ? { ...conversation, messages: [...page.messages, ...conversation.messages] }
        : conversation));
      setHasOlderMessages(page.hasMore);
    } catch {
      setHistoryError('Não foi possível carregar as mensagens anteriores. Tente novamente.');
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const handleImportLegacy = async () => {
    if (isImportingLegacy || legacyConversationCount === 0) return;
    if (!window.confirm(`Importar ${legacyConversationCount} conversa(s) deste navegador para a conta ${user.email || 'atual'}? O histórico local será mantido como cópia.`)) return;
    setIsImportingLegacy(true);
    setHistoryError(null);
    try {
      const { importLegacyConversations, listConversations } = await import('./data/conversationStore.ts');
      await importLegacyConversations(user.uid, legacyConversations);
      const page = await listConversations(user.uid);
      cursorRef.current = page.cursor;
      loadedConversationIds.current.clear();
      setConversations(page.conversations.map(conversation => ({ ...conversation, messages: [] })));
      setHasMoreConversations(page.conversations.length === 20);
      setActiveSessionId(page.conversations[0]?.id || 'draft');
      localStorage.setItem(`bot-ciseb:local-history-imported:v1:${user.uid}`, 'true');
      setLegacyConversationCount(0);
    } catch {
      setHistoryError('Não foi possível importar o histórico antigo. Os dados locais continuam preservados; tente novamente.');
    } finally {
      setIsImportingLegacy(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!window.confirm('Excluir esta conversa e todas as mensagens salvas na sua conta?')) return;
    try {
      const { deleteConversation } = await import('./data/conversationStore.ts');
      await deleteConversation(user.uid, id);
      loadedConversationIds.current.delete(id);
      setConversations(previous => {
        const remaining = previous.filter(conversation => conversation.id !== id);
        if (activeSessionId === id) setActiveSessionId(remaining[0]?.id || 'draft');
        return remaining;
      });
    } catch {
      setHistoryError('Não foi possível excluir a conversa. Verifique a conexão e tente novamente.');
    }
  };

  const appendMessage = (sessionId: string, message: Message, title?: string) => {
    setConversations(previous => {
      const current = previous.find(conversation => conversation.id === sessionId);
      const nextConversation: ChatConversation = {
        id: sessionId,
        title: current?.title || title || 'Nova conversa',
        timestamp: 'Hoje',
        updatedAt: Date.now(),
        messageCount: (current?.messageCount || 0) + 1,
        messages: [...(current?.messages || []), message].slice(-MAX_SAVED_MESSAGES),
      };
      return [nextConversation, ...previous.filter(conversation => conversation.id !== sessionId)]
        .slice(0, MAX_SAVED_CONVERSATIONS);
    });
  };

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading) return;

    const currentConversation = conversations.find(conversation => conversation.id === activeSessionId);
    const sessionId = currentConversation?.id || `chat-${Date.now()}`;
    const conversationTitle = currentConversation?.title || (trimmedText.length > 48 ? `${trimmedText.slice(0, 48).trimEnd()}…` : trimmedText);
    const userMessage = createMessage('user', trimmedText);
    appendMessage(
      sessionId,
      userMessage,
      trimmedText.length > 48 ? `${trimmedText.slice(0, 48).trimEnd()}…` : trimmedText,
    );
    setActiveSessionId(sessionId);
    setIsLoading(true);
    setHistoryError(null);

    let userMessagePersisted = false;
    try {
      const { persistMessage } = await import('./data/conversationStore.ts');
      await persistMessage(user.uid, sessionId, conversationTitle, userMessage);
      userMessagePersisted = true;
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedText,
          history: (currentConversation?.messages || []).slice(-4).map(message => ({
            role: message.role,
            content: message.content.slice(-1200),
          })),
        }),
      });

      const data = await readApiJson(response);
      if (!data || typeof data !== 'object') {
        throw new Error('A API retornou uma resposta inválida.');
      }
      const result = data as {
        reply?: unknown;
        error?: unknown;
        groundedSkills?: unknown;
        groundedDocuments?: unknown;
      };
      if (!response.ok || typeof result.reply !== 'string') {
        throw new Error(typeof result.error === 'string' ? result.error : 'Não foi possível consultar o assistente.');
      }

      const assistantMessage = createMessage('assistant', result.reply, {
        groundedSkills: Array.isArray(result.groundedSkills) ? result.groundedSkills as CurriculumSkill[] : [],
        groundedDocuments: Array.isArray(result.groundedDocuments) ? result.groundedDocuments as GroundedDocumentReference[] : [],
      });
      appendMessage(sessionId, assistantMessage, conversationTitle);
      await persistMessage(user.uid, sessionId, conversationTitle, assistantMessage);
    } catch (error) {
      if (!userMessagePersisted) setHistoryError('A mensagem nao foi sincronizada. Verifique a conexao antes de tentar novamente.');
      appendMessage(sessionId, createMessage(
        'assistant',
        error instanceof Error ? error.message : 'Não foi possível completar a consulta no momento. Tente novamente.',
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPdfDraft = (message: Message) => {
    setPdfExportError(null);
    setPdfDraft(getPdfDraft(message));
  };

  const handleExportPdf = async (title: string, content: string) => {
    setIsExportingPdf(true);
    setPdfExportError(null);

    try {
      const response = await apiFetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível gerar o PDF.');
      }

      const pdfBlob = await response.blob();
      if (pdfBlob.size === 0 || pdfBlob.type !== 'application/pdf') {
        throw new Error('O servidor não retornou um arquivo PDF válido.');
      }

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'material-bot-ciseb.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setPdfDraft(null);
    } catch (error) {
      setPdfExportError(error instanceof Error ? error.message : 'Falha ao gerar o PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-white font-sans text-slate-900 antialiased">
      {sidebarOpen && window.innerWidth < 768 && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(open => !open)}
        onNewChat={handleNewChat}
        chatSessions={conversations}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteConversation}
        hasMoreConversations={hasMoreConversations}
        isLoadingMoreConversations={isLoadingMoreConversations}
        onLoadMoreConversations={handleLoadMoreConversations}
        onItemClick={item => {
          if (item === 'manual') setIsDocsOpen(true);
          if (item === 'wizard') setIsPlanBuilderOpen(true);
          if (item === 'curriculum') setIsCurriculumOpen(true);
        }}
      />
      <Suspense fallback={<main className="flex h-dvh items-center justify-center bg-[#f2f6fa] text-sm text-slate-500" role="status">Carregando conversa…</main>}>
        <ChatView
          messages={messages}
          isLoading={isLoading || isHistoryLoading || isLoadingConversationMessages}
          onSendMessage={handleSendMessage}
          onExportMessage={handleOpenPdfDraft}
          onOpenPlanBuilder={() => setIsPlanBuilderOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          userEmail={user.email || ''}
          onLogout={() => void logout()}
          historyError={historyError}
          legacyConversationCount={legacyConversationCount}
          isImportingLegacy={isImportingLegacy}
          onImportLegacy={() => void handleImportLegacy()}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          onLoadOlderMessages={() => void handleLoadOlderMessages()}
        />
      </Suspense>
      {isDocsOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <DocsModal isOpen onClose={() => setIsDocsOpen(false)} />
        </Suspense>
      )}
      {isCurriculumOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <div ref={curriculumDialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="curriculum-browser-title">
            <section className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div>
                  <h2 id="curriculum-browser-title" className="text-sm font-bold text-slate-900">Explorar registros curriculares</h2>
                  <p className="mt-1 text-xs text-slate-500">Selecione um registro para levá-lo ao chat como ponto de partida.</p>
                </div>
                <button type="button" onClick={() => setIsCurriculumOpen(false)} aria-label="Fechar consulta curricular" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"><X className="h-5 w-5" /></button>
              </header>
              <div className="overflow-y-auto p-4 sm:p-6">
                <CurriculumBrowser onSelectSkillForPlan={(skill: CurriculumSkill) => {
                  setIsCurriculumOpen(false);
                  void handleSendMessage(`Quero explorar esta habilidade curricular como ponto de partida para uma proposta.\n\nCódigo: ${skill.code}\nTexto registrado: ${skill.verbatimText}\nFonte indicada no catálogo: ${skill.sourceDocument}\nEtapa: ${skill.stage}\n\nAjude-me a desenvolver possibilidades relacionadas, sem presumir formato ou recursos. Diferencie o registro curricular das sugestões.`);
                }} />
              </div>
            </section>
          </div>
        </Suspense>
      )}
      {isPlanBuilderOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <div ref={planBuilderDialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Estruturar uma proposta">
            <div className="relative my-auto w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setIsPlanBuilderOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                aria-label="Fechar estruturador"
              >
                <X className="h-5 w-5" />
              </button>
              <QuickPlanWizard onSubmitToChat={query => {
                setIsPlanBuilderOpen(false);
                void handleSendMessage(query);
              }} />
            </div>
          </div>
        </Suspense>
      )}
      {pdfDraft && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PdfExportModal
            title={pdfDraft.title}
            content={pdfDraft.content}
            isExporting={isExportingPdf}
            error={pdfExportError}
            onClose={() => setPdfDraft(null)}
            onExport={handleExportPdf}
          />
        </Suspense>
      )}
    </div>
  );
}
