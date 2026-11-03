import React from 'react';
import { X, Printer, Download, Check, ShieldCheck } from 'lucide-react';
import { extractMarkdownTables } from '../utils/formatters.ts';
import { MarkdownText } from './MarkdownText.tsx';

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
        <div className="px-6 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#005BAC] uppercase tracking-wider">
              Visualização para Impressão e Registro Escolar
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="font-mono text-xs text-slate-600">Protocolo {protocolId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#005BAC] hover:bg-[#004E96] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 print-container bg-white text-slate-900 space-y-6">
          {/* Institutional Document Header */}
          <div className="border-b-2 border-[#005BAC] pb-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/assets/ciseb-logo-dark.svg"
                alt="CISEB SEDUC Pará"
                className="h-14 w-auto"
                width={240}
                height={55}
              />
            </div>
            <div className="text-right text-xs text-slate-600 leading-tight">
              <div className="font-bold text-slate-900">GOVERNO DO ESTADO DO PARÁ</div>
              <div>Secretaria de Estado de Educação - SEDUC</div>
              <div>Diretoria de Inovação e Sustentabilidade da Educação Básica - DINOV</div>
              <div className="font-mono text-[10px] text-slate-400 mt-1">
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
          <div className="pt-12 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-1"></div>
              <div className="font-semibold text-slate-800">Docente / Professor(a) Responsável</div>
              <div className="text-[11px] text-slate-400">Rede Estadual de Ensino do Pará</div>
            </div>
            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-1"></div>
              <div className="font-semibold text-slate-800">Coordenação Pedagógica / Direção</div>
              <div className="text-[11px] text-slate-400">Visto e Homologação Escolar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
