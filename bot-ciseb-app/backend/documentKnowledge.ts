import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

function installCanvasGlobal(name: 'DOMMatrix' | 'ImageData' | 'Path2D', value: unknown): void {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
}

const CHUNK_LENGTH = 1400;
const CHUNK_OVERLAP = 180;
const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos',
  'e', 'em', 'entre', 'essa', 'esse', 'esta', 'este', 'eu', 'na', 'nas',
  'no', 'nos', 'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos',
  'que', 'se', 'sem', 'sua', 'suas', 'seu', 'seus', 'um', 'uma', 'umas',
  'uns',
]);

export interface DocumentChunk {
  source: string;
  title: string;
  pageNumber?: number;
  text: string;
  normalizedText: string;
  tokens: Set<string>;
  sortedTokens: string[];
  index: number;
}

export interface DocumentIndex {
  sources: string[];
  documents: DocumentSource[];
  pages: DocumentPage[];
  chunks: DocumentChunk[];
  sourcesWithoutText: string[];
  sourcesUnavailable: string[];
}

export interface DocumentPage {
  source: string;
  title: string;
  pageNumber?: number;
  text: string;
}

export interface DocumentSource {
  source: string;
  title: string;
  pageCount: number;
  searchable: boolean;
}

export interface RelevantDocumentChunk {
  source: string;
  title: string;
  pageNumber?: number;
  text: string;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getObject(value: unknown, description: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Índice documental inválido: ${description} deve ser um objeto.`);
  }
  return value as Record<string, unknown>;
}

function getString(value: unknown, description: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Índice documental inválido: ${description} deve ser texto.`);
  }
  return value;
}

function getOptionalPageNumber(value: unknown, description: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`Índice documental inválido: ${description} deve ser um número de página positivo.`);
  }
  return value;
}

function getStringArray(value: unknown, description: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Índice documental inválido: ${description} deve ser uma lista.`);
  }
  return value.map((item, index) => getString(item, `${description}[${index}]`));
}

function getArray(value: unknown, description: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Índice documental inválido: ${description} deve ser uma lista.`);
  }
  return value;
}

function createDocumentChunk(
  source: string,
  title: string,
  text: string,
  index: number,
  pageNumber?: number,
): DocumentChunk {
  const normalizedText = normalize(text);
  const tokens = new Set(normalizedText.split(' ').filter(Boolean));
  return {
    source,
    title,
    pageNumber,
    text,
    normalizedText,
    tokens,
    sortedTokens: [...tokens].sort(),
    index,
  };
}

