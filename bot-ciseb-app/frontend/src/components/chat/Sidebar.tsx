import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  PanelLeftClose,
  Download,
  BookOpen,
  Sparkles,
  GraduationCap,
  Trash2,
  LoaderCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { HaloSearchInput } from '../ui/halo-search.tsx';

const LOADING_STAGGER_SEC = 0.044;
const LOADING_CHAR_DURATION_SEC = 0.42;
const SEARCH_LOADING_MS = 650;

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onItemClick?: (item: string) => void;
  chatSessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  hasMoreConversations: boolean;
  isLoadingMoreConversations: boolean;
  onLoadMoreConversations: () => void;
  userName?: string;
  userEmail?: string;
  userPhotoUrl?: string | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onNewChat,
  onItemClick,
  chatSessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  hasMoreConversations,
  isLoadingMoreConversations,
  onLoadMoreConversations,
  userName = '',
  userEmail = '',
  userPhotoUrl = null,
  onLogout,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const loadTimerRef = useRef<number | null>(null);

  const clearLoadingTimer = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLoadingTimer();
  }, [clearLoadingTimer]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || isSearching) return;
    const query = event.currentTarget.value.trim();
    if (!query) return;
    event.preventDefault();
    clearLoadingTimer();
    setIsSearching(true);
    loadTimerRef.current = window.setTimeout(() => {
      setIsSearching(false);
      loadTimerRef.current = null;
    }, SEARCH_LOADING_MS) as number;
  };

  const handleClearSearch = useCallback(() => {
    clearLoadingTimer();
    setIsSearching(false);
    setSearchValue('');
  }, [clearLoadingTimer]);

  const filteredSessions = useMemo(() => {
    const query = normalizeForSearch(searchValue.trim());
    if (!query) return chatSessions;
    return chatSessions.filter(session => normalizeForSearch(session.title).includes(query));
  }, [chatSessions, searchValue]);

  useEffect(() => {
    setAvatarError(false);
  }, [userPhotoUrl]);

  const displayName = useMemo(() => {
    if (userName.trim()) return userName.trim();
    if (!userEmail) return 'Educador(a)';
    const localPart = userEmail.split('@')[0] || '';
    return localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || userEmail;
  }, [userName, userEmail]);

  const userInitial = (displayName.charAt(0) || 'E').toUpperCase();

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Navegação lateral e histórico"
      className="fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(18rem,85vw)] shrink-0 select-none flex-col justify-between border-r border-slate-200 bg-[#FBFBFC] shadow-xl transition-all md:relative md:z-30 md:h-dvh md:w-64 md:shadow-none xl:w-72 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top Header */}
      <div className="p-3 pb-2 sm:p-3.5 sm:pb-2">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu MIRI
          </span>
          {/* Collapse Button */}
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Recolher barra lateral"
            aria-label="Recolher barra lateral"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onNewChat}
          className="group flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-all hover:border-[#005BAC]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-[#00AAFF]/40 dark:hover:bg-slate-900"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Plus className="h-4 w-4 shrink-0 text-[#005BAC] transition-transform group-hover:rotate-90 dark:text-[#00AAFF]" />
            <span className="truncate">Novo Atendimento</span>
          </div>
          <span className="hidden shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-900">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Chat History Section */}
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-2 pt-2 text-xs text-slate-600">
        <div>
          <div className="flex items-center gap-1.5 px-3 pb-2 text-[11px] font-semibold text-slate-400">
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Histórico de Consultas</span>
          </div>

          <div className="px-1.5 pb-2.5">
            <HaloSearchInput
              aria-label="Buscar no histórico de conversas"
              autoComplete="off"
              blobTranslucent
              isLoading={isSearching}
              loadingCharDurationSec={LOADING_CHAR_DURATION_SEC}
              loadingStaggerSec={LOADING_STAGGER_SEC}
              loadingText="Buscando…"
              onChange={event => setSearchValue(event.target.value)}
              onClear={handleClearSearch}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar no histórico…"
              value={searchValue}
            />
          </div>

          <div className="space-y-0.5">
            {chatSessions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                Nenhuma conversa recente.
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                Nenhuma conversa encontrada para &ldquo;{searchValue.trim()}&rdquo;.
              </div>
            ) : (
              filteredSessions.map(session => (
                <div key={session.id} className={`group flex items-center rounded-lg ${activeSessionId === session.id ? 'bg-slate-200/80 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(session.id)}
                    className={`min-h-9 min-w-0 flex-1 truncate px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] ${activeSessionId === session.id ? 'font-semibold text-[#005BAC] dark:text-[#00AAFF]' : 'text-slate-600 dark:text-slate-300'}`}
                    title={session.title}
                  >
                    {session.title}
                  </button>
                  <button type="button" onClick={() => onDeleteSession(session.id)} aria-label={`Excluir conversa: ${session.title}`} title="Excluir conversa" className="mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 opacity-100 transition hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-rose-950/60 dark:hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
            {hasMoreConversations && <button type="button" onClick={onLoadMoreConversations} disabled={isLoadingMoreConversations} className="mt-2 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-[#005BAC] hover:bg-slate-100 disabled:opacity-50 dark:text-[#00AAFF] dark:hover:bg-slate-800">{isLoadingMoreConversations && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}Carregar mais</button>}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-200 bg-white p-2.5 sm:p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onItemClick?.('curriculum')}
            className="group flex min-h-9 w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-[#E0F2FE]/60 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-[#00AAFF]"
          >
            <span className="flex min-w-0 items-center gap-2.5 truncate">
              <GraduationCap className="h-4 w-4 shrink-0 text-[#005BAC] dark:text-[#00AAFF]" aria-hidden="true" />
              <span className="truncate">Habilidades BNCC</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#005BAC] group-hover:opacity-100 dark:group-hover:text-[#00AAFF]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onItemClick?.('wizard')}
            className="group flex min-h-9 w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-[#E0F2FE]/60 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-[#00AAFF]"
          >
            <span className="flex min-w-0 items-center gap-2.5 truncate">
              <Sparkles className="h-4 w-4 shrink-0 text-[#005BAC] dark:text-[#00AAFF]" aria-hidden="true" />
              <span className="truncate">Criar plano passo a passo</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#005BAC] group-hover:opacity-100 dark:group-hover:text-[#00AAFF]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onItemClick?.('manual')}
            className="group flex min-h-9 w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-[#E0F2FE]/60 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-[#00AAFF]"
          >
            <span className="flex min-w-0 items-center gap-2.5 truncate">
              <Download className="h-4 w-4 shrink-0 text-[#005BAC] dark:text-[#00AAFF]" aria-hidden="true" />
              <span className="truncate">Documentos e PDFs oficiais</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-[#005BAC] group-hover:opacity-100 dark:group-hover:text-[#00AAFF]" aria-hidden="true" />
          </button>
        </div>

        {(userEmail || userName) && (
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800/80">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {userPhotoUrl && !avatarError ? (
                <img
                  src={userPhotoUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-xs font-bold text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]"
                >
                  {userInitial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100" title={displayName}>
                  {displayName}
                </p>
                {userEmail && (
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={userEmail}>
                    {userEmail}
                  </p>
                )}
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sair da conta"
                title="Sair da conta"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
