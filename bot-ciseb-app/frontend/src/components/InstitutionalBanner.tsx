import React from 'react';
import { ShieldCheck, Cpu, Globe, Users, Leaf, Award, ExternalLink, BookCheck } from 'lucide-react';

export const InstitutionalBanner: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Presentation */}
      <div className="bg-gradient-to-br from-[#005BAC] to-[#013780] rounded-2xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#00AAFF]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#00AAFF] uppercase mb-2">
            <span>SEDUC Pará · DINOV</span>
            <span>·</span>
            <span>Manual de Identidade Visual e Kit de Marca 1.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display mb-3">
            CISEB · Centro de Inovação e Sustentabilidade da Educação Básica
          </h1>
          <p className="text-sm sm:text-base text-[#E0F2FE] leading-relaxed">
            O <strong>CISEB</strong> é o epicentro de transformação tecnológica, pedagógica e socioambiental da rede pública de ensino do Estado do Pará. O <strong>Guia de Tecnologia e Inovação (BOT CISEB)</strong> atua como auditor e referencial técnico oficial para aplicação das normativas curriculares nas 898+ escolas da rede estadual.
          </p>
        </div>
      </div>

      {/* 3 Pillars of Computação na Educação Básica (MEC 2022) */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#005BAC]" />
          Eixos Estruturantes da Computação na Educação Básica (BNCC / CNE 2022)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#005BAC]/10 text-[#005BAC] flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Pensamento Computacional</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capacidade de compreender, definir, modelar, comparar, solucionar e automatizar problemas por meio de algoritmos, decomposição, reconhecimento de padrões e abstração.
            </p>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Códigos: EF01CO01 a EF09CO02, EM13CO01 a EM13CO06
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#00AAFF]/15 text-[#005BAC] flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Mundo Digital</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compreensão das tecnologias computacionais físicas e virtuais, arquitetura de computadores, lógica binária, redes de comunicação, Internet das Coisas (IoT) e segurança da informação.
            </p>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Códigos: EF01CO03 a EF09CO07, EM13CO07 a EM13CO12
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#059669]/10 text-[#059669] flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Cultura Digital</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uso consciente, ético, crítico e cidadão das tecnologias, combate à desinformação, ciberbullying, respeito à privacidade (LGPD), impacto do e-waste e Inteligência Artificial ética.
            </p>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Códigos: EF02CO03 a EF09CO09, EM13CO13 a EM13CO18
            </div>
          </div>
        </div>
      </div>

      {/* Sustainable Development Goals & Amazon Context */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#059669] uppercase tracking-wider">
          <Leaf className="w-4 h-4" />
          <span>Diretrizes DINOV · Sustentabilidade e Amazônia</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Inovação Pedagógica com Identidade Amazônica e Rumo à COP30
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          As escolas da rede estadual do Pará integram a inovação tecnológica aos saberes tradicionais, conservação da floresta e transição ecológica justa. O CISEB fomenta:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
            <span className="font-bold text-slate-800 block mb-1">ODS 4: Educação de Qualidade</span>
            <span className="text-slate-600 leading-relaxed">
              Letramento computacional para todos os estudantes do Pará, democratizando o acesso a laboratórios maker e pensamento computacional.
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
            <span className="font-bold text-slate-800 block mb-1">ODS 12: Consumo Responsável</span>
            <span className="text-slate-600 leading-relaxed">
              Robótica sustentável com sucata eletrônica (upcycling de e-waste), reduzindo o impacto ambiental do descarte de hardware.
            </span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
            <span className="font-bold text-slate-800 block mb-1">ODS 13: Ação Contra a Mudança Global</span>
            <span className="text-slate-600 leading-relaxed">
              Monitoramento microclimático escolar, análise de dados de satélite da Amazônia e projetos de mitigação desenvolvidos pelos jovens paraenses.
            </span>
          </div>
        </div>
      </div>

      {/* Normative Protocol Summary */}
      <div className="bg-[#005BAC]/5 border border-[#005BAC]/20 p-6 rounded-xl space-y-3">
        <h4 className="text-sm font-bold text-[#005BAC] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Protocolos do BOT CISEB para Gestores e Educadores
        </h4>
        <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
          <li>
            <strong>Tolerância Zero a Alucinações:</strong> Códigos de habilidades não podem ser inferidos ou criados por inteligência artificial genérica. Todas as correspondências são verificadas na base curricular oficial homologada da SEDUC-PA e MEC 2022.
          </li>
          <li>
            <strong>Relatório Obrigatório:</strong> Todo planejamento contém obrigatoriamente a tabela com Código, Texto Original, Documento de Origem e Ano/Etapa em literalidade integral.
          </li>
          <li>
            <strong>Localização Automática:</strong> O educador nunca precisa decorar ou digitar códigos; o BOT CISEB mapeia os descritores a partir do tema e componente curricular informados.
          </li>
        </ul>
      </div>
    </div>
  );
};
