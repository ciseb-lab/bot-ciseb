import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, FileText, LoaderCircle, PencilLine, Printer, X } from 'lucide-react';
import { useModalFocus } from '../../hooks/useModalFocus.ts';
import { MarkdownText } from '../chat/MarkdownText.tsx';

interface PdfExportModalProps {
  title: string;
  content: string;
  isExporting: boolean;
  error: string | null;
  onClose: () => void;
  onExport: (title: string, content: string) => void | Promise<void>;
}

interface InstitutionalDocumentSheetProps {
  title: string;
  subtitle: string;
  authorOrSchool: string;
  content: string;
  emissionDate: string;
  className?: string;
}

const InstitutionalDocumentSheet: React.FC<InstitutionalDocumentSheetProps> = ({
  title,
  subtitle,
  authorOrSchool,
  content,
  emissionDate,
  className = '',
}) => (
  <article
    className={`pdf-print-sheet mx-auto w-full max-w-[794px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`}
  >
    {/* Faixa institucional superior */}
    <div className="h-1.5 w-full bg-gradient-to-r from-[#005BAC] via-[#0077CC] to-[#00AAFF]" />

    <div className="space-y-6 px-6 py-7 sm:px-10 sm:py-9">
      {/* Cabeçalho institucional SEDUC / DINOV / CISEB */}
      <header className="flex flex-col justify-between gap-4 border-b-2 border-[#005BAC] pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/dinov-logo-dark.svg"
            alt="DINOV — Diretoria de Inovação"
            className="h-11 w-auto object-contain"
          />
          <span className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <img
            src="/assets/ciseb-logo-dark.svg"
            alt="CISEB — Centro de Inovação e Sustentabilidade da Educação Básica"
            className="h-11 w-auto object-contain"
          />
        </div>
        <div className="text-left text-[11px] leading-snug text-slate-600 sm:text-right">
          <div className="font-bold tracking-wide text-slate-900">GOVERNO DO ESTADO DO PARÁ</div>
          <div>Secretaria de Estado de Educação — SEDUC</div>
          <div>Diretoria de Inovação e Sustentabilidade (DINOV · CISEB)</div>
          <div className="mt-1 font-medium text-[#005BAC]">Emitido em {emissionDate}</div>
        </div>
      </header>

      {/* Bloco de identificação do material */}
      <section className="rounded-lg border border-[#005BAC]/15 border-l-4 border-l-[#005BAC] bg-[#F4F9FD] px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#005BAC]">
          Material Pedagógico · Apoio à Formação Docente (MIRI · CISEB)
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug text-slate-900">
          {title.trim() || 'Material de apoio'}
        </h1>
        {(subtitle.trim() || authorOrSchool.trim()) && (
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#005BAC]/10 pt-2 text-xs text-slate-600">
            {subtitle.trim() && (
              <span>
                <strong className="font-semibold text-slate-800">Etapa / Componente:</strong> {subtitle.trim()}
              </span>
            )}
            {authorOrSchool.trim() && (
              <span>
                <strong className="font-semibold text-slate-800">Escola / Formador(a):</strong> {authorOrSchool.trim()}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Corpo do documento com Markdown + KaTeX + Química */}
      <section className="pdf-document-body text-[13.5px] leading-relaxed text-slate-800">
        <MarkdownText>{content}</MarkdownText>
      </section>

      {/* Rodapé institucional e campo de visto */}
      <footer className="pdf-keep-together mt-8 border-t border-slate-200 pt-6">
        <div className="grid grid-cols-1 gap-6 text-center text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <div className="mx-auto mb-1.5 w-52 border-b border-slate-400" />
            <div className="font-semibold text-slate-800">Docente / Formador(a) Responsável</div>
            <div className="text-[11px] text-slate-400">Rede Estadual de Ensino do Pará</div>
          </div>
          <div>
            <div className="mx-auto mb-1.5 w-52 border-b border-slate-400" />
            <div className="font-semibold text-slate-800">Coordenação Pedagógica / CISEB</div>
            <div className="text-[11px] text-slate-400">Visto e Acompanhamento Pedagógico</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
          <span>CISEB · DINOV · SEDUC-PA</span>
          <span>Documento estruturado com apoio do MIRI · {emissionDate}</span>
        </div>
      </footer>
    </div>
  </article>
);

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  title: initialTitle,
  content: initialContent,
  isExporting,
  error,
  onClose,
  onExport,
}) => {
  const dialogRef = useModalFocus<HTMLDivElement>(true, () => {
    if (!isExporting) onClose();
  });
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState('');
  const [authorOrSchool, setAuthorOrSchool] = useState('');
  const [content, setContent] = useState(initialContent);

  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => () => {
    document.body.classList.remove('pdf-print-active');
  }, []);

  const handlePrintFormattedPdf = () => {
    if (!title.trim() || !content.trim()) return;
    document.body.classList.add('pdf-print-active');
    const cleanup = () => {
      document.body.classList.remove('pdf-print-active');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.requestAnimationFrame(() => {
      window.print();
    });
  };

  const buildDirectExportContent = () => {
    const metadataLines = [
      subtitle.trim() ? `**Etapa / Componente:** ${subtitle.trim()}` : '',
      authorOrSchool.trim() ? `**Escola / Formador(a):** ${authorOrSchool.trim()}` : '',
    ].filter(Boolean);

    return metadataLines.length > 0
      ? `${metadataLines.join('\n')}\n\n---\n\n${content}`
      : content;
  };

  return (
    <>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-2.5 backdrop-blur-xs sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-export-title"
      >
        <section className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#005BAC]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="pdf-export-title" className="text-sm font-bold text-slate-900">
                  Modelo institucional de exportação (A4)
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Visualize o documento formatado com fórmulas ou ajuste o conteúdo antes de salvar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#005BAC] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Pré-visualizar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                    activeTab === 'edit'
                      ? 'bg-white text-[#005BAC] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar texto
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                aria-label="Fechar revisão do PDF"
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-100/80 px-4 py-5 sm:px-6">
            {activeTab === 'preview' ? (
              <InstitutionalDocumentSheet
                title={title}
                subtitle={subtitle}
                authorOrSchool={authorOrSchool}
                content={content}
                emissionDate={emissionDate}
              />
            ) : (
              <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <label htmlFor="pdf-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Título do documento
                  </label>
                  <input
                    id="pdf-title"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                    maxLength={180}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pdf-subtitle" className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Etapa / Componente <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input
                      id="pdf-subtitle"
                      value={subtitle}
                      onChange={event => setSubtitle(event.target.value)}
                      maxLength={120}
                      placeholder="Ex.: 6º ano EF · Matemática e Computação"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
                    />
                  </div>
                  <div>
                    <label htmlFor="pdf-author" className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Escola / Formador(a) <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input
                      id="pdf-author"
                      value={authorOrSchool}
                      onChange={event => setAuthorOrSchool(event.target.value)}
                      maxLength={120}
                      placeholder="Ex.: CISEB Belém · Prof. Responsável"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pdf-content" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Conteúdo do material (Markdown + LaTeX)
                  </label>
                  <textarea
                    id="pdf-content"
                    value={content}
                    onChange={event => setContent(event.target.value)}
                    rows={16}
                    maxLength={150000}
                    className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 font-mono text-xs leading-6 text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
                  />
                  <p className="mt-1.5 text-right text-[11px] text-slate-400">
                    {content.length.toLocaleString('pt-BR')} caracteres
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="mx-auto mt-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-2.5 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[11px] text-slate-500">
              A4 institucional · <strong>Salvar PDF formatado</strong> preserva fórmulas KaTeX, tabelas e logos em vetor
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void onExport(title, buildDirectExportContent())}
                disabled={isExporting || !title.trim() || !content.trim()}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#005BAC]/30 bg-[#F4F9FD] px-3.5 py-2 text-xs font-semibold text-[#005BAC] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExporting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
                {isExporting ? 'Gerando PDF…' : 'Baixar PDF direto'}
              </button>
              <button
                type="button"
                onClick={handlePrintFormattedPdf}
                disabled={isExporting || !title.trim() || !content.trim()}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#005BAC] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Salvar PDF formatado
              </button>
            </div>
          </footer>
        </section>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <div className="pdf-print-root hidden" aria-hidden="true">
          <InstitutionalDocumentSheet
            title={title}
            subtitle={subtitle}
            authorOrSchool={authorOrSchool}
            content={content}
            emissionDate={emissionDate}
          />
        </div>,
        document.body,
      )}
    </>
  );
};
