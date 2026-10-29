import React, { useEffect, useState } from 'react';
import { BookCheck, Download, ExternalLink, FileText, LoaderCircle, X } from 'lucide-react';
import { apiFetch, downloadApiFile, readApiJson } from '../utils/api.ts';
import { useModalFocus } from '../hooks/useModalFocus.ts';

interface DocumentSummary {
  source: string;
  title: string;
  pageCount: number;
  searchable: boolean;
}

interface DocumentStatus {
  documents: DocumentSummary[];
  sourcesWithoutText: string[];
  sourcesUnavailable?: string[];
}

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    apiFetch('/api/documents/status')
      .then(async response => {
        const data = await readApiJson(response);
        if (!data || typeof data !== 'object') throw new Error('A API documental retornou uma resposta inválida.');
        const result = data as DocumentStatus & { error?: unknown };
        if (!response.ok) {
          throw new Error(typeof result.error === 'string' ? result.error : 'Não foi possível carregar as fontes.');
        }
        return result;
      })
      .then(data => {
        if (isMounted) setStatus(data);
      })
      .catch(reason => {
        if (isMounted) setError(reason instanceof Error ? reason.message : 'Falha ao consultar a base documental.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="docs-modal-title">
      <section className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#005BAC]"><BookCheck className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 id="docs-modal-title" className="text-sm font-bold text-slate-900">Fontes e normativas disponíveis</h2>
              <p className="mt-0.5 text-xs text-slate-500">Arquivos presentes na base consultada pelo assistente.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar fontes e normativas" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-6">
          {isLoading && <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Carregando documentos…</div>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {status && (
            <>
              <p className="mb-3 text-xs text-slate-500">{status.documents.length} arquivos indexados. A paginação indicada nas respostas corresponde à página física do PDF.</p>
              <ul className="divide-y divide-slate-100">
                {status.documents.map(document => (
                  <li key={document.source} className="flex items-start justify-between gap-3 py-3.5 first:pt-1">
                    <div className="flex min-w-0 gap-3">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#005BAC]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-slate-800">{document.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{document.pageCount} páginas · {document.searchable ? 'texto pesquisável' : 'sem texto pesquisável'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void downloadApiFile(`/api/documents/${encodeURIComponent(document.source)}`, document.source).catch(reason => setError(reason instanceof Error ? reason.message : 'Falha ao baixar o documento.'))}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#005BAC] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC]"
                      aria-label={`Baixar ${document.title}`}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" /><span className="hidden sm:inline">PDF</span>
                    </button>
                  </li>
                ))}
              </ul>
              {status.sourcesWithoutText.length > 0 && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Alguns arquivos não possuem texto pesquisável e podem exigir OCR: {status.sourcesWithoutText.join(', ')}.</p>
              )}
              {status.sourcesUnavailable && status.sourcesUnavailable.length > 0 && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">Não foi possível ler estes arquivos: {status.sourcesUnavailable.join(', ')}. Eles ainda podem ser baixados para conferência.</p>
              )}
            </>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><ExternalLink className="h-3.5 w-3.5" /> Referências apresentadas nas respostas podem ser conferidas aqui.</span>
          <button type="button" onClick={onClose} className="rounded-lg bg-[#005BAC] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004E96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005BAC] focus-visible:ring-offset-2">Fechar</button>
        </footer>
      </section>
    </div>
  );
};
