import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
const { app } = await import('../backend/index.ts');

test('health responde sem inicializar a base documental', async () => {
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', documentsReady: false });

    const documentStatus = await fetch(`${baseUrl}/api/documents/status`);
    assert.notEqual(documentStatus.status, 404);
    assert.ok([401, 503].includes(documentStatus.status));
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});
