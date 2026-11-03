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
const { app, initializeBackend } = await import('../backend/index.ts');

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
