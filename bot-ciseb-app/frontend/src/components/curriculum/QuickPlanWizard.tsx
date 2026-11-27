import React, { useState } from 'react';
import { ArrowRight, Check, Compass, Layers, MapPin, Sparkles, Users } from 'lucide-react';

interface QuickPlanWizardProps {
  onSubmitToChat: (query: string) => void;
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
    components: ['Língua Portuguesa', 'Arte', 'Ed. Física'],
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

const STAGE_GROUPS = [
  {
    groupLabel: 'Anos Iniciais (EF I)',
    options: [
      { label: '1º ano', value: '1º ano (Ensino Fundamental - Anos Iniciais)' },
      { label: '2º ano', value: '2º ano (Ensino Fundamental - Anos Iniciais)' },
      { label: '3º ano', value: '3º ano (Ensino Fundamental - Anos Iniciais)' },
      { label: '4º ano', value: '4º ano (Ensino Fundamental - Anos Iniciais)' },
      { label: '5º ano', value: '5º ano (Ensino Fundamental - Anos Iniciais)' },
    ],
  },
  {
    groupLabel: 'Anos Finais (EF II)',
    options: [
      { label: '6º ano', value: '6º ano (Ensino Fundamental - Anos Finais)' },
      { label: '7º ano', value: '7º ano (Ensino Fundamental - Anos Finais)' },
      { label: '8º ano', value: '8º ano (Ensino Fundamental - Anos Finais)' },
      { label: '9º ano', value: '9º ano (Ensino Fundamental - Anos Finais)' },
    ],
  },
  {
    groupLabel: 'Ensino Médio (EM)',
    options: [
      { label: '1ª série', value: '1ª série (Ensino Médio)' },
      { label: '2ª série', value: '2ª série (Ensino Médio)' },
      { label: '3ª série', value: '3ª série (Ensino Médio)' },
    ],
  },
  {
    groupLabel: 'Modalidades Específicas',
    options: [
      { label: 'EJA', value: 'Educação de Jovens e Adultos (EJA)' },
      { label: 'Educação Escolar Indígena / Quilombola', value: 'Educação Escolar Indígena / Quilombola' },
      { label: 'Multisseriado', value: 'Turma Multisseriada' },
    ],
  },
];

const FORMAT_OPTIONS = [
  {
    id: 'Plano de Aula',
    title: 'Plano de Aula',
    desc: '1 a 2 aulas (50–100 min) • Foco em objetivo pontual.',
  },
  {
    id: 'Sequência Didática',
    title: 'Sequência Didática',
    desc: '4 a 6 etapas progressivas • Investigação, prática e sistematização.',
  },
  {
    id: 'Projeto Integrador / Maker',
    title: 'Projeto Integrador / Maker',
    desc: 'Ciclo completo • Resolução de problema real + prototipagem.',
  },
  {
    id: 'Explorar Ideia',
    title: 'Explorar Ideia',
    desc: 'Brainstorming guiado no chat antes de fechar o documento.',
  },
];

const RESOURCE_OPTIONS = [
  { label: '100% Desplugada / Sucata', value: '100% Desplugada / Sucata e materiais recicláveis' },
  { label: 'Laboratório Maker / Robótica', value: 'Laboratório Maker / Robótica' },
  { label: 'Sala de Informática', value: 'Sala de Informática' },
  { label: 'Celulares dos estudantes', value: 'Celulares dos estudantes' },
  { label: 'Aula de Campo / Território', value: 'Aula de Campo / Território' },
];

function toggleMulti(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value];
}

