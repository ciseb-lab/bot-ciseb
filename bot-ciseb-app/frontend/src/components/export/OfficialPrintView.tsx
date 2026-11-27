import React from 'react';
import { X, Printer, Download, Check, ShieldCheck } from 'lucide-react';
import { extractMarkdownTables } from '../../utils/formatters.ts';
import { MarkdownText } from '../chat/MarkdownText.tsx';

interface OfficialPrintViewProps {
  content: string;
  onClose: () => void;
}

export const OfficialPrintView: React.FC<OfficialPrintViewProps> = ({ content, onClose }) => {
  const { cleanText, tables } = extractMarkdownTables(content);
  const printDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const protocolId = `PA-CISEB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-300">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 sm:px-6 sm:py-3.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#005BAC]">
              Visualização para Impressão e Registro Escolar
            </span>
            <span className="hidden text-xs text-slate-400 sm:inline">·</span>
            <span className="font-mono text-xs text-slate-600">Protocolo {protocolId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#005BAC] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#004E96]"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualização de impressão"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="print-container flex-1 space-y-6 overflow-y-auto bg-white p-4 text-slate-900 xs:p-6 sm:p-12">
          {/* Institutional Document Header */}
          <div className="flex flex-col justify-between gap-4 border-b-2 border-[#005BAC] pb-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/assets/ciseb-logo-dark.svg"
                alt="CISEB SEDUC Pará"
                className="h-11 w-auto sm:h-14"
                width={240}
                height={55}
              />
            </div>
            <div className="text-left text-xs leading-tight text-slate-600 sm:text-right">
              <div className="font-bold text-slate-900">GOVERNO DO ESTADO DO PARÁ</div>
              <div>Secretaria de Estado de Educação — SEDUC</div>
              <div>Diretoria de Inovação — DINOV</div>
              <div>Centro de Inovação e Sustentabilidade da Educação Básica — CISEB</div>
              <div className="mt-1 font-mono text-[10px] text-slate-400">
                Autenticação: {protocolId} · {printDate}
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-2">
            <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
              Documento de Alinhamento e Planejamento Pedagógico
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Emitido pelo Guia Técnico de Tecnologia e Inovação da Rede Estadual de Ensino (BOT CISEB)
            </p>
          </div>

          {/* Mandatory Verbatim Table */}
          {tables.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#005BAC] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Relatório Oficial de Validação Curricular (Protocolo CISEB)
              </div>
              {tables.map((table, tIdx) => (
                <div key={tIdx} className="border border-slate-300 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-semibold">
                        {table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2 border-r border-slate-200 last:border-r-0 align-top ${
                                cIdx === 0
                                  ? 'font-bold font-mono text-[#005BAC] whitespace-nowrap'
                                  : 'text-slate-700'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Body Content */}
          <MarkdownText className="pt-2 text-sm text-slate-800">
            {cleanText}
          </MarkdownText>

          {/* Institutional Signatures Section */}
          <div className="grid grid-cols-1 gap-8 border-t border-slate-200 pt-10 text-center text-xs text-slate-600 sm:grid-cols-2 sm:pt-12">
            <div>
              <div className="mx-auto mb-1 w-full max-w-48 border-b border-slate-400"></div>
              <div className="font-semibold text-slate-800">Docente / Professor(a) Responsável</div>
              <div className="text-[11px] text-slate-400">Rede Estadual de Ensino do Pará</div>
            </div>
            <div>
              <div className="mx-auto mb-1 w-full max-w-48 border-b border-slate-400"></div>
              <div className="font-semibold text-slate-800">Coordenação Pedagógica / Direção</div>
              <div className="text-[11px] text-slate-400">Visto e Homologação Escolar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
