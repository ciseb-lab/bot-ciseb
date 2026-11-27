import React, { useState } from 'react';
import { X, Search, BookOpen, ArrowRight, Check, Copy } from 'lucide-react';
import { CURRICULUM_CATALOG_RECORDS, CurriculumSkill } from '../../../../shared/curriculumData.ts';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: CurriculumSkill) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, onSelectSkill }) => {
  const [search, setSearch] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = CURRICULUM_CATALOG_RECORDS.filter(s => {
    const matchSearch =
      search === '' ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.verbatimText.toLowerCase().includes(search.toLowerCase()) ||
      s.objectsOfKnowledge.toLowerCase().includes(search.toLowerCase());

    const matchComp = selectedComponent === 'ALL' || s.component === selectedComponent;
    return matchSearch && matchComp;
  });

  const copySkill = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 backdrop-blur-xs sm:p-4">
      <div className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 sm:items-center sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-5 w-5 shrink-0 text-[#005BAC] dark:text-[#00AAFF]" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Registros curriculares do catálogo local
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registros para exploração; confirme a origem nos PDFs antes de citar como norma
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar registros curriculares"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-white p-3 sm:flex-row sm:gap-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, tema (ex.: algoritmos, IA, ecossistemas)..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#00AAFF] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={selectedComponent}
            onChange={e => setSelectedComponent(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AAFF] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Todos os Componentes</option>
            <option value="Computação">Computação (MEC 2022)</option>
            <option value="Ciências da Natureza">Ciências da Natureza (Currículo PA)</option>
            <option value="Matemática">Matemática (Currículo PA)</option>
            <option value="Língua Portuguesa">Língua Portuguesa (Currículo PA)</option>
            <option value="Robótica Educacional">Robótica Educacional (DINOV)</option>
          </select>
        </div>

        {/* Skills List */}
        <div className="flex-1 space-y-3 divide-y divide-slate-100 overflow-y-auto p-3 sm:p-4 dark:divide-slate-800">
          {filtered.map(skill => (
            <div key={skill.code} className="flex flex-col justify-between pt-3 first:pt-0">
              <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="rounded bg-[#E0F2FE] px-2 py-0.5 font-mono text-xs font-bold text-[#005BAC]">
                    {skill.code}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {skill.stage} · {skill.component} · {skill.axisOrThematicUnit}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copySkill(skill.verbatimText, skill.code)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Copiar texto registrado localmente"
                  >
                    {copiedCode === skill.code ? (
                      <Check className="h-3.5 w-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSkill(skill);
                      onClose();
                    }}
                    className="flex min-h-8 cursor-pointer items-center gap-1 rounded-md bg-[#005BAC] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#004E96]"
                  >
                    <span>Inserir</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60">
                "{skill.verbatimText}"
              </div>

              <div className="text-[11px] text-slate-400 mt-1">
                Origem indicada no catálogo: {skill.sourceDocument} · Objeto: {skill.objectsOfKnowledge}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
