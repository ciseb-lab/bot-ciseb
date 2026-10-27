import React, { useState } from 'react';
import { X, Search, BookOpen, ArrowRight, Check, Copy } from 'lucide-react';
import { CURRICULUM_CATALOG_RECORDS, CurriculumSkill } from '../data/curriculumData.ts';

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#005BAC]" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Registros curriculares do catálogo local
              </h3>
              <p className="text-xs text-slate-500">
                Registros para exploração; confirme a origem nos PDFs antes de citar como norma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, tema (ex.: algoritmos, IA, ecossistemas)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
            />
          </div>

          <select
            value={selectedComponent}
            onChange={e => setSelectedComponent(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AAFF]"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {filtered.map(skill => (
            <div key={skill.code} className="pt-3 first:pt-0 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div>
                  <span className="font-mono font-bold text-xs text-[#005BAC] bg-[#E0F2FE] px-2 py-0.5 rounded">
                    {skill.code}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    {skill.stage} · {skill.component} · {skill.axisOrThematicUnit}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copySkill(skill.verbatimText, skill.code)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                    title="Copiar texto registrado localmente"
                  >
                    {copiedCode === skill.code ? (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onSelectSkill(skill);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-[#005BAC] hover:bg-[#004E96] text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Inserir</span>
                    <ArrowRight className="w-3 h-3" />
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
