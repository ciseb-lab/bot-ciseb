import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, Printer, ShieldCheck, RefreshCw, FileText, Compass, AlertCircle } from 'lucide-react';
import { extractMarkdownTables } from '../utils/formatters.ts';
import { apiFetch } from '../utils/api.ts';
import { CurriculumSkill } from '../data/curriculumData.ts';
import { MarkdownText } from './MarkdownText.tsx';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  groundedSkills?: CurriculumSkill[];
}

interface ChatBotProps {
  onOpenPrint?: (content: string) => void;
  externalQuery?: string | null;
  onClearExternalQuery?: () => void;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-init',
  role: 'assistant',
  content: `Olá! Sou o **Bot CISEB**, seu assistente de apoio à formação e às práticas pedagógicas.

Posso ajudar a explorar documentos, desenvolver ideias, planejar formações, criar atividades ou revisar propostas. Conte o que está pensando com suas palavras; não precisa conhecer técnicas de prompt, preencher um roteiro nem ter todas as informações agora.

Quando for útil, consulto os documentos disponíveis, explico o que encontrei e diferencio referências documentais de sugestões pedagógicas. Vamos construir juntos os próximos passos.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const SUGGESTED_QUERIES = [
  {
    label: "6º ano EF · Ciências",
    query: "Ano: 6º ano EF. Componente: Ciências da Natureza. Tema: Ecossistemas paraenses, bacias hidrográficas e sensores de qualidade da água. Tipo: Sequência Didática."
  },
  {
    label: "3º ano EM · Computação",
    query: "Ano: 3º ano EM. Componente: Computação. Tema: Inteligência Artificial Ética, viés algorítmico e povos da Amazônia. Tipo: Plano de Aula."
  },
  {
    label: "4º ano EF · Matemática",
    query: "Ano: 4º ano EF. Componente: Matemática e Computação. Tema: Lógica condicional ('se... então') e sequenciamento com jogos de tabuleiro. Tipo: Alinhamento Curricular."
  },
  {
    label: "7º ano EF · Robótica Maker",
    query: "Ano: 7º ano EF. Componente: Robótica Educacional. Tema: Prototipagem sustentável com sucata eletrônica e automação de horta escolar. Tipo: Plano de Aula."
  }
];

export const ChatBot: React.FC<ChatBotProps> = ({ onOpenPrint, externalQuery, onClearExternalQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external query from Wizard or Browser
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
    }
  }, [externalQuery]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundedSkills: data.groundedSkills || [],
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Ocorreu uma instabilidade na consulta aos servidores da SEDUC. Por favor, tente novamente sua solicitação.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Protocol Status Strip */}
      <div className="bg-[#005BAC]/5 border-b border-[#005BAC]/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#005BAC]" />
          <span className="font-semibold text-[#005BAC]">Protocolo Oficial CISEB 1.0</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">Tolerância Zero a Alucinações</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">Validação Automática de Códigos</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
          <span>Base Curricular Ativa (SEDUC-PA / MEC 2022)</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const { cleanText, tables } = !isUser ? extractMarkdownTables(msg.content) : { cleanText: msg.content, tables: [] };

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full`}
            >
              {/* Message Meta Info */}
              <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 px-1">
                <span className="font-semibold text-slate-700">
                  {isUser ? 'Educador / Gestor' : 'BOT CISEB · Guia Oficial'}
                </span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble Container */}
              <div
                className={`rounded-xl p-4 sm:p-5 w-full transition-all ${
                  isUser
                    ? 'bg-[#005BAC] text-white shadow-sm max-w-2xl'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                {/* Clean Text Content */}
                <MarkdownText className="text-sm text-inherit">
                  {cleanText}
                </MarkdownText>

                {/* Render Extracted Tables with Official Institutional Styling */}
                {tables.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {tables.map((table, tIdx) => (
                      <div key={tIdx} className="overflow-x-auto rounded-lg border border-[#005BAC]/20 bg-white">
                        <div className="bg-[#005BAC] px-3 py-1.5 text-xs font-semibold text-white flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00AAFF]" />
                            Relatório Obrigatório de Validação Curricular Oficial
                          </span>
                          <span className="text-[11px] text-[#E0F2FE]">Literalidade Garantida</span>
                        </div>
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                              {table.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-2.5 tracking-tight">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-sky-50/40 transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`p-2.5 align-top ${
                                      cIdx === 0
                                        ? 'font-bold font-mono text-[#005BAC] whitespace-nowrap'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grounded Skills Provenance Pill / Tag */}
                {!isUser && msg.groundedSkills && msg.groundedSkills.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Fontes Verificadas:</span>
                    {msg.groundedSkills.map(s => (
                      <span
                        key={s.code}
                        className="font-mono text-[11px] font-semibold text-[#005BAC] bg-[#E0F2FE] px-2 py-0.5 rounded"
                      >
                        {s.code}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Bar for Assistant Messages (Copy, Print) */}
                {!isUser && (
                  <div className="mt-4 pt-2 flex items-center justify-end gap-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="px-2.5 py-1 text-slate-600 hover:text-[#005BAC] hover:bg-slate-100 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                          <span className="text-[#059669]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                    {onOpenPrint && (
                      <button
                        onClick={() => onOpenPrint(msg.content)}
                        className="px-2.5 py-1 text-[#005BAC] hover:bg-[#E0F2FE] rounded transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / Exportar Oficial</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700">BOT CISEB</span>
              <span>·</span>
              <span>Consultando documentos oficiais...</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-[#005BAC] animate-spin" />
              <div className="text-xs text-slate-600">
              Consultando os documentos relacionados ao seu pedido...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starters */}
      <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-slate-400 font-semibold whitespace-nowrap">Exemplos Práticos:</span>
        {SUGGESTED_QUERIES.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.query)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-slate-100 hover:bg-[#E0F2FE] text-slate-700 hover:text-[#005BAC] rounded-md transition-colors whitespace-nowrap cursor-pointer text-xs"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Conte sua ideia, dúvida ou desafio. Você pode escrever do seu jeito..."
          disabled={isLoading}
          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AAFF] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 bg-[#005BAC] hover:bg-[#004E96] disabled:bg-slate-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};
