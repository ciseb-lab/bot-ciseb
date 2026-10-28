import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  CURRICULUM_CATALOG_RECORDS,
  findCatalogRecord,
  findCatalogRecords,
} from '../shared/curriculumData.ts';
import { verifyCurriculumSkill } from '../backend/curriculumVerification.ts';
import { extractMarkdownTables } from '../frontend/src/utils/formatters.ts';

describe('Catálogo curricular e conferência documental', () => {
  test('localiza um registro pelo código sem tratá-lo como validação documental', () => {
    const skill = findCatalogRecord('EF01CO01');
    assert.ok(skill, 'EF01CO01 deve existir no catálogo local');
    assert.strictEqual(skill?.stage, '1º ano EF');
    assert.strictEqual(skill?.component, 'Computação');
    assert.strictEqual(skill?.axisOrThematicUnit, 'Pensamento Computacional');
    assert.ok(skill?.verbatimText.includes('algoritmos'), 'O registro local deve manter seu texto cadastrado');
  });

  test('catálogo não encontra códigos que não foram cadastrados', () => {
    const fakeSkill = findCatalogRecord('EF99CO99');
    assert.strictEqual(fakeSkill, undefined, 'Código não cadastrado não deve ser retornado');

    const fakeSkill2 = findCatalogRecord('EM13FAKE01');
    assert.strictEqual(fakeSkill2, undefined, 'Código inventado não deve ser retornado');
  });

  test('catálogo local mantém registros dos diferentes eixos pedagógicos', () => {
    const bnccComp = CURRICULUM_CATALOG_RECORDS.filter(s => s.sourceDocument.includes('Computação: Complemento à BNCC'));
    const curriculoPA = CURRICULUM_CATALOG_RECORDS.filter(s => s.sourceDocument.includes('Currículo Paraense'));
    const dinov = CURRICULUM_CATALOG_RECORDS.filter(s => s.sourceDocument.includes('CISEB'));

    assert.ok(bnccComp.length >= 10, 'Should have comprehensive BNCC Computação skills');
    assert.ok(curriculoPA.length >= 5, 'Should have Currículo Paraense skills');
    assert.ok(dinov.length >= 2, 'Should have DINOV CISEB guidelines');
  });

  test('findCatalogRecords matches by stage and component', () => {
    const results = findCatalogRecords({ stage: '6º', component: 'Ciências da Natureza' });
    assert.ok(results.length > 0, 'Deve encontrar registros compatíveis no catálogo local');
    assert.ok(results.some(s => s.code === 'EF06CI04PA'), 'Deve incluir o código presente no catálogo');
  });

  test('confere código e enunciado somente quando aparecem juntos na mesma página', () => {
    const skill = findCatalogRecord('EF01CO01');
    assert.ok(skill);
    const pages = [
      { source: 'doc.pdf', title: 'Documento', pageNumber: 1, text: `${skill.code}\n${skill.verbatimText}` },
    ];
    assert.equal(verifyCurriculumSkill(skill, pages)?.document.pageNumber, 1);
    assert.equal(verifyCurriculumSkill(skill, [
      { ...pages[0], text: skill.code },
      { ...pages[0], pageNumber: 2, text: skill.verbatimText },
    ]), undefined);
  });

  test('Markdown table extractor handles a table when one is requested', () => {
    const sampleResponse = `
Apresento o quadro de referência solicitado:

| Código | Referência consultada | Documento | Ano/Etapa |
| :--- | :--- | :--- | :--- |
| EF05CO01 | Registro a conferir | PDF consultado | 5º ano EF |

---
Proposta pedagógica elaborada.
    `;

    const { cleanText, tables } = extractMarkdownTables(sampleResponse);
    assert.strictEqual(tables.length, 1);
    assert.strictEqual(tables[0].headers.length, 4);
    assert.strictEqual(tables[0].headers[0], 'Código');
    assert.strictEqual(tables[0].headers[1], 'Referência consultada');
    assert.strictEqual(tables[0].rows[0][0], 'EF05CO01');
    assert.ok(cleanText.includes('Proposta pedagógica elaborada.'));
  });
});
