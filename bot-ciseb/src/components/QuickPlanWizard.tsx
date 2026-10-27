import React, { useState } from 'react';
import { FileText, Layers } from 'lucide-react';

interface QuickPlanWizardProps {
  onSubmitToChat: (query: string) => void;
}

export const QuickPlanWizard: React.FC<QuickPlanWizardProps> = ({ onSubmitToChat }) => {
  const [stage, setStage] = useState('');
  const [component, setComponent] = useState('');
  const [theme, setTheme] = useState('');
  const [docType, setDocType] = useState('Ainda quero explorar a ideia');
  const [schoolResource, setSchoolResource] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    const query = `Quero conversar sobre esta ideia e receber ajuda para desenvolvê-la. Considere somente as informações que preenchi; "Não informado" significa que ainda não tenho uma preferência.
Ano/Série ou Etapa: ${stage || 'Não informado'}.
Componente Curricular: ${component || 'Não informado'}.
Ideia, tema ou objetivo: ${theme}.
Formato desejado: ${docType}.
Recursos disponíveis na escola: ${schoolResource || 'Não informado'}.
${additionalNote.trim() ? `Contexto adicional: ${additionalNote.trim()}.` : ''}

Comece pela necessidade descrita. Se alguma informação for essencial e estiver faltando, pergunte antes de presumir. Consulte documentos quando forem pertinentes e diferencie sugestões de orientações documentais.`;

    onSubmitToChat(query);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Wizard Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#005BAC] uppercase tracking-wider mb-1">
          <Layers className="w-4 h-4" />
          <span>Estruturador de Planejamento Técnico</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          Estruture um pedido, se isso ajudar
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          Este formulário é opcional. Você pode deixar campos sem resposta; o pedido continuará no chat para ser desenvolvido em conjunto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Etapa / Ano */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ano / Série ou Etapa (opcional)
            </label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
            >
              <option value="">Não informado</option>
              <optgroup label="Ensino Fundamental - Anos Iniciais">
                <option value="1º ano EF">1º ano do Ensino Fundamental</option>
                <option value="2º ano EF">2º ano do Ensino Fundamental</option>
                <option value="3º ano EF">3º ano do Ensino Fundamental</option>
                <option value="4º ano EF">4º ano do Ensino Fundamental</option>
                <option value="5º ano EF">5º ano do Ensino Fundamental</option>
              </optgroup>
              <optgroup label="Ensino Fundamental - Anos Finais">
                <option value="6º ano EF">6º ano do Ensino Fundamental</option>
                <option value="7º ano EF">7º ano do Ensino Fundamental</option>
                <option value="8º ano EF">8º ano do Ensino Fundamental</option>
                <option value="9º ano EF">9º ano do Ensino Fundamental</option>
              </optgroup>
              <optgroup label="Ensino Médio">
                <option value="1º ano EM">1º ano do Ensino Médio</option>
                <option value="2º ano EM">2º ano do Ensino Médio</option>
                <option value="3º ano EM">3º ano do Ensino Médio</option>
                <option value="1º ao 3º ano EM">Ensino Médio Integrado (Geral)</option>
              </optgroup>
            </select>
          </div>

          {/* Step 2: Componente Curricular */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Componente Curricular (opcional)
            </label>
            <select
              value={component}
              onChange={e => setComponent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
            >
              <option value="">Não informado</option>
              <option value="Computação">Computação (Pensamento Computacional, Mundo e Cultura Digital)</option>
              <option value="Ciências da Natureza">Ciências da Natureza</option>
              <option value="Matemática">Matemática</option>
              <option value="Língua Portuguesa">Língua Portuguesa e Tecnologias Midiáticas</option>
              <option value="Robótica Educacional">Robótica Educacional e Cultura Maker</option>
              <option value="Tecnologia e Sustentabilidade">Tecnologia, Sustentabilidade e Amazônia (SEDUC)</option>
            </select>
          </div>
        </div>

        {/* Step 3: Tema / Objeto de Conhecimento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Sua ideia, tema ou desafio
          </label>
          <input
            type="text"
            required
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="Ex.: Algoritmos condicionais com Scratch; Monitoramento de igarapés com sensores; Cidadania digital e combate a fake news..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] text-slate-400">Sugestões rápidas:</span>
            {[
              "Lógica e algoritmos desplugados",
              "Sensores de umidade e horta sustentável",
              "Inteligência Artificial ética e povos da Amazônia",
              "Lixo eletrônico e economia circular escolar",
            ].map((s, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setTheme(s)}
                className="text-[11px] text-[#005BAC] hover:underline cursor-pointer bg-slate-100 px-2 py-0.5 rounded"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Tipo de Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Formato (opcional)
            </label>
            <div className="space-y-2 text-xs">
              {[
                { id: 'Ainda quero explorar a ideia', desc: 'Converse comigo antes de escolher um formato' },
                { id: 'Plano de Aula', desc: 'Plano estruturado para 1 a 2 tempos de aula (50-100min)' },
                { id: 'Sequência Didática', desc: 'Sequência progressiva com 4 a 6 etapas metodológicas' },
                { id: 'Matriz de Alinhamento Curricular', desc: 'Mapeamento formal de objetivos, códigos oficiais e evidências' },
              ].map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    docType === item.id
                      ? 'border-[#005BAC] bg-[#005BAC]/5 text-[#005BAC] font-semibold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="docType"
                    checked={docType === item.id}
                    onChange={() => setDocType(item.id)}
                    className="mt-0.5 text-[#005BAC] focus:ring-[#00AAFF]"
                  />
                  <div>
                    <div>{item.id}</div>
                    <div className="text-[11px] font-normal text-slate-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Step 5: Recursos da Escola */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recursos disponíveis (opcional)
            </label>
            <select
              value={schoolResource}
              onChange={e => setSchoolResource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00AAFF] mb-3"
            >
              <option value="">Não informado / quero explorar alternativas</option>
              <option value="Laboratório Maker CISEB / Kits de Robótica">Laboratório Maker CISEB / Kits de Robótica</option>
              <option value="Sala de Informática com Computadores e Internet">Sala de Informática com Computadores e Internet</option>
              <option value="Uso pedagógico dos smartphones dos estudantes">Uso pedagógico dos smartphones dos estudantes</option>
              <option value="Abordagem 100% Desplugada / Sucata e Materiais Recicláveis">Abordagem 100% Desplugada / Sucata e Materiais Recicláveis</option>
              <option value="Mista (Dispositivos digitais + Atividades práticas de campo)">Mista (Dispositivos digitais + Atividades práticas de campo)</option>
            </select>

            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Específicas (Opcional)
            </label>
            <textarea
              value={additionalNote}
              onChange={e => setAdditionalNote(e.target.value)}
              placeholder="Ex.: Escola localizada em região ribeirinha; estudantes com pouca vivência prévia em computação..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00AAFF]"
            ></textarea>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Validação automática via <strong className="text-[#005BAC]">BOT CISEB</strong>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#005BAC] hover:bg-[#004E96] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Continuar no chat</span>
          </button>
        </div>
      </form>
    </div>
  );
};
