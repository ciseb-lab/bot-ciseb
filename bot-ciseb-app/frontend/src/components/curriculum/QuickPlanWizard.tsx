import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  FileText,
  Info,
  Layers,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  PlanningDocumentFormat,
  StructuredPlanningInput,
} from '../../../../shared/planningSchema.ts';

interface QuickPlanWizardProps {
  onSubmitToChat: (query: string, planning?: StructuredPlanningInput) => void;
}

interface AreaOption {
  id: string;
  label: string;
  components: string[];
}

const KNOWLEDGE_AREAS: AreaOption[] = [
  {
    id: 'Linguagens',
    label: 'Linguagens',
    components: ['Língua Portuguesa', 'Arte', 'Educação Física'],
  },
  {
    id: 'Matemática',
    label: 'Matemática',
    components: ['Matemática'],
  },
  {
    id: 'Ciências da Natureza',
    label: 'Ciências da Natureza',
    components: ['Ciências', 'Biologia', 'Física', 'Química'],
  },
  {
    id: 'Ciências Humanas',
    label: 'Ciências Humanas',
    components: ['História', 'Geografia', 'Sociologia', 'Filosofia'],
  },
  {
    id: 'Computação / Inovação (CISEB)',
    label: 'Computação / Inovação (CISEB)',
    components: ['Computação', 'Robótica', 'Maker'],
  },
];

const ALL_COMPONENTS = KNOWLEDGE_AREAS.flatMap(area =>
  area.components.map(component => ({ label: component, areaId: area.id })),
);

const FORMATIVE_TRAILS = [
  'Reciclagem e Resíduos Sólidos',
  'Reflorestamento e Recomposição da Vegetação Nativa',
  'Clima e Mudanças Climáticas',
  'Antirracismo',
  'Combate à Violência Contra a Mulher',
];

interface StageOption {
  label: string;
  value: string;
  cycleId: 'EF_I' | 'EF_II' | 'EM';
  cycleLabel: string;
}

const STAGE_CYCLES: Array<{
  cycleId: 'EF_I' | 'EF_II' | 'EM';
  groupTitle: string;
  etapaLabel: string;
  options: StageOption[];
}> = [
  {
    cycleId: 'EF_I',
    groupTitle: 'Anos Iniciais — Ensino Fundamental I',
    etapaLabel: 'Ensino Fundamental I (Anos Iniciais)',
    options: ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'].map(label => ({
      label,
      value: `${label} (EF I)`,
      cycleId: 'EF_I',
      cycleLabel: 'Ensino Fundamental I (Anos Iniciais)',
    })),
  },
  {
    cycleId: 'EF_II',
    groupTitle: 'Anos Finais — Ensino Fundamental II',
    etapaLabel: 'Ensino Fundamental II (Anos Finais)',
    options: ['6º ano', '7º ano', '8º ano', '9º ano'].map(label => ({
      label,
      value: `${label} (EF II)`,
      cycleId: 'EF_II',
      cycleLabel: 'Ensino Fundamental II (Anos Finais)',
    })),
  },
  {
    cycleId: 'EM',
    groupTitle: 'Ensino Médio',
    etapaLabel: 'Ensino Médio',
    options: ['1ª série', '2ª série', '3ª série'].map(label => ({
      label,
      value: `${label} (EM)`,
      cycleId: 'EM',
      cycleLabel: 'Ensino Médio',
    })),
  },
];

const ALL_STAGE_OPTIONS = STAGE_CYCLES.flatMap(cycle => cycle.options);

const SPECIFIC_MODALITIES = [
  {
    id: 'EJA',
    label: 'EJA',
    hint: 'Indique a etapa/totalidade da EJA ou perfil de jovens, adultos e idosos da turma.',
  },
  {
    id: 'Educação Escolar Indígena',
    label: 'Educação Escolar Indígena',
    hint: 'Se desejar, informe o povo, território, língua materna ou saberes comunitários a valorizar.',
  },
  {
    id: 'Educação Escolar Quilombola',
    label: 'Educação Escolar Quilombola',
    hint: 'Se desejar, informe a comunidade quilombola, práticas territoriais, memória e saberes locais.',
  },
  {
    id: 'Multisseriado',
    label: 'Multisseriado',
    hint: 'Selecione acima todos os anos atendidos simultaneamente na mesma turma multisseriada.',
  },
];

