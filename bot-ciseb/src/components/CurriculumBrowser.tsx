import React, { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, CheckCircle, AlertTriangle, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';
import { CURRICULUM_CATALOG_RECORDS, CurriculumSkill } from '../data/curriculumData.ts';
import { apiFetch } from '../utils/api.ts';

interface CurriculumBrowserProps {
  onSelectSkillForPlan: (skill: CurriculumSkill) => void;
}

export const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ onSelectSkillForPlan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedComponent, setSelectedComponent] = useState('ALL');
  const [selectedAxis, setSelectedAxis] = useState('ALL');
  const [testCodeInput, setTestCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    status: 'verified' | 'catalog_only' | 'not_found' | 'error';
    skill?: CurriculumSkill;
    document?: { title: string; pageNumber?: number };
    message?: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter skills
  const filteredSkills = useMemo(() => {
    return CURRICULUM_CATALOG_RECORDS.filter(skill => {
      const matchSearch =
        searchTerm === '' ||
        skill.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.verbatimText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.objectsOfKnowledge.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (skill.dinovGuidelines && skill.dinovGuidelines.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStage =
        selectedStage === 'ALL' ||
        (selectedStage === 'EF_INICIAL' && (skill.stage.includes('1º ano') || skill.stage.includes('2º ano') || skill.stage.includes('3º ano') || skill.stage.includes('4º ano') || skill.stage.includes('5º ano'))) ||
        (selectedStage === 'EF_FINAL' && (skill.stage.includes('6º ano') || skill.stage.includes('7º ano') || skill.stage.includes('8º ano') || skill.stage.includes('9º ano'))) ||
        (selectedStage === 'EM' && skill.stage.includes('EM'));

      const matchComponent =
        selectedComponent === 'ALL' || skill.component === selectedComponent;

      const matchAxis =
        selectedAxis === 'ALL' || skill.axisOrThematicUnit.includes(selectedAxis);

      return matchSearch && matchStage && matchComponent && matchAxis;
    });
  }, [searchTerm, selectedStage, selectedComponent, selectedAxis]);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCodeInput.trim()) return;

    setIsValidating(true);
    try {
      const response = await apiFetch(`/api/curriculum/validate/${encodeURIComponent(testCodeInput.trim())}`);
      const result = await response.json() as {
        valid?: boolean;
        foundInCatalog?: boolean;
        skill?: CurriculumSkill;
        document?: { title: string; pageNumber?: number };
        message?: string;
        error?: string;
      };
      if (response.status === 404) {
        setValidationResult({ status: 'not_found', message: result.message });
      } else if (!response.ok) {
        throw new Error(result.error || 'Não foi possível consultar os PDFs.');
      } else if (result.valid && result.skill && result.document) {
        setValidationResult({ status: 'verified', skill: result.skill, document: result.document });
      } else if (result.foundInCatalog && result.skill) {
        setValidationResult({ status: 'catalog_only', skill: result.skill, message: result.message });
      } else {
        setValidationResult({ status: 'not_found', message: result.message });
      }
    } catch (error) {
      setValidationResult({ status: 'error', message: error instanceof Error ? error.message : 'Falha ao consultar a base documental.' });
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Code Validator Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search and Filters */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#005BAC]" />
              Catálogo curricular local
            </h2>
            <span className="text-xs text-slate-500">
              {filteredSkills.length} habilidades catalogadas
            </span>
          </div>

          <p className="text-xs leading-5 text-amber-800">
            Os registros abaixo são pontos de partida locais, não transcrições confirmadas. Use a conferência ao lado para verificar o código e o texto nos PDFs disponíveis.
          </p>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por código, tema (ex.: algoritmos, sensores, IA, ecossistemas)..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAFF] focus:bg-white transition-all"
            />
          </div>

          {/* Filter segment selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1 font-medium">Etapa de Ensino</label>
              <select
                value={selectedStage}
                onChange={e => setSelectedStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AAFF]"
              >
                <option value="ALL">Todas as Etapas</option>
                <option value="EF_INICIAL">Ensino Fundamental (1º ao 5º ano)</option>
                <option value="EF_FINAL">Ensino Fundamental (6º ao 9º ano)</option>
                <option value="EM">Ensino Médio (1º ao 3º ano)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Componente Curricular</label>
              <select
                value={selectedComponent}
                onChange={e => setSelectedComponent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AAFF]"
              >
                <option value="ALL">Todos os Componentes</option>
                <option value="Computação">Computação (MEC 2022)</option>
                <option value="Ciências da Natureza">Ciências da Natureza (Currículo PA)</option>
                <option value="Matemática">Matemática (Currículo PA)</option>
                <option value="Língua Portuguesa">Língua Portuguesa (Currículo PA)</option>
                <option value="Robótica Educacional">Robótica Educacional (DINOV)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1 font-medium">Eixo Estruturante</label>
              <select
                value={selectedAxis}
                onChange={e => setSelectedAxis(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00AAFF]"
              >
                <option value="ALL">Todos os Eixos</option>
                <option value="Pensamento Computacional">Pensamento Computacional</option>
                <option value="Mundo Digital">Mundo Digital</option>
                <option value="Cultura Digital">Cultura Digital</option>
                <option value="Sustentabilidade">Sustentabilidade & Amazônia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Conferência em documentos PDF */}
        <div className="bg-[#005BAC]/5 border border-[#005BAC]/20 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[#005BAC]" />
              <h3 className="text-sm font-bold text-[#005BAC]">
                Conferir nos PDFs
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Verifique se o código e o texto do registro aparecem juntos em uma página de algum PDF indexado.
            </p>

            <form onSubmit={handleValidateCode} className="flex gap-2 mb-3">
              <input
                type="text"
                value={testCodeInput}
                onChange={e => setTestCodeInput(e.target.value)}
                placeholder="Código, ex.: EF01CO01"
                className="flex-1 uppercase font-mono text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-[#00AAFF] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#005BAC] hover:bg-[#004E96] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                {isValidating ? 'Conferindo…' : 'Conferir'}
              </button>
            </form>

            {validationResult && (
              <div className="text-xs rounded-lg p-3 bg-white border border-slate-200">
                {validationResult.status === 'verified' && validationResult.skill && (
                  <div className="space-y-1 text-slate-700">
                    <div className="flex items-center gap-1.5 text-[#059669] font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Código e texto conferidos no PDF</span>
                    </div>
                    <div className="font-mono font-bold text-[#005BAC] text-sm">
                      {validationResult.skill.code}
                    </div>
                    <div className="text-slate-600 line-clamp-3">
                      {validationResult.skill.verbatimText}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      {validationResult.document?.title}{validationResult.document?.pageNumber ? ` · p. ${validationResult.document.pageNumber}` : ''}
                    </div>
                  </div>
                )}
                {validationResult.status === 'not_found' && (
                  <div className="text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Código não encontrado no catálogo</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      {validationResult.message || 'Não foi localizado um registro com esse código.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {validationResult?.status === 'catalog_only' && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800">
              <strong>Registro apenas no catálogo local.</strong> {validationResult.message}
            </div>
          )}
          {validationResult?.status === 'error' && <p role="alert" className="mt-3 text-[11px] text-red-700">{validationResult.message}</p>}
          <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
            A conferência exige código e texto literal na mesma página do PDF.
          </div>
        </div>
      </div>

      {/* Skills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map(skill => (
          <div
            key={skill.code}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-[#00AAFF]/40 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono font-bold text-sm text-[#005BAC]">
                    {skill.code}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{skill.stage}</span>
                    <span>·</span>
                    <span>{skill.component}</span>
                    <span>·</span>
                    <span>{skill.axisOrThematicUnit}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(skill.verbatimText, skill.code)}
                  title="Copiar texto registrado no catálogo local"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  {copiedCode === skill.code ? (
                    <Check className="w-4 h-4 text-[#059669]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Texto cadastrado localmente */}
              <blockquote className="my-3 text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border-l-2 border-[#005BAC]">
                "{skill.verbatimText}"
              </blockquote>

              {/* Object of Knowledge */}
              <div className="text-xs text-slate-600 mb-2">
                <span className="font-semibold text-slate-700">Objeto de Conhecimento:</span>{' '}
                {skill.objectsOfKnowledge}
              </div>

              {/* DINOV Regional Amazonian Guideline */}
              {skill.dinovGuidelines && (
                <div className="text-xs text-[#005BAC] bg-[#005BAC]/5 p-2.5 rounded-lg mb-3">
                  <span className="font-semibold text-[#004E96]">Sugestão local:</span>{' '}
                  {skill.dinovGuidelines}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Origem indicada no catálogo: {skill.sourceDocument}
              </span>
              <button
                onClick={() => onSelectSkillForPlan(skill)}
                className="px-3 py-1.5 bg-[#005BAC] hover:bg-[#004E96] text-white rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Explorar no chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-medium text-slate-700">Nenhuma habilidade localizada com os filtros selecionados.</p>
          <p className="text-xs text-slate-500 mt-1">Tente remover alguns filtros ou buscar termos mais genéricos.</p>
        </div>
      )}
    </div>
  );
};
