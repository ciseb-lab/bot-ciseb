import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CURRICULUM_CATALOG_RECORDS, CurriculumSkill } from '../../../../shared/curriculumData.ts';
import { apiFetch, readApiJson } from '../../utils/api.ts';
import { HaloSearchInput } from '../ui/halo-search.tsx';

interface CurriculumBrowserProps {
  onSelectSkillForPlan: (skill: CurriculumSkill) => void;
}

type StageFilter = 'ALL' | 'EF_INICIAL' | 'EF_FINAL' | 'EM';

interface PdfVerificationState {
  status: 'loading' | 'verified' | 'catalog_only' | 'not_found' | 'error';
  label?: string;
}

const STAGE_TABS: Array<{ id: StageFilter; label: string }> = [
  { id: 'ALL', label: 'Todas as etapas' },
  { id: 'EF_INICIAL', label: '1º ao 5º ano (EF)' },
  { id: 'EF_FINAL', label: '6º ao 9º ano (EF)' },
  { id: 'EM', label: 'Ensino Médio' },
];

export const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ onSelectSkillForPlan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<StageFilter>('ALL');
  const [selectedComponent, setSelectedComponent] = useState('ALL');
  const [selectedAxis, setSelectedAxis] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<Record<string, PdfVerificationState>>({});

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedStage !== 'ALL' ||
    selectedComponent !== 'ALL' ||
    selectedAxis !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStage('ALL');
    setSelectedComponent('ALL');
    setSelectedAxis('ALL');
  };

  const filteredSkills = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return CURRICULUM_CATALOG_RECORDS.filter(skill => {
      const matchSearch =
        !query ||
        skill.code.toLowerCase().includes(query) ||
        skill.verbatimText.toLowerCase().includes(query) ||
        skill.objectsOfKnowledge.toLowerCase().includes(query) ||
        skill.component.toLowerCase().includes(query) ||
        skill.stage.toLowerCase().includes(query) ||
        Boolean(skill.dinovGuidelines && skill.dinovGuidelines.toLowerCase().includes(query));

      const matchStage =
        selectedStage === 'ALL' ||
        (selectedStage === 'EF_INICIAL' &&
          (skill.stage.includes('1º ano') ||
            skill.stage.includes('2º ano') ||
            skill.stage.includes('3º ano') ||
            skill.stage.includes('4º ano') ||
            skill.stage.includes('5º ano'))) ||
        (selectedStage === 'EF_FINAL' &&
          (skill.stage.includes('6º ano') ||
            skill.stage.includes('7º ano') ||
            skill.stage.includes('8º ano') ||
            skill.stage.includes('9º ano'))) ||
        (selectedStage === 'EM' && skill.stage.includes('EM'));

      const matchComponent = selectedComponent === 'ALL' || skill.component === selectedComponent;
      const matchAxis = selectedAxis === 'ALL' || skill.axisOrThematicUnit.includes(selectedAxis);

      return matchSearch && matchStage && matchComponent && matchAxis;
    });
  }, [searchTerm, selectedStage, selectedComponent, selectedAxis]);

  const handleVerifyInPdf = async (code: string) => {
    setVerifications(prev => ({ ...prev, [code]: { status: 'loading' } }));
    try {
      const response = await apiFetch(`/api/curriculum/validate/${encodeURIComponent(code)}`);
      const data = await readApiJson(response);
      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida');
      }
      const result = data as {
        valid?: boolean;
        foundInCatalog?: boolean;
        document?: { title: string; pageNumber?: number };
        message?: string;
      };

      if (response.ok && result.valid && result.document) {
        const pageLabel = result.document.pageNumber ? ` · p. ${result.document.pageNumber}` : '';
        setVerifications(prev => ({
          ...prev,
          [code]: {
            status: 'verified',
            label: `Confirmado no PDF (${result.document?.title}${pageLabel})`,
          },
        }));
      } else if (result.foundInCatalog) {
        setVerifications(prev => ({
          ...prev,
          [code]: {
            status: 'catalog_only',
            label: 'Presente no catálogo local',
          },
        }));
      } else {
        setVerifications(prev => ({
          ...prev,
          [code]: {
            status: 'not_found',
            label: result.message || 'Não localizado no PDF',
          },
        }));
      }
    } catch {
      setVerifications(prev => ({
        ...prev,
        [code]: {
          status: 'error',
          label: 'Base PDF indisponível no momento',
        },
      }));
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    void navigator.clipboard.writeText(`${code} — ${text}`);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Barra superior limpa: Busca + Filtros rápidos */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs sm:p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <HaloSearchInput
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Buscar por código (ex.: EF01CO01), tema, objeto ou palavra-chave…"
              aria-label="Pesquisar habilidades curriculares"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
            <select
              value={selectedComponent}
              onChange={event => setSelectedComponent(event.target.value)}
              aria-label="Filtrar por componente curricular"
              className="h-9 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 lg:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Todos os componentes</option>
              <option value="Computação">Computação</option>
              <option value="Ciências da Natureza">Ciências da Natureza</option>
              <option value="Matemática">Matemática</option>
              <option value="Língua Portuguesa">Língua Portuguesa</option>
              <option value="Robótica Educacional">Robótica Educacional</option>
            </select>

            <select
              value={selectedAxis}
              onChange={event => setSelectedAxis(event.target.value)}
              aria-label="Filtrar por eixo estruturante"
              className="h-9 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 lg:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Todos os eixos</option>
              <option value="Pensamento Computacional">Pensamento Computacional</option>
              <option value="Mundo Digital">Mundo Digital</option>
              <option value="Cultura Digital">Cultura Digital</option>
              <option value="Sustentabilidade">Sustentabilidade & Amazônia</option>
            </select>
          </div>
        </div>

        {/* Abas de Etapa em pílulas + Contador */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-3.5 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Etapa de ensino">
            {STAGE_TABS.map(tab => {
              const active = selectedStage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedStage(tab.id)}
                  className={`min-h-8 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 ${
                    active
                      ? 'bg-[#005BAC] text-white shadow-xs dark:bg-[#00AAFF] dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex cursor-pointer items-center gap-1 font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Limpar filtros
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {filteredSkills.length} {filteredSkills.length === 1 ? 'habilidade' : 'habilidades'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Habilidades Moderno e Limpo */}
      {filteredSkills.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-10 dark:border-slate-800 dark:bg-slate-900">
          <AlertTriangle className="mx-auto mb-2.5 h-7 w-7 text-amber-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Nenhuma habilidade encontrada
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tente buscar outro termo ou limpar os filtros ativos.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#005BAC] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#004E96]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Mostrar todas as habilidades
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3.5 2xl:grid-cols-3">
          {filteredSkills.map(skill => {
            const verifyState = verifications[skill.code];
            return (
              <article
                key={skill.code}
                className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-[#005BAC]/40 hover:shadow-md sm:p-4 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#00AAFF]/40"
              >
                <div>
                  {/* Topo do Card: Código + Badges + Copiar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-[#E0F2FE] px-2.5 py-1 font-mono text-xs font-bold text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                        {skill.code}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {skill.stage}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {skill.axisOrThematicUnit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(skill.verbatimText, skill.code)}
                      title="Copiar código e descrição"
                      aria-label={`Copiar habilidade ${skill.code}`}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      {copiedCode === skill.code ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {/* Descrição principal limpa */}
                  <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                    {skill.verbatimText}
                  </p>

                  {/* Objeto de Conhecimento + Ideia prática enxutos */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <p>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">Objeto:</strong>{' '}
                      {skill.objectsOfKnowledge}
                    </p>
                    {skill.dinovGuidelines && (
                      <p className="flex items-start gap-1.5 rounded-lg bg-[#E0F2FE]/45 px-2.5 py-1.5 text-[11px] leading-relaxed text-[#004E96] dark:bg-[#005BAC]/20 dark:text-[#9bdcff]">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#005BAC] dark:text-[#00AAFF]" aria-hidden="true" />
                        <span>{skill.dinovGuidelines}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card: Conferir PDF + Explorar no chat */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="min-w-0 flex-1">
                    {!verifyState ? (
                      <button
                        type="button"
                        onClick={() => void handleVerifyInPdf(skill.code)}
                        className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#005BAC] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-[#00AAFF]"
                      >
                        <FileCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Conferir no PDF</span>
                      </button>
                    ) : verifyState.status === 'loading' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-500">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#005BAC]" aria-hidden="true" />
                        Conferindo…
                      </span>
                    ) : (
                      <span
                        className={`inline-flex max-w-full items-center gap-1 truncate px-1 text-[11px] font-medium ${
                          verifyState.status === 'verified'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                        title={verifyState.label}
                      >
                        {verifyState.status === 'verified' && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="truncate">{verifyState.label}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectSkillForPlan(skill)}
                    className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#005BAC] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                  >
                    <span>Usar no chat</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