const FORMAT_OPTIONS: Array<{
  id: PlanningDocumentFormat;
  title: string;
  duration: string;
  focus: string;
  structure: string;
}> = [
  {
    id: 'Plano de Aula',
    title: 'Plano de Aula',
    duration: '1 a 2 aulas (50 a 100 min)',
    focus: 'Desenvolvimento de um objetivo de aprendizagem específico.',
    structure: 'Objetivos, habilidades, conteúdos, metodologia, atividades, recursos e avaliação.',
  },
  {
    id: 'Sequência Didática',
    title: 'Sequência Didática',
    duration: '4 a 6 etapas progressivas',
    focus: 'Aprofundamento gradual de uma temática.',
    structure: 'Problematização, investigação, desenvolvimento prático, sistematização, socialização e avaliação.',
  },
  {
    id: 'Projeto Integrador / Maker',
    title: 'Projeto Integrador / Maker',
    duration: 'Ciclo completo de desenvolvimento',
    focus: 'Resolução de problemas reais do contexto escolar ou territorial.',
    structure: 'Identificação do problema, pesquisa, planejamento, criação, prototipagem, testes, apresentação e avaliação.',
  },
  {
    id: 'Explorar Ideia',
    title: 'Explorar Ideia',
    duration: 'Conversa orientada no chat',
    focus: 'Desenvolver e amadurecer uma ideia antes do documento fechado.',
    structure: 'Brainstorming guiado com a IA para refinar caminhos antes de gerar o documento definitivo.',
  },
];

const RESOURCE_OPTIONS = [
  {
    label: '100% Desplugada / Sucata',
    value: '100% Desplugada / Sucata',
    docs: [
      'BNCC Computação (MEC)',
      'Referencial Curricular de Computação do Pará',
    ],
  },
  {
    label: 'Laboratório Maker / Robótica',
    value: 'Laboratório Maker / Robótica',
    docs: [
      'Referencial Curricular de Computação do Pará',
      'Decreto nº 9.204 (Educação Conectada)',
      'Guia de Adoção de Dispositivos',
    ],
  },
  {
    label: 'Sala de Informática',
    value: 'Sala de Informática',
    docs: [
      'Guia de Adoção de Dispositivos',
      'Matriz de Saberes Digitais Docentes',
      'Decreto nº 9.204 (Educação Conectada)',
    ],
  },
  {
    label: 'Celulares dos estudantes',
    value: 'Celulares dos estudantes',
    docs: [
      'Guia de Adoção de Dispositivos',
      'Matriz de Saberes Digitais Docentes',
      'Referencial Curricular de Computação do Pará',
    ],
  },
  {
    label: 'Aula de Campo / Território',
    value: 'Aula de Campo / Território',
    docs: [
      'Coerência Pedagógica',
      'Diretrizes Curriculares Nacionais (DCNs)',
      'Referencial Curricular de Computação do Pará',
    ],
  },
];

const CONTEXT_KEYWORD_DOCUMENTS: Array<{ pattern: RegExp; docs: string[] }> = [
  {
    pattern: /ribeirinh|campo|igarap|amazon|florest|comunidade|territor|local|saberes/i,
    docs: ['Referencial Curricular de Computação do Pará', 'Diretrizes Curriculares Nacionais (DCNs)'],
  },
  {
    pattern: /ativa|metodolog|avalia|aprendizagem|turma|aluno|estudante|engajamento|coerencia/i,
    docs: ['Coerência Pedagógica', 'Base Nacional Comum Curricular (BNCC)'],
  },
  {
    pattern: /tecnolog|internet|conect|dispositiv|celular|computador|rede|offline|desplugad|recurso/i,
    docs: ['Guia de Adoção de Dispositivos', 'Decreto nº 9.204 (Educação Conectada)', 'BNCC Computação (MEC)'],
  },
  {
    pattern: /docente|professor|forma[cç][aã]o|planejamento|digital/i,
    docs: ['Matriz de Saberes Digitais Docentes'],
  },
  {
    pattern: /aula|semanal|semanais|carga|hor[aá]ri|eja|ind[ií]gena|quilombola|multisseriad/i,
    docs: ['LDB — Lei nº 9.394/1996', 'Diretrizes Curriculares Nacionais (DCNs)'],
  },
];

