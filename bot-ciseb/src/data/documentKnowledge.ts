import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';

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
  index: number;
}

export interface DocumentIndex {
  sources: string[];
  documents: DocumentSource[];
  pages: DocumentPage[];
  chunks: DocumentChunk[];
  sourcesWithoutText: string[];
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
    const normalizedText = normalize(chunkText);
    const tokens = new Set(normalizedText.split(' ').filter(Boolean));
    if (chunkText) {
      chunks.push({
        source,
        title: path.basename(source, path.extname(source)).replace(/[_-]+/g, ' ').trim(),
        pageNumber,
        text: chunkText,
        normalizedText,
        tokens,
        index: indexOffset + chunks.length,
      });
    }

    if (end >= normalized.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
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

  const chunks: DocumentChunk[] = [];
  const indexedPages: DocumentPage[] = [];
  const sourcesWithoutText: string[] = [];
  const documents: DocumentSource[] = [];

  for (const source of files) {
    const filePath = path.join(directory, source);
    const parser = new PDFParse({ data: new Uint8Array(await readFile(filePath)) });
    let pages: Array<{ num: number; text: string }>;
    let pageCount = 0;
    try {
      const parsed = await parser.getText();
      pages = parsed.pages.length > 0 ? parsed.pages : [{ num: 0, text: parsed.text }];
      pageCount = parsed.total;
    } catch (error) {
      throw new Error(`Falha ao ler o documento "${source}".`, { cause: error });
    } finally {
      await parser.destroy();
    }

    const sourcePages = pages;
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

  if (chunks.length === 0) {
    throw new Error('Os PDFs não contêm texto pesquisável; é necessário aplicar OCR antes de indexá-los.');
  }

  return { sources: files, documents, pages: indexedPages, chunks, sourcesWithoutText };
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
        } else if ([...chunk.tokens].some(chunkToken => chunkToken.startsWith(token))) {
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
