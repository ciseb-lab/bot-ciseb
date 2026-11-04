import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDocumentIndex } from '../backend/documentKnowledge.ts';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documentsDirectory = path.join(appDirectory, 'backend', 'documents');
const outputPath = path.join(documentsDirectory, 'index.json');
const startedAt = Date.now();
const index = await loadDocumentIndex(documentsDirectory);

const serializedIndex = {
  sources: index.sources,
  documents: index.documents,
  pages: index.pages,
  chunks: index.chunks.map(({ source, title, pageNumber, text, index: chunkIndex }) => ({
    source,
    title,
    pageNumber,
    text,
    index: chunkIndex,
  })),
  sourcesWithoutText: index.sourcesWithoutText,
  sourcesUnavailable: index.sourcesUnavailable,
};

await writeFile(outputPath, `${JSON.stringify(serializedIndex)}\n`, 'utf8');
const outputStats = await stat(outputPath);
if (!outputStats.isFile() || outputStats.size === 0) {
  throw new Error(`O índice documental não foi gerado corretamente: ${outputPath}`);
}
console.info(JSON.stringify({
  severity: 'INFO',
  event: 'document_index_built',
  output: path.relative(appDirectory, outputPath),
  documentCount: index.sources.length,
  indexedChunkCount: index.chunks.length,
  outputBytes: outputStats.size,
  durationMs: Date.now() - startedAt,
}));
