import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface QuickPlanWizardProps {
  onSubmitToChat: (query: string) => void;
}

const QUICK_THEMES = [
  'Lógica e algoritmos desplugados',
  'Sensores de umidade e horta sustentável',
  'IA ética e povos da Amazônia',
  'Lixo eletrônico e economia circular',
];

const STAGE_OPTIONS = [
  { label: 'Anos Iniciais (1º–5º EF)', value: 'Ensino Fundamental - Anos Iniciais (1º ao 5º ano)' },
  { label: 'Anos Finais (6º–9º EF)', value: 'Ensino Fundamental - Anos Finais (6º ao 9º ano)' },
  { label: 'Ensino Médio', value: 'Ensino Médio (1º ao 3º ano)' },
  { label: '1º ano EF', value: '1º ano EF' },
  { label: '2º ano EF', value: '2º ano EF' },
  { label: '3º ano EF', value: '3º ano EF' },
  { label: '4º ano EF', value: '4º ano EF' },
  { label: '5º ano EF', value: '5º ano EF' },
  { label: '6º ano EF', value: '6º ano EF' },
  { label: '7º ano EF', value: '7º ano EF' },
  { label: '8º ano EF', value: '8º ano EF' },
  { label: '9º ano EF', value: '9º ano EF' },
  { label: '1º ano EM', value: '1º ano EM' },
  { label: '2º ano EM', value: '2º ano EM' },
  { label: '3º ano EM', value: '3º ano EM' },
];

const COMPONENT_OPTIONS = [
  { label: 'Computação', value: 'Computação' },
  { label: 'Ciências da Natureza', value: 'Ciências da Natureza' },
  { label: 'Matemática', value: 'Matemática' },
  { label: 'Língua Portuguesa', value: 'Língua Portuguesa' },
  { label: 'Robótica & Maker', value: 'Robótica Educacional' },
  { label: 'Sustentabilidade & Amazônia', value: 'Tecnologia e Sustentabilidade' },
];

const FORMAT_OPTIONS = [
  {
    id: 'Ainda quero explorar a ideia',
    title: 'Explorar ideia',
    desc: 'Conversar antes de definir formato',
  },
  {
    id: 'Plano de Aula',
    title: 'Plano de Aula',
    desc: '1 a 2 aulas (50–100 min)',
  },
  {
    id: 'Sequência Didática',
    title: 'Sequência Didática',
    desc: '4 a 6 etapas progressivas',
  },
  {
    id: 'Matriz de Alinhamento Curricular',
    title: 'Alinhamento BNCC',
    desc: 'Objetivos, códigos e evidências',
  },
];

const RESOURCE_OPTIONS = [
  { label: '100% Desplugada / Sucata', value: 'Abordagem 100% Desplugada / Sucata e Materiais Recicláveis' },
  { label: 'Laboratório Maker / Robótica', value: 'Laboratório Maker CISEB / Kits de Robótica' },
  { label: 'Sala de Informática', value: 'Sala de Informática com Computadores e Internet' },
  { label: 'Celulares dos estudantes', value: 'Uso pedagógico dos smartphones dos estudantes' },
  { label: 'Mista / Aula de campo', value: 'Mista (Dispositivos digitais + Atividades práticas de campo)' },
];

