import React from 'react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface HaloSearchInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  blobTranslucent?: boolean;
  loadingText?: string;
  loadingStaggerSec?: number;
  loadingCharDurationSec?: number;
  placeholder?: string;
  autoComplete?: string;
  'aria-label'?: string;
  className?: string;
}

const DEFAULT_LOADING_STAGGER_SEC = 0.044;
const DEFAULT_LOADING_CHAR_DURATION_SEC = 0.42;

export const HaloSearchInput: React.FC<HaloSearchInputProps> = ({
  value,
  onChange,
  onClear,
  onKeyDown,
  isLoading = false,
  blobTranslucent = true,
  loadingText = 'Buscando…',
  loadingStaggerSec = DEFAULT_LOADING_STAGGER_SEC,
  loadingCharDurationSec = DEFAULT_LOADING_CHAR_DURATION_SEC,
  placeholder = 'Buscar no histórico…',
  autoComplete = 'off',
  'aria-label': ariaLabel = 'Buscar no histórico de conversas',
  className = '',
}) => {
  const characters = Array.from(loadingText);
  const totalWaveCycle = Math.max(characters.length * loadingStaggerSec, 0.55);

  return (
    <div className={`group relative w-full ${className}`}>
      {/* Animated blue halo gradient blobs behind the input */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 overflow-hidden rounded-xl opacity-75 transition-opacity duration-300 group-focus-within:opacity-100"
      >
        <motion.div
          animate={{
            x: ['-10%', '15%', '-10%'],
            y: ['-10%', '10%', '-10%'],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-3 -top-3 h-14 w-24 rounded-full bg-[#00AAFF]/25 blur-xl"
        />
        <motion.div
          animate={{
            x: ['10%', '-15%', '10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-3 -right-3 h-14 w-24 rounded-full bg-[#005BAC]/25 blur-xl"
        />
      </div>

      <div
        className={`relative flex min-h-9 w-full items-center gap-2 overflow-hidden rounded-xl border border-slate-200/90 px-2.5 py-1.5 shadow-xs transition focus-within:border-[#005BAC] focus-within:ring-2 focus-within:ring-[#00AAFF]/25 dark:border-slate-700 dark:focus-within:border-[#00AAFF] ${
          blobTranslucent ? 'bg-white/75 backdrop-blur-md dark:bg-slate-950/75' : 'bg-white dark:bg-slate-950'
        }`}
      >
        {/* Top shimmer line while loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="halo-loading-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-[#E0F2FE]"
            >
              <motion.div
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#00AAFF] to-[#005BAC]"
                animate={{ x: ['-100%', '220%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Search
          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
            isLoading ? 'text-[#00AAFF]' : 'text-slate-400 group-focus-within:text-[#005BAC]'
          }`}
          aria-hidden="true"
        />

        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoComplete={autoComplete}
            aria-label={ariaLabel}
            placeholder={isLoading ? '' : placeholder}
            className={`w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 ${
              isLoading ? 'opacity-25' : ''
            }`}
          />

          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="halo-loading-chars"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15 }}
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute inset-0 flex items-center text-xs font-medium text-[#005BAC]"
              >
                <span className="inline-flex">
                  {characters.map((char, index) => (
                    <motion.span
                      key={`${index}-${char}`}
                      animate={{
                        opacity: [0.35, 1, 0.35],
                        y: [0, -1, 0],
                      }}
                      transition={{
                        duration: loadingCharDurationSec,
                        repeat: Infinity,
                        repeatDelay: Math.max(totalWaveCycle - loadingCharDurationSec, 0.1),
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

        <AnimatePresence>
          {(value.length > 0 || isLoading) && onClear && (
            <motion.button
              key="halo-clear-btn"
              type="button"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.15 }}
              onClick={onClear}
              aria-label="Limpar busca"
              title="Limpar busca"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
