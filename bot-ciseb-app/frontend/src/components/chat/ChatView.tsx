import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, FileDown, LogOut, PanelLeftOpen, RefreshCw, Sparkles } from 'lucide-react';
import { downloadApiFile } from '../../utils/api.ts';
import { CurriculumSkill } from '../../../../shared/curriculumData.ts';
import { PromptComposer } from '../ui/prompt-composer.tsx';
import { ThemeToggleButton2 } from '../ui/theme-toggle.tsx';
import { MarkdownText } from './MarkdownText.tsx';

const LOADING_STAGGER_SEC = 0.044;
const LOADING_CHAR_DURATION_SEC = 0.42;

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
  isSidebarOpen?: boolean;
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
  isSidebarOpen = true,
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
  const [downloadError, setDownloadError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialState = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
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
    <main className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Glow azul institucional inspirado no layout do Figma */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center overflow-hidden"
      >
        <div className="relative h-[320px] w-full max-w-[680px] translate-y-24 sm:h-[420px]">
          <div className="absolute left-4 bottom-0 h-56 w-56 rounded-full bg-[#00AAFF]/25 blur-[90px] sm:left-6 sm:h-80 sm:w-80 sm:blur-[110px] dark:bg-[#00AAFF]/20" />
          <div className="absolute right-4 bottom-8 h-52 w-52 rounded-full bg-[#005BAC]/22 blur-[90px] sm:right-6 sm:h-72 sm:w-72 sm:blur-[110px] dark:bg-[#005BAC]/30" />
        </div>
      </div>

      <header className="relative z-10 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-100/80 bg-white/80 px-2.5 py-2 backdrop-blur-md xs:px-3.5 sm:min-h-20 sm:gap-3 sm:px-6 sm:py-2.5 dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex min-w-0 items-center gap-2 xs:gap-3 sm:gap-5">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={onOpenSidebar}
              aria-label="Abrir barra lateral"
              title="Abrir barra lateral"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-[#005BAC] shadow-xs transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:border-slate-700 dark:bg-slate-900 dark:text-[#00AAFF] dark:hover:bg-slate-800"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2 xs:gap-3 sm:gap-5">
            <img
              src="/assets/dinov-logo-dark.svg"
              alt="DINOV — Diretoria de Inovação"
              className="h-8 w-auto max-w-[105px] object-contain xs:h-10 xs:max-w-[130px] sm:h-14 sm:max-w-none md:h-16 dark:hidden"
            />
            <img
              src="/assets/dinov-logo-light.svg"
              alt="DINOV — Diretoria de Inovação"
              className="hidden h-8 w-auto max-w-[105px] object-contain xs:h-10 xs:max-w-[130px] sm:h-14 sm:max-w-none md:h-16 dark:block"
            />
            <span className="-mt-0.5 h-6 w-px shrink-0 bg-slate-200 xs:h-7 sm:-mt-1 sm:h-10 dark:bg-slate-700" aria-hidden="true" />
            <img
              src="/assets/ciseb-logo-dark.svg"
              alt="CISEB — Centro de Inovação e Sustentabilidade da Educação Básica"
              className="h-8 w-auto max-w-[105px] object-contain xs:h-10 xs:max-w-[130px] sm:h-14 sm:max-w-none md:h-16 dark:hidden"
            />
            <img
              src="/assets/ciseb-logo-light.svg"
              alt="CISEB — Centro de Inovação e Sustentabilidade da Educação Básica"
              className="hidden h-8 w-auto max-w-[105px] object-contain xs:h-10 xs:max-w-[130px] sm:h-14 sm:max-w-none md:h-16 dark:block"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <ThemeToggleButton2 variant="circle" start="top-right" />
        </div>
      </header>
      {historyError && <div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:px-4 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200"><span>{historyError}</span></div>}
      {legacyConversationCount > 0 && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-950 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100">
          <p><strong>{legacyConversationCount} conversa{legacyConversationCount === 1 ? '' : 's'} antiga{legacyConversationCount === 1 ? '' : 's'}</strong> encontrada{legacyConversationCount === 1 ? '' : 's'} neste navegador. Ela{legacyConversationCount === 1 ? ' ficará' : 's ficarão'} no dispositivo até você importar.</p>
          <button type="button" onClick={onImportLegacy} disabled={isImportingLegacy} className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-sky-300 bg-white px-3 py-1.5 font-semibold text-[#005BAC] transition hover:bg-sky-100 disabled:opacity-60 dark:border-sky-700 dark:bg-slate-900 dark:text-[#38bdf8] dark:hover:bg-slate-800">
            {isImportingLegacy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null} Importar para minha conta
          </button>
        </div>
      )}

      {isInitialState ? (
        <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl 2xl:max-w-5xl flex-1 flex-col justify-between px-3 py-5 xs:px-4 sm:px-8 sm:py-10">
            <div className="my-auto flex flex-col items-center py-4 text-center sm:py-8">
              <div className="mb-4 flex items-center justify-center sm:mb-5">
                <img
                  src="/assets/mascote/mascote-thinking.png"
                  alt="Mascote do MIRI"
                  className="h-14 w-14 object-contain drop-shadow-xs xs:h-16 xs:w-16 sm:h-20 sm:w-20"
                />
              </div>
              <div className="mb-3 inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-[#E0F2FE]/90 px-3 py-1 text-[11px] font-semibold text-[#005BAC] backdrop-blur-xs dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <img src="/assets/mascote/miri-wordmark.png" alt="" aria-hidden="true" className="h-4 w-auto object-contain sm:h-5" />
                <span className="sr-only">MIRI · apoio à formação</span>
                <span aria-hidden="true">· apoio à formação</span>
              </div>
              <h1 className="max-w-xl text-xl font-semibold tracking-tight text-slate-900 xs:text-2xl sm:text-3xl dark:text-slate-100">
                Como posso apoiar seu trabalho hoje?
              </h1>
              <p className="mt-2.5 max-w-xl text-xs leading-5 text-slate-600 xs:text-sm xs:leading-6 sm:mt-3 dark:text-slate-400">
                Explore documentos, desenvolva ideias, prepare formações ou revise uma proposta. Escreva do seu jeito; vamos construir juntos a partir do que você já sabe.
              </p>
            </div>

            <div className="w-full space-y-4 pt-3 sm:space-y-5 sm:pt-4">
              <div className="w-full">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-xs font-semibold text-[#475569] dark:text-slate-300">
                    Sugestões do que perguntar ao MIRI <span className="font-normal text-slate-400 dark:text-slate-500">· opcionais</span>
                  </p>
                  <button
                    type="button"
                    onClick={onOpenPlanBuilder}
                    className="min-h-8 cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-[#005BAC] transition hover:bg-[#E0F2FE]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-[#00AAFF] dark:hover:bg-slate-800"
                  >
                    Prefiro estruturar com perguntas
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 2xl:grid-cols-4">
                  {STARTER_PROMPTS.map(starter => (
                    <button
                      key={starter.label}
                      type="button"
                      onClick={() => handleUseStarter(starter.prompt)}
                      className="min-h-11 cursor-pointer rounded-xl border border-white/90 bg-white/65 px-3 py-2 text-left text-xs font-medium leading-5 text-slate-700 shadow-[0_2px_12px_rgba(0,91,172,0.06)] backdrop-blur-md transition hover:border-[#00AAFF]/50 hover:bg-white/90 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] sm:min-h-12 sm:px-3.5 sm:py-2.5 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-[#00AAFF]/50 dark:hover:bg-slate-900 dark:hover:text-[#00AAFF]"
                    >
                      {starter.label}
                    </button>
                  ))}
                </div>
              </div>

              <PromptComposer
                textareaRef={textareaRef}
                value={input}
                onChange={handleInputChange}
                onSend={handleSubmit}
                onAttach={onOpenPlanBuilder}
                isLoading={isLoading}
                loadingCharDurationSec={LOADING_CHAR_DURATION_SEC}
                loadingStaggerSec={LOADING_STAGGER_SEC}
                loadingText="Organizando uma resposta…"
                rows={2}
                ariaLabel="Escreva sua ideia ou pergunta"
                placeholder="Pergunte ao MIRI sobre documentos, atividades ou formações…"
              />
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2.5 py-4 xs:px-3.5 sm:px-6 sm:py-6 lg:px-8" aria-label="Mensagens da conversa" aria-live="polite">
            <div className="mx-auto max-w-3xl xl:max-w-4xl 2xl:max-w-5xl space-y-5 sm:space-y-6">
              {hasOlderMessages && (
                <div className="flex justify-center">
                  <button type="button" onClick={onLoadOlderMessages} disabled={isLoadingOlderMessages} className="min-h-9 cursor-pointer rounded-full border border-white/90 bg-white/75 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-xs backdrop-blur-md transition hover:border-[#005BAC]/40 hover:text-[#005BAC] disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                    {isLoadingOlderMessages ? 'Carregando histórico…' : 'Carregar mensagens anteriores'}
                  </button>
                </div>
              )}
              {messages.map(message => {
                const isUser = message.role === 'user';
                return (
                  <article key={message.id} className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <img src="/assets/mascote/mascote-thinking.png" alt="" aria-hidden="true" className="mt-5 hidden h-9 w-9 shrink-0 object-contain xs:block sm:h-11 sm:w-11" />
                    )}
                    <div className={`flex min-w-0 max-w-full flex-col xs:max-w-[92%] sm:max-w-[85%] lg:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`mb-1.5 flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {isUser
                          ? <span>Você</span>
                          : <img src="/assets/mascote/miri-wordmark.png" alt="MIRI" className="h-3.5 w-auto shrink-0 object-contain align-middle" />}
                        <span aria-hidden="true">·</span>
                        <time className="normal-case tracking-normal text-slate-400">{message.timestamp}</time>
                      </div>
                      <div className={`w-full min-w-0 overflow-hidden rounded-xl border px-3.5 py-3 backdrop-blur-md sm:px-4 sm:py-3.5 ${isUser ? 'border-[#005BAC] bg-[#005BAC] text-white shadow-[0_4px_16px_rgba(0,91,172,0.18)]' : 'border-white/90 bg-white/75 text-slate-800 shadow-[0_2px_16px_rgba(0,91,172,0.07)] dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100'}`}>
                        <MarkdownText className={`break-words text-sm leading-6 ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                          {message.content}
                        </MarkdownText>

                        {!isUser && (message.groundedDocuments?.length || 0) > 0 && (
                          <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
                            <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">Fontes consultadas</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {message.groundedDocuments?.map(reference => (
                              <button
                                type="button"
                                  key={`${reference.source}-${reference.pageNumber || 'doc'}`}
                                  onClick={() => void downloadApiFile(`/api/documents/${encodeURIComponent(reference.source)}`, reference.source).catch(reason => setDownloadError(reason instanceof Error ? reason.message : 'Falha ao baixar o documento.'))}
                                  className="min-h-8 max-w-full cursor-pointer break-words rounded-lg bg-[#E0F2FE] px-2.5 py-1.5 text-left text-[11px] font-medium text-[#005BAC] transition hover:bg-[#cdeafe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff] dark:hover:bg-[#005BAC]/45"
                                >
                                  {reference.title}{reference.pageNumber ? ` · p. ${reference.pageNumber}` : ''}
                              </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!isUser && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-2 dark:border-slate-700/70">
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(message)}
                              className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition hover:bg-slate-200/60 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#00AAFF]"
                            >
                              {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                              {copiedId === message.id ? 'Copiado' : 'Copiar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onExportMessage(message)}
                              className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#005BAC] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-[#38bdf8] dark:hover:bg-slate-800"
                            >
                              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                              Revisar e exportar PDF
                            </button>
                          </div>
                        )}
                      </div>
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

          <div className="relative z-10 shrink-0 px-2.5 pb-3 pt-1.5 xs:px-3.5 sm:px-6 sm:pb-5 sm:pt-2">
            <div className="mx-auto max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
              <PromptComposer
                textareaRef={textareaRef}
                value={input}
                onChange={handleInputChange}
                onSend={handleSubmit}
                onAttach={onOpenPlanBuilder}
                isLoading={isLoading}
                loadingCharDurationSec={LOADING_CHAR_DURATION_SEC}
                loadingStaggerSec={LOADING_STAGGER_SEC}
                loadingText="Organizando uma resposta…"
                rows={1}
                ariaLabel="Escreva uma mensagem"
                placeholder="Continue a conversa ou peça um ajuste…"
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
};

