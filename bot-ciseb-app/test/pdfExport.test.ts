import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFParse } from 'pdf-parse';
import { generatePdf } from '../backend/pdfExport.ts';

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

test('converte tags <br> sem exibir HTML literal nem colar palavras no PDF', async () => {
  const pdf = generatePdf(
    'Avaliação',
    '• **Planejamento Reverso:** atividade.<br>• **Métodos Diversificados:** observação.\n| Etapa | Item A<br>Item B |',
  );

  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const parsed = await parser.getText();
    assert.ok(!parsed.text.includes('<br>'));
    assert.ok(parsed.text.includes('atividade.'));
    assert.ok(parsed.text.includes('Métodos Diversificados:'));
    assert.ok(parsed.text.includes('Item A Item B'));
  } finally {
    await parser.destroy();
  }
});

test('inclui cabeçalho institucional e formata fórmulas LaTeX e química de forma legível no PDF', async () => {
  const pdf = generatePdf(
    'Fórmulas da Horta Escolar',
    [
      '### 1. Fórmulas de Estatística',
      '* **Média Aritmética:**',
      '  $$M = \\frac{x_1 + x_2 + x_3 + \\dots + x_n}{n}$$',
      '* **Fotossíntese:**',
      '  $$\\ce{6CO2 + 6H2O ->[luz] C6H12O6 + 6O2}$$',
    ].join('\n'),
  );

  const parser = new PDFParse({ data: new Uint8Array(pdf) });
  try {
    const parsed = await parser.getText();
    assert.ok(parsed.text.includes('GOVERNO DO ESTADO DO PARÁ'));
    assert.ok(parsed.text.includes('CISEB'));
    assert.ok(!parsed.text.includes('\\frac'));
    assert.ok(!parsed.text.includes('\\ce{'));
    assert.ok(parsed.text.includes('M = (x1 + x2 + x3 + … + xn) / n'));
    assert.ok(parsed.text.includes('6CO2 + 6H2O -(luz)-> C6H12O6 + 6O2'));
  } finally {
    await parser.destroy();
  }
});