export const QuickPlanWizard: React.FC<QuickPlanWizardProps> = ({ onSubmitToChat }) => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedTrails, setSelectedTrails] = useState<string[]>([]);
  const [subtheme, setSubtheme] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [docType, setDocType] = useState('Sequência Didática');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [schoolContext, setSchoolContext] = useState('');

  const canSubmit = selectedTrails.length > 0
    || subtheme.trim().length > 0
    || selectedComponents.length > 0
    || selectedAreas.length > 0;

  const visibleComponents = selectedAreas.length > 0
    ? ALL_COMPONENTS.filter(
        item => selectedAreas.includes(item.areaId) || selectedComponents.includes(item.label),
      )
    : ALL_COMPONENTS;

  const handleToggleComponent = (label: string) => {
    setSelectedComponents(previous => toggleMulti(previous, label));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const effectiveAreas = Array.from(new Set([
      ...selectedAreas,
      ...ALL_COMPONENTS
        .filter(item => selectedComponents.includes(item.label))
        .map(item => item.areaId),
    ]));

    const query = [
      'Quero estruturar uma proposta pedagógica com base nos parâmetros abaixo (considere apenas o que foi preenchido; "Não informado" indica que ainda está em aberto):',
      '',
      '[Bloco 1 — Identidade Curricular]',
      `- Área(s) do Conhecimento: ${effectiveAreas.length > 0 ? effectiveAreas.join(', ') : 'Não informado'}`,
      `- Componente(s) Curricular(es): ${selectedComponents.length > 0 ? selectedComponents.join(', ') : 'Não informado'}`,
      `- Trilha Formativa / Tema Integrador: ${selectedTrails.length > 0 ? selectedTrails.join('; ') : 'Não informado'}`,
      `- Recorte específico ou subtema: ${subtheme.trim() || 'Não informado'}`,
      '',
      '[Bloco 2 — Público-Alvo]',
      `- Etapa e Ano/Série/Modalidade: ${selectedStages.length > 0 ? selectedStages.join(', ') : 'Não informado'}`,
      '',
      '[Bloco 3 — Estrutura Pedagógica]',
      `- Formato do Documento: ${docType}`,
      '',
      '[Bloco 4 — Infraestrutura e Território]',
      `- Recursos disponíveis na escola: ${selectedResources.length > 0 ? selectedResources.join(', ') : 'Não informado'}`,
      `- Contexto da turma ou escola: ${schoolContext.trim() || 'Não informado'}`,
      '',
      'Siga o encadeamento pedagógico (ancoragem curricular BNCC/DCEPA, contextualização crítica na trilha informada, cadenciamento fiel ao formato e aos recursos marcados, e calibragem ao contexto da turma). Diferencie evidências documentais de sugestões próprias.',
    ].join('\n');

    onSubmitToChat(query);
  };

  return (
    <div className="mx-auto flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      {/* Cabeçalho fixo */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-7 dark:border-slate-800">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          <span>Roteiro guiado · CISEB</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
          Criar proposta passo a passo
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Preencha os blocos que fizerem sentido para o seu planejamento — você pode combinar múltiplas áreas, trilhas e recursos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          {/* BLOCO 1: IDENTIDADE CURRICULAR */}
          <section className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                  Bloco 1 · Identidade Curricular
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">O “onde” e o “o quê” do planejamento</p>
              </div>
            </div>

            {/* 1. Área do Conhecimento e Componente Curricular */}
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    1. Área do Conhecimento <span className="font-normal text-slate-400">· seleção única ou múltipla</span>
                  </span>
                  {selectedAreas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAreas([])}
                      className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {KNOWLEDGE_AREAS.map(area => {
                    const active = selectedAreas.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => setSelectedAreas(prev => toggleMulti(prev, area.id))}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                        }`}
                      >
                        {area.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Componente Curricular{' '}
                    <span className="font-normal text-slate-400">
                      {selectedAreas.length > 0 ? '· filtrado pelas áreas selecionadas' : '· projetos disciplinares ou interdisciplinares'}
                    </span>
                  </span>
                  {selectedComponents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedComponents([])}
                      className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {visibleComponents.map(item => {
                    const active = selectedComponents.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleToggleComponent(item.label)}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
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
            </div>

            {/* 2. Trilha Formativa / Tema Integrador */}
            <div className="border-t border-slate-200/70 pt-3.5 dark:border-slate-800">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  2. Trilha Formativa / Tema Integrador
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
                  Recorte específico ou subtema <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  id="wizard-subtheme"
                  type="text"
                  value={subtheme}
                  onChange={event => setSubtheme(event.target.value)}
                  placeholder="Ex.: Bioeconomia na Amazônia, algoritmos e viés racial..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-[#00AAFF]"
                />
              </div>
            </div>
          </section>

          {/* BLOCO 2: PÚBLICO-ALVO */}
          <section className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                    Bloco 2 · Público-Alvo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">3. Etapa e Ano/Série atendida</p>
                </div>
              </div>
              {selectedStages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStages([])}
                  className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {STAGE_GROUPS.map(group => (
                <div key={group.groupLabel} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="w-40 shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {group.groupLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map(option => {
                      const active = selectedStages.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedStages(prev => toggleMulti(prev, option.value))}
                          className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BLOCO 3: ESTRUTURA PEDAGÓGICA */}
          <section className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                  Bloco 3 · Estrutura Pedagógica
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">4. Formato do Documento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FORMAT_OPTIONS.map(option => {
                const selected = docType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDocType(option.id)}
                    className={`flex cursor-pointer items-start justify-between gap-2 rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#005BAC] bg-[#E0F2FE]/55 text-[#005BAC] shadow-2xs dark:border-[#00AAFF] dark:bg-[#005BAC]/25 dark:text-[#9bdcff]'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{option.title}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{option.desc}</div>
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
                  </button>
                );
              })}
            </div>
          </section>

          {/* BLOCO 4: INFRAESTRUTURA E TERRITÓRIO */}
          <section className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#005BAC] dark:text-[#00AAFF]">
                  Bloco 4 · Infraestrutura e Território
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">A realidade da escola e da turma</p>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  5. Recursos disponíveis na escola <span className="font-normal text-slate-400">· múltipla escolha</span>
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
              <label htmlFor="wizard-notes" className="mb-1 block text-xs font-semibold text-slate-800 dark:text-slate-200">
                6. Contexto da turma ou escola <span className="font-normal text-slate-400">(opcional)</span>
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
          </section>
        </div>

        {/* Rodapé fixo */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3.5 sm:px-7 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] text-slate-400">
            {canSubmit
              ? 'Pronto para estruturar com apoio do MIRI'
              : 'Selecione ao menos uma área, componente, trilha ou subtema'}
          </span>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#005BAC] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Levar para o chat</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
};
