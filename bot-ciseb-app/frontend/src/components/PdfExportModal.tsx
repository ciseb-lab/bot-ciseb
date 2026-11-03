import React, { useState } from 'react';
import { Download, FileText, LoaderCircle, X } from 'lucide-react';
import { useModalFocus } from '../hooks/useModalFocus.ts';

interface PdfExportModalProps {
  title: string;
  content: string;
  isExporting: boolean;
  error: string | null;
  onClose: () => void;
  onExport: (title: string, content: string) => void | Promise<void>;
}

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
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="pdf-export-title">
      <section className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#005BAC]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="pdf-export-title" className="text-sm font-bold text-slate-900">Revisar material para exportação</h2>
              <p className="mt-0.5 text-xs text-slate-500">Edite o texto abaixo; o PDF será gerado com esta versão.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Fechar revisão do PDF"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div>
            <label htmlFor="pdf-title" className="mb-1.5 block text-xs font-semibold text-slate-700">Título do documento</label>
            <input
              id="pdf-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              maxLength={180}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
            />
          </div>
          <div>
            <label htmlFor="pdf-content" className="mb-1.5 block text-xs font-semibold text-slate-700">Conteúdo do material</label>
            <textarea
              id="pdf-content"
              value={content}
              onChange={event => setContent(event.target.value)}
              rows={18}
              maxLength={150000}
              className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-[#005BAC] focus:ring-2 focus:ring-[#005BAC]/15"
            />
            <p className="mt-1.5 text-right text-[11px] text-slate-400">{content.length.toLocaleString('pt-BR')} caracteres</p>
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[11px] text-slate-500">A4 · várias páginas · caracteres em português</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void onExport(title, content)}
              disabled={isExporting || !title.trim() || !content.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005BAC] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {isExporting ? 'Gerando PDF…' : 'Baixar PDF'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
