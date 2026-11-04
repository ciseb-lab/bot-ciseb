import { test, describe } from 'node:test';
import assert from 'node:assert';
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  loadDocumentIndex,
  loadDocumentIndexFromJson,
  searchDocumentIndex,
  splitDocumentText,
} from '../backend/documentKnowledge.ts';
import { findCatalogRecord } from '../shared/curriculumData.ts';
import { verifyCurriculumSkill } from '../backend/curriculumVerification.ts';

describe('Base documental em PDF', () => {
  test('carrega o índice JSON e reconstrói os dados derivados usados pela busca', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'bot-ciseb-index-'));
    const jsonPath = path.join(directory, 'index.json');
    try {
      await writeFile(jsonPath, JSON.stringify({
        sources: ['guia.pdf'],
        documents: [{ source: 'guia.pdf', title: 'guia', pageCount: 1, searchable: true }],
        pages: [{
          source: 'guia.pdf',
          title: 'guia',
          pageNumber: 1,
          text: 'Planejamento da adoção de dispositivos digitais na escola.',
        }],
        chunks: [{
          source: 'guia.pdf',
          title: 'guia',
          pageNumber: 1,
          text: 'Planejamento da adoção de dispositivos digitais na escola.',
          index: 0,
        }],
        sourcesWithoutText: [],
        sourcesUnavailable: [],
      }));

      const index = await loadDocumentIndexFromJson(jsonPath);

      assert.equal(index.chunks[0].normalizedText, 'planejamento da adocao de dispositivos digitais na escola');
      assert.ok(index.chunks[0].tokens.has('adocao'));
      assert.deepEqual(index.chunks[0].sortedTokens, [...index.chunks[0].tokens].sort());
      assert.equal(searchDocumentIndex(index.chunks, 'adoção dispositivo').length, 1);
      assert.equal(index.pages[0].pageNumber, 1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('divide textos em trechos e recupera os que correspondem à consulta', () => {
    const chunks = splitDocumentText(
      'guia.pdf',
      'Planejamento da adoção de dispositivos digitais na escola.',
      9,
    );

    const results = searchDocumentIndex(chunks, 'adoção dispositivos digitais');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].source, 'guia.pdf');
    assert.strictEqual(results[0].title, 'guia');
    assert.strictEqual(results[0].pageNumber, 9);
    assert.ok(results[0].text.includes('dispositivos digitais'));
  });

  test('indexa os PDFs fornecidos e encontra trechos do conteúdo', async () => {
    const index = await loadDocumentIndex(path.join(process.cwd(), 'backend', 'documents'));

    assert.strictEqual(index.sources.length, 9);
    assert.strictEqual(index.documents.length, 9);
    assert.ok(index.pages.length > 0);
    assert.ok(index.documents.every(document => document.pageCount > 0));
    assert.ok(index.chunks.length > 0);
    assert.ok(
      searchDocumentIndex(index.chunks, 'currículo computação educação Pará').length > 0,
    );

    const localRecord = findCatalogRecord('EF01CO01');
    assert.ok(localRecord);
    assert.equal(verifyCurriculumSkill(localRecord, index.pages), undefined);
  });

  test('mantém documentos válidos disponíveis quando outro PDF não pode ser lido', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'bot-ciseb-documents-'));
    try {
      await copyFile(
        path.join(process.cwd(), 'backend', 'documents', 'D9204.pdf'),
        path.join(directory, 'D9204.pdf'),
      );
      await writeFile(path.join(directory, 'arquivo-invalido.pdf'), 'PDF inválido');

      const index = await loadDocumentIndex(directory);

      assert.deepStrictEqual(index.sourcesUnavailable, ['arquivo-invalido.pdf']);
      assert.ok(index.documents.some(document => document.source === 'D9204.pdf' && document.searchable));
      assert.ok(index.chunks.length > 0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
