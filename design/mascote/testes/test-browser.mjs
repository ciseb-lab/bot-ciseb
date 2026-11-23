import { spawn } from 'child_process';
import http from 'http';
import os from 'os';

const tmpDir = os.tmpdir() + '\\chrome-test-' + Date.now();
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  `--user-data-dir=${tmpDir}`
]);

setTimeout(async () => {
  try {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const pages = JSON.parse(data);
        const wsUrl = pages[0]?.webSocketDebuggerUrl;
        if (!wsUrl) {
          console.log('No wsUrl found', data);
          chrome.kill();
          return;
        }
        // Native WebSocket in Node 22+
        const ws = new globalThis.WebSocket(wsUrl);
        let id = 1;
        function send(method, params = {}) {
          ws.send(JSON.stringify({ id: id++, method, params }));
        }
        ws.addEventListener('open', () => {
          send('Runtime.enable');
          send('Page.enable');
          send('Page.navigate', { url: 'http://127.0.0.1:3000' });
        });
        ws.addEventListener('message', (event) => {
          const res = JSON.parse(event.data);
          if (res.method === 'Runtime.consoleAPICalled') {
            console.log('[CONSOLE]', res.params.type, JSON.stringify(res.params.args));
          }
          if (res.method === 'Runtime.exceptionThrown') {
            console.log('[EXCEPTION]', JSON.stringify(res.params.exceptionDetails, null, 2));
          }
          if (res.method === 'Page.loadEventFired') {
            setTimeout(() => {
              send('Runtime.evaluate', { expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML : "NO ROOT"' });
            }, 1000);
          }
          if (res.id && res.result?.result?.value !== undefined) {
            console.log('[ROOT HTML]', res.result.result.value.slice(0, 500));
            ws.close();
            chrome.kill();
            process.exit(0);
          }
        });
      });
    }).on('error', (e) => {
      console.error('HTTP err:', e);
      chrome.kill();
      process.exit(1);
    });
  } catch (e) {
    console.error('Error:', e);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