const HIGH_SCHOOL_SPECIALIZED_COMPONENTS = new Set([
  'Biologia',
  'Física',
  'Química',
  'Sociologia',
  'Filosofia',
]);

function toggleMulti(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value];
}

export const QuickPlanWizard: React.FC<QuickPlanWizardProps> = ({ onSubmitToChat }) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [showAllComponentAreas, setShowAllComponentAreas] = useState(false);
  const [selectedTrails, setSelectedTrails] = useState<string[]>([]);
  const [subtheme, setSubtheme] = useState('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [modalityDetails, setModalityDetails] = useState('');
  const [docType, setDocType] = useState<PlanningDocumentFormat>('Sequência Didática');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [schoolContext, setSchoolContext] = useState('');
  const [openBlocks, setOpenBlocks] = useState<Record<1 | 2 | 3 | 4, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const toggleBlock = (blockId: 1 | 2 | 3 | 4) => {
    setOpenBlocks(previous => ({ ...previous, [blockId]: !previous[blockId] }));
  };

  const effectiveAreas = useMemo(() => (
    Array.from(new Set([
      ...selectedAreas,
      ...ALL_COMPONENTS
        .filter(item => selectedComponents.includes(item.label))
        .map(item => item.areaId),
    ]))
  ), [selectedAreas, selectedComponents]);

  const effectiveEtapas = useMemo(() => (
    Array.from(new Set(
      ALL_STAGE_OPTIONS
        .filter(option => selectedYears.includes(option.value))
        .map(option => option.cycleLabel),
    ))
  ), [selectedYears]);

  const selectedCycleIds = useMemo(() => (
    Array.from(new Set(
      ALL_STAGE_OPTIONS
        .filter(option => selectedYears.includes(option.value))
        .map(option => option.cycleId),
    ))
  ), [selectedYears]);

  // Avisos inteligentes de compatibilidade curricular (sem apagar dados do professor)
  const compatibilityWarnings = useMemo(() => {
    const warnings: Array<{ id: string; text: string; actionLabel?: string; onAction?: () => void }> = [];

    if (selectedYears.length > 1 && !selectedModalities.includes('Multisseriado')) {
      const crossesCycles = selectedCycleIds.length > 1;
      warnings.push({
        id: 'multi-year',
        text: crossesCycles
          ? 'Você selecionou anos/séries de etapas diferentes. Se for uma turma multisseriada ou projeto integrado entre turmas, marque "Multisseriado" para calibrar as atividades.'
          : 'Mais de um ano/série foi selecionado. Se os estudantes estiverem agrupados na mesma sala, você pode marcar a modalidade "Multisseriado".',
        actionLabel: 'Marcar Multisseriado',
        onAction: () => setSelectedModalities(prev => (prev.includes('Multisseriado') ? prev : [...prev, 'Multisseriado'])),
      });
    }

    const hasSpecializedComponent = selectedComponents.some(comp => HIGH_SCHOOL_SPECIALIZED_COMPONENTS.has(comp));
    if (hasSpecializedComponent && selectedCycleIds.length === 1 && selectedCycleIds[0] === 'EF_I') {
      warnings.push({
        id: 'specialized-ef1',
        text: 'Componentes como Biologia, Física, Química, Sociologia e Filosofia são ofertados no Ensino Médio (ou integrados em Ciências/Humanas no EF). O MIRI adaptará esses conceitos à faixa etária dos Anos Iniciais.',
      });
    }

    return warnings;
  }, [selectedComponents, selectedCycleIds, selectedModalities, selectedYears]);

  const hasBlock1 = effectiveAreas.length > 0
    || selectedComponents.length > 0
    || selectedTrails.length > 0
    || subtheme.trim().length > 0;
  const hasBlock2 = selectedYears.length > 0 || selectedModalities.length > 0;
  const hasBlock3 = Boolean(docType);
  const hasBlock4 = selectedResources.length > 0 || schoolContext.trim().length > 0;

  const filledBlocksCount = [hasBlock1, hasBlock2, hasBlock3, hasBlock4].filter(Boolean).length;

  const requiresAudienceForPrecision = docType !== 'Explorar Ideia' && !hasBlock2;
  const canSubmit = hasBlock1;

  const displayedAreaGroups = useMemo(() => {
    if (selectedAreas.length === 0 || showAllComponentAreas) {
      return KNOWLEDGE_AREAS;
    }
    return KNOWLEDGE_AREAS.filter(
      area => selectedAreas.includes(area.id)
        || area.components.some(component => selectedComponents.includes(component)),
    );
  }, [selectedAreas, selectedComponents, showAllComponentAreas]);

  const activeModalityHints = useMemo(
    () => SPECIFIC_MODALITIES.filter(modality => selectedModalities.includes(modality.id)),
    [selectedModalities],
  );

  const block4MatchedDocuments = useMemo(() => {
    const docs = new Set<string>();
    for (const option of RESOURCE_OPTIONS) {
      if (selectedResources.includes(option.value)) {
        for (const doc of option.docs) docs.add(doc);
      }
    }
    const trimmedContext = schoolContext.trim();
    if (trimmedContext.length >= 3) {
      for (const rule of CONTEXT_KEYWORD_DOCUMENTS) {
        if (rule.pattern.test(trimmedContext)) {
          for (const doc of rule.docs) docs.add(doc);
        }
      }
      if (docs.size === 0) {
        docs.add('Coerência Pedagógica');
        docs.add('Referencial Curricular de Computação do Pará');
      }
    }
    return [...docs];
  }, [schoolContext, selectedResources]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const planning: StructuredPlanningInput = {
      area_conhecimento: effectiveAreas,
      componentes_curriculares: selectedComponents,
      trilhas_formativas: selectedTrails,
      subtema: subtheme.trim(),
      etapa_ensino: effectiveEtapas,
      anos_series: selectedYears,
      modalidades: selectedModalities,
      ...(modalityDetails.trim() ? { detalhes_modalidade: modalityDetails.trim() } : {}),
      formato_documento: docType,
      recursos_escola: selectedResources,
      contexto_escolar: schoolContext.trim(),
    };

    const query = [
      'Quero estruturar uma proposta pedagógica com base nos parâmetros abaixo (considere apenas o que foi preenchido; "Não informado" indica que ainda está em aberto):',
      '',
      '[Bloco 1 — Identidade Curricular]',
      `- area_conhecimento: ${planning.area_conhecimento.length > 0 ? planning.area_conhecimento.join(', ') : 'Não informado'}`,
      `- componentes_curriculares: ${planning.componentes_curriculares.length > 0 ? planning.componentes_curriculares.join(', ') : 'Não informado'}`,
      `- trilhas_formativas: ${planning.trilhas_formativas.length > 0 ? planning.trilhas_formativas.join('; ') : 'Não informado'}`,
      `- subtema: ${planning.subtema || 'Não informado'}`,
      '',
      '[Bloco 2 — Público-Alvo]',
      `- etapa_ensino: ${planning.etapa_ensino.length > 0 ? planning.etapa_ensino.join(', ') : 'Não informado'}`,
      `- anos_series: ${planning.anos_series.length > 0 ? planning.anos_series.join(', ') : 'Não informado'}`,
      `- modalidades: ${planning.modalidades.length > 0 ? planning.modalidades.join(', ') : 'Regular / Não especificada'}`,
      ...(planning.detalhes_modalidade ? [`- detalhes_modalidade: ${planning.detalhes_modalidade}`] : []),
      '',
      '[Bloco 3 — Estrutura Pedagógica]',
      `- formato_documento: ${planning.formato_documento}`,
      '',
      '[Bloco 4 — Infraestrutura e Território]',
      `- recursos_escola: ${planning.recursos_escola.length > 0 ? planning.recursos_escola.join(', ') : 'Não informado'}`,
      `- contexto_escolar: ${planning.contexto_escolar || 'Não informado'}`,
    ].join('\n');

    onSubmitToChat(query, planning);
  };

  return (
    <div className="mx-auto flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      {/* Cabeçalho fixo com indicador discreto de progresso */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-7 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>Roteiro guiado · Planejamento Inteligente</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400" aria-live="polite">
            <span>Progresso: <strong className="font-semibold text-[#005BAC] dark:text-[#00AAFF]">{filledBlocksCount}/4 blocos</strong></span>
            <div className="flex gap-1" aria-hidden="true">
              {[hasBlock1, hasBlock2, hasBlock3, hasBlock4].map((done, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-5 rounded-full transition-colors ${
                    done ? 'bg-[#005BAC] dark:bg-[#00AAFF]' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
          Criar proposta passo a passo
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Combine componentes, trilhas, séries e recursos reais da escola para gerar propostas alinhadas à BNCC e ao DCEPA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* BLOCO 1 — IDENTIDADE CURRICULAR */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 transition dark:border-slate-800 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => toggleBlock(1)}
              aria-expanded={openBlocks[1]}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                  <Compass className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                      Bloco 1 — Identidade Curricular
                    </h3>
                    <span className="rounded bg-[#005BAC]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#005BAC] dark:bg-[#00AAFF]/15 dark:text-[#9bdcff]">
                      Essencial *
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Onde ensinar e o que ensinar?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasBlock1 && (
                  <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-block dark:text-emerald-300">
                    {[
                      selectedComponents.length > 0 ? `${selectedComponents.length} comp.` : '',
                      selectedTrails.length > 0 ? `${selectedTrails.length} trilha(s)` : '',
                      subtheme.trim() ? 'subtema' : '',
                    ].filter(Boolean).join(' · ') || `${effectiveAreas.length} área(s)`}
                  </span>
                )}
                {openBlocks[1] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openBlocks[1] && (
              <div className="space-y-4 border-t border-slate-200/70 px-4 pb-4 pt-3.5 dark:border-slate-800">
                {/* Campo 1. Área do Conhecimento e Componente Curricular */}
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        1. Área do Conhecimento e Componente Curricular <span className="font-normal text-slate-400">· seleção única ou múltipla</span>
                      </span>
                      {selectedAreas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAreas([])}
                          className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                        >
                          Limpar áreas
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {KNOWLEDGE_AREAS.map(area => {
                        const active = selectedAreas.includes(area.id);
                        const derivedActive = !active && effectiveAreas.includes(area.id);
                        return (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => setSelectedAreas(prev => toggleMulti(prev, area.id))}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              active
                                ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                                : derivedActive
                                  ? 'border border-[#005BAC]/50 bg-[#E0F2FE]/60 text-[#005BAC] dark:border-[#00AAFF]/50 dark:bg-[#005BAC]/25 dark:text-[#9bdcff]'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                            }`}
                          >
                            {area.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Componente Curricular agrupado por Área */}
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Componente <span className="font-normal text-slate-400">· selecione um ou mais para projetos interdisciplinares</span>
                      </span>
                      <div className="flex items-center gap-3">
                        {selectedAreas.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAllComponentAreas(prev => !prev)}
                            className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-[#005BAC] hover:underline dark:text-slate-400 dark:hover:text-[#00AAFF]"
                          >
                            {showAllComponentAreas ? 'Filtrar pelas áreas marcadas' : 'Mostrar todas as áreas'}
                          </button>
                        )}
                        {selectedComponents.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedComponents([])}
                            className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                          >
                            Limpar ({selectedComponents.length})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200/70 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                      {displayedAreaGroups.map(area => (
                        <div key={area.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                          <span className="w-44 shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {area.label}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {area.components.map(componentLabel => {
                              const active = selectedComponents.includes(componentLabel);
                              return (
                                <button
                                  key={componentLabel}
                                  type="button"
                                  onClick={() => setSelectedComponents(prev => toggleMulti(prev, componentLabel))}
                                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    active
                                      ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                                      : 'border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-[#005BAC]/40 hover:bg-white hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                                  }`}
                                >
                                  {componentLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campo 2. Trilha Formativa / Tema Integrador */}
                <div className="border-t border-slate-200/70 pt-3.5 dark:border-slate-800">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      2. Trilha Formativa / Tema Integrador <span className="font-normal text-slate-400">· pílulas clicáveis</span>
                    </span>
                    {selectedTrails.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTrails([])}
                        className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FORMATIVE_TRAILS.map(trail => {
                      const active = selectedTrails.includes(trail);
                      return (
                        <button
                          key={trail}
                          type="button"
                          onClick={() => setSelectedTrails(prev => toggleMulti(prev, trail))}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                            active
                              ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                          }`}
                        >
                          {trail}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <label htmlFor="wizard-subtheme" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Recorte específico ou subtema <span className="font-normal text-slate-400">· opcional</span>
                    </label>
                    <input
                      id="wizard-subtheme"
                      type="text"
                      value={subtheme}
                      onChange={event => setSubtheme(event.target.value)}
                      placeholder="Ex.: Bioeconomia na Amazônia, algoritmos e viés racial, preservação dos igarapés, saberes tradicionais..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#00AAFF]"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* BLOCO 2 — PÚBLICO-ALVO */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 transition dark:border-slate-800 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => toggleBlock(2)}
              aria-expanded={openBlocks[2]}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                      Bloco 2 — Público-Alvo
                    </h3>
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Recomendado para BNCC/DCEPA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Para quem a proposta será desenvolvida?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasBlock2 && (
                  <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-block dark:text-emerald-300">
                    {[
                      selectedYears.length > 0 ? `${selectedYears.length} ano(s)/série(s)` : '',
                      selectedModalities.length > 0 ? selectedModalities.join(', ') : '',
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
                {openBlocks[2] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openBlocks[2] && (
              <div className="space-y-3 border-t border-slate-200/70 px-4 pb-4 pt-3.5 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    3. Etapa e Ano/Série atendida <span className="font-normal text-slate-400">· agrupado por ciclos</span>
                  </span>
                  {hasBlock2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYears([]);
                        setSelectedModalities([]);
                        setModalityDetails('');
                      }}
                      className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                    >
                      Limpar público-alvo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {STAGE_CYCLES.map(cycle => (
                    <div
                      key={cycle.cycleId}
                      className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {cycle.groupTitle}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cycle.options.map(option => {
                          const active = selectedYears.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSelectedYears(prev => toggleMulti(prev, option.value))}
                              className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                active
                                  ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                                  : 'border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-[#005BAC]/40 hover:bg-white hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Modalidades Específicas */}
                  <div className="rounded-lg border border-slate-200/80 bg-white/90 p-2.5 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Modalidades Específicas
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SPECIFIC_MODALITIES.map(modality => {
                        const active = selectedModalities.includes(modality.id);
                        return (
                          <button
                            key={modality.id}
                            type="button"
                            onClick={() => setSelectedModalities(prev => toggleMulti(prev, modality.id))}
                            className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                              active
                                ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                                : 'border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-[#005BAC]/40 hover:bg-white hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                            }`}
                          >
                            {modality.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Campo complementar contextualizado quando uma modalidade específica é selecionada */}
                {activeModalityHints.length > 0 && (
                  <div className="rounded-xl border border-[#005BAC]/20 bg-[#E0F2FE]/40 p-3 dark:border-[#00AAFF]/25 dark:bg-[#005BAC]/20">
                    <div className="mb-1.5 flex items-start gap-2 text-xs text-[#005BAC] dark:text-[#9bdcff]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <div>
                        <span className="font-semibold">
                          Contextualização da modalidade ({activeModalityHints.map(m => m.label).join(', ')})
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                          {activeModalityHints.map(m => m.hint).join(' ')}
                        </p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={modalityDetails}
                      onChange={event => setModalityDetails(event.target.value)}
                      placeholder="Opcional: especifique etapa da EJA, anos agrupados, comunidade, língua ou organização da turma..."
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}

                {/* Avisos inteligentes de compatibilidade */}
                {compatibilityWarnings.map(warning => (
                  <div
                    key={warning.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      <span>{warning.text}</span>
                    </div>
                    {warning.actionLabel && warning.onAction && (
                      <button
                        type="button"
                        onClick={warning.onAction}
                        className="cursor-pointer rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/60 dark:text-amber-100"
                      >
                        {warning.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* BLOCO 3 — ESTRUTURA PEDAGÓGICA */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 transition dark:border-slate-800 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => toggleBlock(3)}
              aria-expanded={openBlocks[3]}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                    Bloco 3 — Estrutura Pedagógica
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Como a proposta será desenvolvida?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-[#005BAC]/10 px-2 py-0.5 text-[10px] font-semibold text-[#005BAC] sm:inline-block dark:bg-[#00AAFF]/15 dark:text-[#9bdcff]">
                  {docType}
                </span>
                {openBlocks[3] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openBlocks[3] && (
              <div className="space-y-2.5 border-t border-slate-200/70 px-4 pb-4 pt-3.5 dark:border-slate-800">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  4. Formato do Documento <span className="font-normal text-slate-400">· cada formato aciona uma arquitetura própria na IA</span>
                </span>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {FORMAT_OPTIONS.map(option => {
                    const selected = docType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDocType(option.id)}
                        className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 text-left transition ${
                          selected
                            ? 'border-[#005BAC] bg-[#E0F2FE]/55 shadow-2xs dark:border-[#00AAFF] dark:bg-[#005BAC]/25'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex w-full items-start justify-between gap-2">
                          <div>
                            <div className={`text-xs font-bold ${selected ? 'text-[#005BAC] dark:text-[#9bdcff]' : 'text-slate-900 dark:text-slate-100'}`}>
                              {option.title}
                            </div>
                            <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {option.duration}
                            </span>
                          </div>
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-[#005BAC] bg-[#005BAC] text-white dark:border-[#00AAFF] dark:bg-[#00AAFF] dark:text-slate-950'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {selected && <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-200">
                          {option.focus}
                        </p>
                        <p className="mt-1 text-[10.5px] leading-snug text-slate-500 dark:text-slate-400">
                          <strong className="font-semibold">Estrutura:</strong> {option.structure}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* BLOCO 4: INFRAESTRUTURA E TERRITÓRIO */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 transition dark:border-slate-800 dark:bg-slate-950/50">
            <button
              type="button"
              onClick={() => toggleBlock(4)}
              aria-expanded={openBlocks[4]}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                    Bloco 4: Infraestrutura e Território
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A “Realidade da Escola”
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasBlock4 && (
                  <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-block dark:text-emerald-300">
                    {[
                      selectedResources.length > 0 ? `${selectedResources.length} recurso(s)` : '',
                      schoolContext.trim() ? 'contexto informado' : '',
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
                {openBlocks[4] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {openBlocks[4] && (
              <div className="space-y-3.5 border-t border-slate-200/70 px-4 pb-4 pt-3.5 dark:border-slate-800">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      5. Recursos disponíveis na escola <span className="font-normal text-slate-400">· pílulas de múltipla escolha</span>
                    </span>
                    {selectedResources.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedResources([])}
                        className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {RESOURCE_OPTIONS.map(item => {
                      const active = selectedResources.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setSelectedResources(prev => toggleMulti(prev, item.value))}
                          className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition ${
                            active
                              ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="wizard-notes" className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-slate-200">
                    6. Contexto da turma ou escola
                  </label>
                  <input
                    id="wizard-notes"
                    type="text"
                    value={schoolContext}
                    onChange={event => setSchoolContext(event.target.value)}
                    placeholder="Ex.: Escola ribeirinha, turma com 35 alunos, foco em aprendizagem ativa, 2 aulas semanais..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#00AAFF]"
                  />
                </div>

                {block4MatchedDocuments.length > 0 && (
                  <div className="rounded-xl border border-[#005BAC]/20 bg-[#E0F2FE]/45 p-3 dark:border-[#00AAFF]/25 dark:bg-[#005BAC]/20">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#005BAC] dark:text-[#9bdcff]">
                      <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Documentos anexados no sistema que serão consultados por este bloco:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {block4MatchedDocuments.map(docTitle => (
                        <span
                          key={docTitle}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#005BAC]/20 bg-white px-2.5 py-1 text-[11px] font-medium text-[#005BAC] dark:border-[#00AAFF]/30 dark:bg-slate-900 dark:text-[#9bdcff]"
                        >
                          {docTitle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Rodapé fixo com validação e orientação clara */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            {!canSubmit ? (
              <span className="font-medium text-amber-700 dark:text-amber-300">
                Preencha ao menos um item do <strong>Bloco 1</strong> (área, componente, trilha ou subtema) para iniciar.
              </span>
            ) : requiresAudienceForPrecision ? (
              <span>
                Dica: selecione o <strong>Ano/Série no Bloco 2</strong> para ancorar códigos exatos da BNCC/DCEPA, ou envie assim para o MIRI perguntar no chat.
              </span>
            ) : (
              <span>
                Proposta pronta para geração alinhada à <strong>BNCC e ao DCEPA</strong> via MIRI.
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#005BAC] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Levar para o chat</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};
