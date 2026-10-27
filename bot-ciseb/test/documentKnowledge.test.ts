import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import {
  loadDocumentIndex,
  searchDocumentIndex,
  splitDocumentText,
} from '../src/data/documentKnowledge.ts';
import { findCatalogRecord } from '../src/data/curriculumData.ts';
import { verifyCurriculumSkill } from '../src/data/curriculumVerification.ts';

describe('Base documental em PDF', () => {
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
    const index = await loadDocumentIndex(path.join(process.cwd(), 'documents'));

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
});
