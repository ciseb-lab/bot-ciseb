import React, { useEffect, useRef } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface PromptComposerProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttach?: () => void;
  isLoading?: boolean;
  loadingText?: string;
  loadingStaggerSec?: number;
  loadingCharDurationSec?: number;
  placeholder?: string;
  ariaLabel?: string;
  rows?: number;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  className?: string;
}

const DEFAULT_LOADING_STAGGER_SEC = 0.044;
const DEFAULT_LOADING_CHAR_DURATION_SEC = 0.42;

export const PromptComposer: React.FC<PromptComposerProps> = ({
  value,
  onChange,
  onSend,
  onAttach,
  isLoading = false,
  loadingText = 'Organizando uma resposta…',
  loadingStaggerSec = DEFAULT_LOADING_STAGGER_SEC,
  loadingCharDurationSec = DEFAULT_LOADING_CHAR_DURATION_SEC,
  placeholder = 'Pergunte ao MIRI sobre documentos, atividades ou formações…',
  ariaLabel = 'Escreva sua ideia ou pergunta',
  rows = 2,
  textareaRef: externalRef,
  className = '',
}) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (!value) {
      el.style.height = 'auto';
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [value, textareaRef]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isCmdOrCtrlEnter = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
    const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
    if (isCmdOrCtrlEnter || isPlainEnter) {
      event.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const characters = Array.from(loadingText);
  const totalWaveCycle = Math.max(characters.length * loadingStaggerSec, 0.6);

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        if (value.trim() && !isLoading) {
          onSend();
        }
      }}
      className={`relative w-full overflow-hidden rounded-2xl border border-[#005BAC]/25 bg-white/90 p-3 shadow-[0_6px_24px_rgba(0,91,172,0.08)] backdrop-blur-md transition focus-within:border-[#005BAC] focus-within:ring-2 focus-within:ring-[#00AAFF]/25 sm:p-3.5 dark:border-slate-700 dark:bg-slate-900/90 dark:focus-within:border-[#00AAFF] ${className}`}
    >
      {/* Animated loading line along the top edge while sending */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-[#E0F2FE]"
            aria-hidden="true"
          >
            <motion.div
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#00AAFF] to-[#005BAC]"
              animate={{ x: ['-100%', '220%'] }}
              transition={{
                duration: 1.25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          rows={rows}
          disabled={isLoading}
          aria-label={ariaLabel}
          placeholder={isLoading ? '' : placeholder}
          className={`max-h-48 w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-6 text-slate-800 outline-none placeholder:text-[#56637e] dark:text-slate-100 dark:placeholder:text-slate-400 ${
            isLoading ? 'opacity-30' : ''
          }`}
        />

        {/* Animated character-stagger loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading-text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute inset-0 flex items-center px-1.5 py-1 text-sm font-medium text-[#005BAC]"
            >
              <span className="inline-flex flex-wrap">
                {characters.map((char, index) => (
                  <motion.span
                    key={`${index}-${char}`}
                    animate={{
                      opacity: [0.35, 1, 0.35],
                      y: [0, -1.5, 0],
                    }}
                    transition={{
                      duration: loadingCharDurationSec,
                      repeat: Infinity,
                      repeatDelay: totalWaveCycle - loadingCharDurationSec,
                      delay: index * loadingStaggerSec,
                      ease: 'easeInOut',
                    }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100/90 px-1 pt-2 sm:gap-3 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2">
          {onAttach && (
            <button
              type="button"
              onClick={onAttach}
              disabled={isLoading}
              aria-label="Estruturar proposta passo a passo"
              title="Estruturar proposta passo a passo"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#E0F2FE]/70 hover:text-[#005BAC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#00AAFF]"
            >
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <span className="truncate text-[11px] text-slate-400">
            <span className="hidden sm:inline">Enter ou Ctrl + Enter envia · Shift + Enter quebra linha</span>
            <span className="sm:hidden">Roteiro guiado ou envie sua pergunta</span>
          </span>
        </div>

        <motion.button
          type="submit"
          disabled={!value.trim() || isLoading}
          whileHover={!value.trim() || isLoading ? undefined : { scale: 1.03 }}
          whileTap={!value.trim() || isLoading ? undefined : { scale: 0.96 }}
          aria-label="Enviar mensagem"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#005BAC] text-white shadow-xs transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
        >
          <ArrowUp className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
        </motion.button>
      </div>
    </form>
  );
};