export function splitDocumentText(
  source: string,
  text: string,
  pageNumber?: number,
  indexOffset = 0,
): DocumentChunk[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const chunks: DocumentChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_LENGTH, normalized.length);
    if (end < normalized.length) {
      const wordBoundary = normalized.lastIndexOf(' ', end);
      if (wordBoundary > start) end = wordBoundary;
    }

    const chunkText = normalized.slice(start, end).trim();
    if (chunkText) {
      chunks.push(createDocumentChunk(
        source,
        path.basename(source, path.extname(source)).replace(/[_-]+/g, ' ').trim(),
        chunkText,
        indexOffset + chunks.length,
        pageNumber,
      ));
    }

    if (end >= normalized.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

export async function loadDocumentIndexFromJson(jsonPath: string): Promise<DocumentIndex> {
  const parsed: unknown = JSON.parse(await readFile(jsonPath, 'utf8'));
  const index = getObject(parsed, 'raiz');
  const sources = getStringArray(index.sources, 'sources');
  const documents = getArray(index.documents, 'documents').map((value, position) => {
    const document = getObject(value, `documents[${position}]`);
    if (typeof document.pageCount !== 'number' || !Number.isInteger(document.pageCount) || document.pageCount < 0) {
      throw new Error(`Índice documental inválido: documents[${position}].pageCount deve ser um inteiro não negativo.`);
    }
    if (typeof document.searchable !== 'boolean') {
      throw new Error(`Índice documental inválido: documents[${position}].searchable deve ser booleano.`);
    }
    return {
      source: getString(document.source, `documents[${position}].source`),
      title: getString(document.title, `documents[${position}].title`),
      pageCount: document.pageCount,
      searchable: document.searchable,
    };
  });
  const pages = getArray(index.pages, 'pages').map((value, position) => {
    const page = getObject(value, `pages[${position}]`);
    return {
      source: getString(page.source, `pages[${position}].source`),
      title: getString(page.title, `pages[${position}].title`),
      pageNumber: getOptionalPageNumber(page.pageNumber, `pages[${position}].pageNumber`),
      text: getString(page.text, `pages[${position}].text`),
    };
  });
  const chunks = getArray(index.chunks, 'chunks').map((value, position) => {
    const chunk = getObject(value, `chunks[${position}]`);
    if (typeof chunk.index !== 'number' || !Number.isInteger(chunk.index) || chunk.index < 0) {
      throw new Error(`Índice documental inválido: chunks[${position}].index deve ser um inteiro não negativo.`);
    }
    return createDocumentChunk(
      getString(chunk.source, `chunks[${position}].source`),
      getString(chunk.title, `chunks[${position}].title`),
      getString(chunk.text, `chunks[${position}].text`),
      chunk.index,
      getOptionalPageNumber(chunk.pageNumber, `chunks[${position}].pageNumber`),
    );
  });

  return {
    sources,
    documents,
    pages,
    chunks,
    sourcesWithoutText: getStringArray(index.sourcesWithoutText, 'sourcesWithoutText'),
    sourcesUnavailable: getStringArray(index.sourcesUnavailable, 'sourcesUnavailable'),
  };
}

export async function loadDocumentIndex(directory: string): Promise<DocumentIndex> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf')
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  if (files.length === 0) {
    throw new Error(`Nenhum PDF foi encontrado na pasta de documentos: ${directory}`);
  }

  const { DOMMatrix, ImageData, Path2D } = await import('@napi-rs/canvas');
  installCanvasGlobal('DOMMatrix', DOMMatrix);
  installCanvasGlobal('ImageData', ImageData);
  installCanvasGlobal('Path2D', Path2D);
  const { PDFParse } = await import('pdf-parse');

  const chunks: DocumentChunk[] = [];
  const indexedPages: DocumentPage[] = [];
  const sourcesWithoutText: string[] = [];
  const sourcesUnavailable: string[] = [];
  const documents: DocumentSource[] = [];

  for (const source of files) {
    const filePath = path.join(directory, source);
    let parser: InstanceType<typeof PDFParse> | undefined;
    let sourcePages: Array<{ num: number; text: string }> = [];
    let pageCount = 0;
    try {
      parser = new PDFParse({ data: new Uint8Array(await readFile(filePath)) });
      const parsed = await parser.getText();
      sourcePages = parsed.pages.length > 0 ? parsed.pages : [{ num: 0, text: parsed.text }];
      pageCount = parsed.total;
    } catch (error) {
      sourcesUnavailable.push(source);
      documents.push({
        source,
        title: path.basename(source, path.extname(source)).replace(/[_-]+/g, ' ').trim(),
        pageCount: 0,
        searchable: false,
      });
      console.warn(JSON.stringify({
        severity: 'WARNING',
        event: 'document_index_failed',
        source,
        error: error instanceof Error ? error.name : 'UnknownError',
      }));
      continue;
    } finally {
      await parser?.destroy();
    }

    const sourceChunks: DocumentChunk[] = [];
    for (const page of sourcePages) {
      const pageNumber = page.num > 0 ? page.num : undefined;
      indexedPages.push({
        source,
        title: path.basename(source, path.extname(source)).replace(/[_-]+/g, ' ').trim(),
        pageNumber,
        text: page.text,
      });
      sourceChunks.push(...splitDocumentText(
        source,
        page.text,
        pageNumber,
        sourceChunks.length,
      ));
    }

    documents.push({
      source,
      title: path.basename(source, path.extname(source)).replace(/[_-]+/g, ' ').trim(),
      pageCount,
      searchable: sourceChunks.length > 0,
    });

    if (sourceChunks.length === 0) {
      sourcesWithoutText.push(source);
    } else {
      chunks.push(...sourceChunks);
    }
  }

  return { sources: files, documents, pages: indexedPages, chunks, sourcesWithoutText, sourcesUnavailable };
}

function hasTokenPrefix(sortedTokens: string[], prefix: string): boolean {
  let low = 0;
  let high = sortedTokens.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (sortedTokens[middle] < prefix) low = middle + 1;
    else high = middle;
  }
  return sortedTokens[low]?.startsWith(prefix) ?? false;
}

export function searchDocumentIndex(
  chunks: DocumentChunk[],
  query: string,
  limit = 6,
): RelevantDocumentChunk[] {
  const normalizedQuery = normalize(query);
  const queryTokens = [...new Set(normalizedQuery.split(' '))]
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));

  if (queryTokens.length === 0 || limit <= 0) return [];

  const documentFrequency = new Map<string, number>();
  for (const chunk of chunks) {
    for (const token of queryTokens) {
      if (chunk.tokens.has(token)) {
        documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
      }
    }
  }

  const ranked = chunks
    .map(chunk => {
      let matchedTokens = 0;
      let score = 0;

      for (const token of queryTokens) {
        const frequency = documentFrequency.get(token) || 0;
        const weight = 1 + Math.log((chunks.length + 1) / (frequency + 1));
        if (chunk.tokens.has(token)) {
          score += 2 * weight;
          matchedTokens += 1;
        } else if (hasTokenPrefix(chunk.sortedTokens, token)) {
          score += weight;
          matchedTokens += 1;
        }
      }

      if (normalizedQuery.length > 8 && chunk.normalizedText.includes(normalizedQuery)) {
        score += 4;
      }

      score += matchedTokens / queryTokens.length;

      return { chunk, score, matchedTokens };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.source.localeCompare(b.chunk.source));

  const results: RelevantDocumentChunk[] = [];
  const matchesPerSource = new Map<string, number>();
  const seenChunks = new Set<string>();
  for (const result of ranked) {
    const sourceMatches = matchesPerSource.get(result.chunk.source) || 0;
    if (sourceMatches >= 2) continue;
    if (result.matchedTokens === 0) continue;
    const deduplicationKey = `${result.chunk.source}:${result.chunk.pageNumber || ''}:${result.chunk.normalizedText}`;
    if (seenChunks.has(deduplicationKey)) continue;

    results.push({
      source: result.chunk.source,
      title: result.chunk.title,
      pageNumber: result.chunk.pageNumber,
      text: result.chunk.text,
    });
    seenChunks.add(deduplicationKey);
    matchesPerSource.set(result.chunk.source, sourceMatches + 1);
    if (results.length >= limit) break;
  }

  return results;
}
