import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.APP_ORIGINS = 'https://bot-ciseb.vercel.app';
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'bot-ciseb-api-test-'));
process.env.DOCUMENTS_DIR = path.join(temporaryDirectory, 'missing-documents');
const { app, initializeBackend, normalizeReplyMarkdown, retrieveBlock4Documents } = await import('../backend/index.ts');
const { loadDocumentIndexFromJson } = await import('../backend/documentKnowledge.ts');

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test('a ausência dos PDFs não impede a inicialização do backend', async () => {
  await initializeBackend();
});

test('health responde sem base documental e mantém CORS e métodos restritos', async () => {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', documentsReady: false });

    const allowedOrigin = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://bot-ciseb.vercel.app' },
    });
    assert.equal(allowedOrigin.status, 200);
    assert.equal(allowedOrigin.headers.get('access-control-allow-origin'), 'https://bot-ciseb.vercel.app');

    const blockedOrigin = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://example.com' },
    });
    assert.equal(blockedOrigin.status, 403);

    const wrongMethod = await fetch(`${baseUrl}/api/chat`);
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get('allow'), 'POST');

    const documentStatus = await fetch(`${baseUrl}/api/documents/status`);
    assert.notEqual(documentStatus.status, 404);
    assert.ok([401, 503].includes(documentStatus.status));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

test('normalizeReplyMarkdown converte <br> em quebra de linha fora de tabelas e código', () => {
  const input = [
    '• **Planejamento Reverso:** texto. <br>• **Métodos Diversificados:** outro.',
    '| Col 1 | • Item 1 <br>• Item 2 |',
    'Exemplo inline `<br>` mantido e <br/> convertido.',
    '```html',
    '<br>',
    '```',
  ].join('\n');

  const output = normalizeReplyMarkdown(input);
  assert.equal(
    output,
    [
      '• **Planejamento Reverso:** texto.  \n• **Métodos Diversificados:** outro.',
      '| Col 1 | • Item 1 <br>• Item 2 |',
      'Exemplo inline `<br>` mantido e  \nconvertido.',
      '```html',
      '<br>',
      '```',
    ].join('\n'),
  );
});

test('retrieveBlock4Documents puxa trechos dos PDFs anexados conforme os recursos e contexto do Bloco 4', async () => {
  const index = await loadDocumentIndexFromJson(path.join(process.cwd(), 'backend', 'documents', 'index.json'));
  const docs = retrieveBlock4Documents(index.chunks, {
    area_conhecimento: ['Computação / Inovação (CISEB)'],
    componentes_curriculares: ['Computação'],
    trilhas_formativas: ['Clima e Mudanças Climáticas'],
    subtema: '',
    etapa_ensino: ['Ensino Fundamental II (Anos Finais)'],
    anos_series: ['6º ano (EF II)'],
    modalidades: [],
    formato_documento: 'Sequência Didática',
    recursos_escola: ['100% Desplugada / Sucata', 'Celulares dos estudantes'],
    contexto_escolar: 'Escola ribeirinha, turma com 35 alunos, foco em aprendizagem ativa',
  });

  assert.ok(docs.length > 0);
  const sources = new Set(docs.map(doc => doc.source));
  assert.ok(
    sources.has('BNCCComputaoCompletodiagramado.pdf')
      || sources.has('ReferencialCurriculardeComputacaoodoEstadodoPara.pdf'),
  );
  assert.ok(sources.has('GUIA-PARA-O-PLANEJAMENTO-DA-ADOCAO-DE-DISPOSITIVOS.pdf'));
});