export const QuickPlanWizard: React.FC<QuickPlanWizardProps> = ({ onSubmitToChat }) => {
  const [stage, setStage] = useState('');
  const [component, setComponent] = useState('');
  const [theme, setTheme] = useState('');
  const [docType, setDocType] = useState('Ainda quero explorar a ideia');
  const [schoolResource, setSchoolResource] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!theme.trim()) return;

    const query = `Quero conversar sobre esta ideia e receber ajuda para desenvolvê-la. Considere somente as informações que preenchi; "Não informado" significa que ainda não tenho uma preferência.
Ano/Série ou Etapa: ${stage || 'Não informado'}.
Componente Curricular: ${component || 'Não informado'}.
Ideia, tema ou objetivo: ${theme.trim()}.
Formato desejado: ${docType}.
Recursos disponíveis na escola: ${schoolResource || 'Não informado'}.
${additionalNote.trim() ? `Contexto adicional: ${additionalNote.trim()}.` : ''}

Comece pela necessidade descrita. Se alguma informação for essencial e estiver faltando, pergunte antes de presumir. Consulte documentos quando forem pertinentes e diferencie sugestões de orientações documentais.`;

    onSubmitToChat(query);
  };

  const toggleValue = (current: string, next: string, setter: (val: string) => void) => {
    setter(current === next ? '' : next);
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7 dark:border-slate-800 dark:bg-slate-900">
      {/* Cabeçalho enxuto */}
      <div className="border-b border-slate-100 pb-4 pr-8 dark:border-slate-800">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#005BAC] dark:bg-[#005BAC]/30 dark:text-[#9bdcff]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          <span>Roteiro guiado</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
          Criar proposta passo a passo
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Informe o tema e marque apenas o que já souber — o restante construímos juntos no chat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* 1. Tema / Ideia (Principal) */}
        <div>
          <label htmlFor="wizard-theme" className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-slate-200">
            1. Sobre o que você quer planejar? <span className="font-normal text-[#005BAC] dark:text-[#00AAFF]">*</span>
          </label>
          <input
            id="wizard-theme"
            type="text"
            required
            value={theme}
            onChange={event => setTheme(event.target.value)}
            placeholder="Ex.: Algoritmos no cotidiano, horta com sensores, combate à desinformação…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#005BAC] focus:bg-white focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-[#00AAFF] dark:focus:bg-slate-900"
          />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Exemplos:</span>
            {QUICK_THEMES.map(suggestion => (
              <button
                type="button"
                key={suggestion}
                onClick={() => setTheme(suggestion)}
                className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  theme === suggestion
                    ? 'bg-[#005BAC] text-white dark:bg-[#00AAFF] dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-[#E0F2FE] hover:text-[#005BAC] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Formato (Cards compactos 2x2) */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-slate-200">
            2. Formato desejado
          </span>
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
                      ? 'border-[#005BAC] bg-[#E0F2FE]/45 text-[#005BAC] shadow-2xs dark:border-[#00AAFF] dark:bg-[#005BAC]/25 dark:text-[#9bdcff]'
                      : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{option.title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{option.desc}</div>
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
        </div>

        {/* 3. Etapa & 4. Componente em chips clicáveis (sem dropdowns gigantes) */}
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/50">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Etapa ou ano <span className="font-normal text-slate-400">· clique para selecionar</span>
              </span>
              {stage && (
                <button
                  type="button"
                  onClick={() => setStage('')}
                  className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_OPTIONS.map(item => {
                const active = stage === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleValue(stage, item.value, setStage)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-3 dark:border-slate-800">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Componente curricular
              </span>
              {component && (
                <button
                  type="button"
                  onClick={() => setComponent('')}
                  className="cursor-pointer text-[11px] font-medium text-[#005BAC] hover:underline dark:text-[#00AAFF]"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMPONENT_OPTIONS.map(item => {
                const active = component === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleValue(component, item.value, setComponent)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                        : 'border border-slate-200/80 bg-white text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Recursos e Contexto em linha enxuta */}
        <div className="space-y-3">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Recursos disponíveis na escola
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RESOURCE_OPTIONS.map(item => {
                const active = schoolResource === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleValue(schoolResource, item.value, setSchoolResource)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-[#005BAC] text-white shadow-2xs dark:bg-[#00AAFF] dark:text-slate-950'
                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#005BAC]/40 hover:text-[#005BAC] dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-[#00AAFF]/40'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="wizard-notes" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Contexto da turma ou escola <span className="font-normal text-slate-400">· se quiser detalhar</span>
            </label>
            <input
              id="wizard-notes"
              type="text"
              value={additionalNote}
              onChange={event => setAdditionalNote(event.target.value)}
              placeholder="Ex.: Turma ribeirinha, aula de 50 min, alunos iniciantes…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-[#005BAC] focus:bg-white focus:ring-2 focus:ring-[#00AAFF]/25 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-[#00AAFF] dark:focus:bg-slate-900"
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-[11px] text-slate-400">
            Alinhado às diretrizes oficiais via <strong className="font-semibold text-[#005BAC] dark:text-[#00AAFF]">MIRI</strong>
          </span>
          <button
            type="submit"
            disabled={!theme.trim()}
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
