import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/contrib/mhchem';
import {
  normalizeMarkdownForRendering,
  remarkHtmlBreaks,
} from '../frontend/src/components/chat/markdownUtils.ts';

function renderMarkdown(source: string): string {
  const normalized = normalizeMarkdownForRendering(source);
  return renderToStaticMarkup(
    React.createElement(
      ReactMarkdown,
      {
        remarkPlugins: [remarkGfm, remarkMath, remarkHtmlBreaks],
        rehypePlugins: [[rehypeKatex, { throwOnError: false, strict: false }]],
      },
      normalized,
    ),
  );
}

test('converte <br> em quebra de linha real em parágrafos e tabelas sem permitir HTML arbitrário', () => {
  const html = renderMarkdown([
    '• **Planejamento Reverso:** atividade. <br>• **Métodos Diversificados:** observação.',
    '',
    '| Etapa | Detalhes |',
    '| --- | --- |',
    '| 1 | Item A<br/>Item B |',
    '',
    'Código inline `<br>` e tag bloqueada <img src=x onerror=alert(1)>.',
  ].join('\n'));

  assert.ok(html.includes('<br/>'));
  assert.ok(!html.includes('&lt;br&gt;•'));
  assert.ok(!html.includes('Item A&lt;br/&gt;Item B'));
  assert.ok(html.includes('<code>&lt;br&gt;</code>'));
  assert.ok(!html.includes('<img '));
});

test('renderiza fórmulas matemáticas e químicas (mhchem) com KaTeX sem corromper valores em reais', () => {
  const html = renderMarkdown([
    'O kit custa R$ 50,00 e o transporte R$ 120,00.',
    '',
    'Energia: $E = mc^2$ e fórmula com parênteses: \\(a^2 + b^2 = c^2\\).',
    '',
    'Reação da água: $\\ce{2H2 + O2 -> 2H2O}$.',
    '',
    '\\[',
    '\\ce{6CO2 + 6H2O ->[luz] C6H12O6 + 6O2}',
    '\\]',
  ].join('\n'));

  assert.ok(html.includes('class="katex"'));
  assert.ok(html.includes('class="katex-display"'));
  assert.ok(!html.includes('katex-error'));
  assert.ok(html.includes('R$ 50,00 e o transporte R$ 120,00.'));
});
