import React from 'react';
import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  Download,
  BookOpen,
  Sparkles,
  GraduationCap,
  Trash2,
  LoaderCircle
} from 'lucide-react';

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
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-40 p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs text-slate-700 transition-colors cursor-pointer"
        title="Abrir barra lateral"
      >
        <PanelLeft className="w-5 h-5 text-[#005BAC]" />
      </button>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 select-none flex-col justify-between border-r border-slate-200 bg-[#FBFBFC] transition-all md:relative md:z-30 md:h-screen md:w-64">
      {/* Top Header */}
      <div className="p-3.5 pb-2">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="min-w-0 border-l-2 border-[#005BAC] pl-3 py-0.5">
            <span className="block text-sm font-extrabold tracking-wide text-[#005BAC]">
              DINOV
            </span>
            <span className="mt-1 block text-[11px] font-medium leading-snug text-slate-600">
              Diretoria de Inovação
            </span>
            <span className="mt-2 block text-xs font-bold text-slate-800">
              CISEB
            </span>
            <span className="block text-[10px] leading-snug text-slate-500">
              Centro de Inovação e Sustentabilidade da Educação Básica
            </span>
          </div>

          {/* Collapse Button */}
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            title="Recolher barra lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#005BAC]/30 rounded-xl shadow-xs transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#005BAC] group-hover:rotate-90 transition-transform" />
            <span>Novo Atendimento</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs text-slate-600 no-scrollbar pt-2">
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Histórico de Consultas</span>
          </div>

          <div className="space-y-0.5">
            {chatSessions.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                Nenhuma conversa recente.
              </div>
            ) : (
              chatSessions.map(session => (
                <div key={session.id} className={`group flex items-center rounded-lg ${activeSessionId === session.id ? 'bg-slate-200/80' : 'hover:bg-slate-100'}`}>
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`min-w-0 flex-1 truncate px-3 py-1.5 text-left transition-colors ${activeSessionId === session.id ? 'font-semibold text-[#005BAC]' : 'text-slate-600'}`}
                    title={session.title}
                  >
                    {session.title}
                  </button>
                  <button type="button" onClick={() => onDeleteSession(session.id)} aria-label={`Excluir conversa: ${session.title}`} title="Excluir conversa" className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-rose-100 hover:text-rose-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
            {hasMoreConversations && <button type="button" onClick={onLoadMoreConversations} disabled={isLoadingMoreConversations} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-[#005BAC] hover:bg-slate-100 disabled:opacity-50">{isLoadingMoreConversations && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}Carregar mais</button>}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => onItemClick?.('curriculum')}
          className="mb-1 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
        >
          <GraduationCap className="h-4 w-4 text-slate-400" />
          <span>Explorar habilidades</span>
        </button>
        <button
          type="button"
          onClick={() => onItemClick?.('wizard')}
          className="mb-1 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
        >
          <Sparkles className="h-4 w-4 text-slate-400" />
          <span>Estruturar proposta <span className="text-slate-400">(opcional)</span></span>
        </button>
        <button
          type="button"
          onClick={() => onItemClick?.('manual')}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
        >
          <Download className="h-4 w-4 text-slate-400" />
          <span>Fontes e normativas</span>
        </button>
      </div>
    </aside>
  );
};
