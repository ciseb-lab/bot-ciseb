import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFParse } from 'pdf-parse';
import { generatePdf } from '../src/utils/pdfExport.ts';

test('gera um PDF válido com texto em português e conteúdo paginado', async () => {
  const paragraphs = Array.from({ length: 140 }, (_, index) =>
    `Parágrafo ${index + 1}: a formação considera a educação, a participação docente e a realidade da escola.`,
  );
  const pdf = generatePdf('Formação pedagógica: ação e reflexão', paragraphs.join('\n\n'));

  assert.ok(pdf.subarray(0, 8).toString('latin1').startsWith('%PDF-1.4'));
  assert.ok(pdf.subarray(-20).toString('latin1').includes('%%EOF'));

  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const parsed = await parser.getText();
    assert.ok(parsed.total > 1);
    assert.ok(parsed.text.includes('Formação pedagógica'));
    assert.ok(parsed.text.includes('educação'));
    assert.ok(parsed.text.includes('ação'));
  } finally {
    await parser.destroy();
  }
});
