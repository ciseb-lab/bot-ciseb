import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Bot, Check, Copy, FileDown, LogOut, PanelLeftOpen, RefreshCw, Sparkles } from 'lucide-react';
import { apiFetch, downloadApiFile } from '../utils/api.ts';
import { CurriculumSkill } from '../../../shared/curriculumData.ts';
import { MarkdownText } from './MarkdownText.tsx';

export interface GroundedDocumentReference {
  source: string;
  title: string;
  pageNumber?: number;
}

export interface Message {
  id: string;
  sequence?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundedSkills?: CurriculumSkill[];
  groundedDocuments?: GroundedDocumentReference[];
}

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onExportMessage: (message: Message) => void;
  onOpenPlanBuilder: () => void;
  onOpenSidebar: () => void;
  userEmail: string;
  onLogout: () => void;
  historyError: string | null;
  legacyConversationCount: number;
  isImportingLegacy: boolean;
  onImportLegacy: () => void;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  onLoadOlderMessages: () => void;
}

const STARTER_PROMPTS = [
  { label: 'Desenvolver uma ideia', prompt: 'Tenho uma ideia para uma atividade pedagógica e quero explorar possibilidades.' },
  { label: 'Planejar uma formação', prompt: 'Quero organizar uma formação para professores com momentos práticos e participativos.' },
  { label: 'Criar uma atividade prática', prompt: 'Preciso de uma atividade prática que funcione com os recursos disponíveis na escola.' },
  { label: 'Consultar um documento', prompt: 'Quero entender como um documento educacional pode contribuir para minha proposta.' },
  { label: 'Explorar Computação', prompt: 'Como posso trabalhar Computação na Educação Básica de forma contextualizada?' },
  { label: 'Competências digitais docentes', prompt: 'Quero propor uma atividade de formação relacionada a competências digitais docentes.' },
  { label: 'Revisar uma proposta', prompt: 'Tenho uma proposta pronta e quero deixá-la mais prática e participativa.' },
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onExportMessage,
  onOpenPlanBuilder,
  onOpenSidebar,
  userEmail,
  onLogout,
  historyError,
  legacyConversationCount,
  isImportingLegacy,
  onImportLegacy,
  hasOlderMessages,
  isLoadingOlderMessages,
  onLoadOlderMessages,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [documentStatusError, setDocumentStatusError] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialState = messages.length === 0;

  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/api/documents/status', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Documentos indisponíveis');
        return response.json();
      })
      .then((status: { ready: boolean; documentCount: number }) => {
        if (!status.ready || !Number.isFinite(status.documentCount)) throw new Error('Base indisponível');
        setDocumentCount(status.documentCount);
      })
      .catch(error => {
        if (error.name !== 'AbortError') setDocumentStatusError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 192)}px`;
  };

  const handleUseStarter = (prompt: string) => {
    setInput(prompt);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const copyToClipboard = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <main className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="z-10 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Abrir menu de conversas"
            className="-ml-1 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] md:hidden"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            className={`truncate rounded-full px-2.5 py-1 text-[11px] font-medium ${documentStatusError ? 'bg-red-50 text-red-700' : 'bg-[#E0F2FE] text-[#005BAC]'}`}
            role="status"
          >
            {documentStatusError
              ? 'Base documental indisponível'
              : documentCount === null
                ? 'Verificando fontes…'
                : `${documentCount} documentos disponíveis`}
          </span>
        </div>
        <span className="hidden text-xs font-medium text-slate-400 sm:block">Assistente de apoio pedagógico</span>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden max-w-52 truncate text-xs font-medium text-slate-500 lg:block" title={userEmail}>{userEmail}</span>
          <button type="button" onClick={onLogout} aria-label="Sair da conta" title="Sair da conta" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>
      {historyError && <div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800"><span>{historyError}</span></div>}
      {legacyConversationCount > 0 && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-950 sm:flex-row sm:items-center sm:justify-between">
          <p><strong>{legacyConversationCount} conversa{legacyConversationCount === 1 ? '' : 's'} antiga{legacyConversationCount === 1 ? '' : 's'}</strong> encontrada{legacyConversationCount === 1 ? '' : 's'} neste navegador. Ela{legacyConversationCount === 1 ? ' ficará' : 's ficarão'} no dispositivo até você importar.</p>
          <button type="button" onClick={onImportLegacy} disabled={isImportingLegacy} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-1.5 font-semibold text-[#005BAC] transition hover:bg-sky-100 disabled:opacity-60">
            {isImportingLegacy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null} Importar para minha conta
          </button>
        </div>
      )}

      {isInitialState ? (
        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-10">
            <div className="mb-6 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E0F2FE] px-3 py-1 text-[11px] font-semibold text-[#005BAC]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>BOT CISEB · apoio à formação</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Como posso apoiar seu trabalho hoje?</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Explore documentos, desenvolva ideias, prepare formações ou revise uma proposta. Escreva do seu jeito; não precisa seguir um modelo nem ter todas as informações agora. Vamos construir juntos a partir do que você já sabe.
              </p>
            </div>

            <form
              className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 shadow-sm transition focus-within:border-[#005BAC] focus-within:ring-2 focus-within:ring-[#00AAFF]/20 sm:p-4"
              onSubmit={event => { event.preventDefault(); handleSubmit(); }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={3}
                aria-label="Escreva sua ideia ou pergunta"
                placeholder="Conte o que você está pensando, o desafio ou a proposta que quer desenvolver…"
                className="max-h-48 w-full resize-none bg-transparent text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
              />
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                <span className="text-[11px] text-slate-400">Enter envia · Shift + Enter quebra linha</span>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Enviar mensagem"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005BAC] text-white transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ArrowUp className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="mt-5 w-full">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700">Ideias para começar <span className="font-normal text-slate-400">· opcionais</span></p>
                <button
                  type="button"
                  onClick={onOpenPlanBuilder}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-[#005BAC] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                >
                  Prefiro estruturar com perguntas
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STARTER_PROMPTS.map(starter => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => handleUseStarter(starter.prompt)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-600 transition hover:border-[#005BAC]/40 hover:bg-[#F8FCFF] hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-8" aria-label="Mensagens da conversa" aria-live="polite">
            <div className="mx-auto max-w-3xl space-y-6">
              {hasOlderMessages && (
                <div className="flex justify-center">
                  <button type="button" onClick={onLoadOlderMessages} disabled={isLoadingOlderMessages} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#005BAC]/40 hover:text-[#005BAC] disabled:opacity-60">
                    {isLoadingOlderMessages ? 'Carregando histórico…' : 'Carregar mensagens anteriores'}
                  </button>
                </div>
              )}
              {messages.map(message => {
                const isUser = message.role === 'user';
                return (
                  <article key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#005BAC]" aria-hidden="true">
                        <Bot className="h-4 w-4" />
                      </span>
                    )}
                    <div className={`min-w-0 max-w-[92%] rounded-2xl border px-4 py-3 sm:max-w-[88%] ${isUser ? 'border-[#005BAC] bg-[#005BAC] text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                      <div className={`mb-2 flex items-center gap-2 text-[11px] ${isUser ? 'justify-end text-white/75' : 'text-slate-400'}`}>
                        <span className={`font-semibold ${isUser ? 'text-white/90' : 'text-slate-700'}`}>{isUser ? 'Você' : 'BOT CISEB'}</span>
                        <span aria-hidden="true">·</span>
                        <time>{message.timestamp}</time>
                      </div>
                      <MarkdownText className={`text-sm leading-6 ${isUser ? 'text-white' : 'text-slate-800'}`}>
                        {message.content}
                      </MarkdownText>

                      {!isUser && (message.groundedDocuments?.length || 0) > 0 && (
                        <div className="mt-4 border-t border-slate-200 pt-3">
                          <p className="mb-2 text-[11px] font-semibold text-slate-600">Fontes consultadas</p>
                          <div className="flex flex-wrap gap-2">
                            {message.groundedDocuments?.map(reference => (
                            <button
                              type="button"
                                key={`${reference.source}-${reference.pageNumber || 'doc'}`}
                                onClick={() => void downloadApiFile(`/api/documents/${encodeURIComponent(reference.source)}`, reference.source).catch(reason => setDownloadError(reason instanceof Error ? reason.message : 'Falha ao baixar o documento.'))}
                                className="rounded-lg bg-[#E0F2FE] px-2.5 py-1.5 text-[11px] font-medium text-[#005BAC] transition hover:bg-[#cdeafe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                              >
                                {reference.title}{reference.pageNumber ? ` · p. ${reference.pageNumber}` : ''}
                            </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isUser && (
                        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-200 pt-2">
                          <button
                            type="button"
                            onClick={() => void copyToClipboard(message)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-200/70 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                          >
                            {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                            {copiedId === message.id ? 'Copiado' : 'Copiar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportMessage(message)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#005BAC] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                          >
                            <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                            Revisar e exportar PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {downloadError && <p role="alert" className="text-right text-xs text-rose-700">{downloadError}</p>}
              {isLoading && (
                <div className="flex items-center gap-3 text-sm text-slate-500" role="status">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#005BAC]" aria-hidden="true" />
                  <span>Organizando uma resposta…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </section>

          <form
            className="z-10 shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-6 sm:py-4"
            onSubmit={event => { event.preventDefault(); handleSubmit(); }}
          >
            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white p-2.5 shadow-sm transition focus-within:border-[#005BAC] focus-within:ring-2 focus-within:ring-[#00AAFF]/20 sm:p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Escreva uma mensagem"
                placeholder="Continue a conversa ou peça um ajuste…"
                className="max-h-40 w-full resize-none bg-transparent px-1 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
              />
              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span className="text-[11px] text-slate-400">Enter envia · Shift + Enter quebra linha</span>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Enviar mensagem"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#005BAC] text-white transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ArrowUp className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </main>
  );
};
