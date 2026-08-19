// Renders the built HTML to PDF over the DevTools protocol.
// Chrome's --print-to-pdf shortcut hangs on some builds; this drives
// Page.printToPDF directly against an already-running headless Chrome:
//   Google\ Chrome --headless --remote-debugging-port=9222 about:blank
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const PORT = process.env.CDP_PORT || 9222;
const MM = 1 / 25.4;

const json = async (p) => (await fetch(`http://127.0.0.1:${PORT}${p}`)).json();

function session(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { perMessageDeflate: false, maxPayload: 512 * 1024 * 1024 });
    let id = 0;
    const pending = new Map();
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    });
    ws.on('error', reject);
    ws.on('open', () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        pending.set(++id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      }),
      close: () => ws.close(),
    }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const colours = process.argv.slice(2).length ? process.argv.slice(2) : ['black', 'red', 'green', 'blue'];
for (const colour of colours) {
  const file = path.join(dist, `jonah-booklet-${colour}.html`);
  const target = await (await fetch(
    `http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }
  )).json();

  const s = await session(target.webSocketDebuggerUrl);
  await s.send('Page.enable');
  await s.send('Page.navigate', { url: `file://${file}` });
  await sleep(2500); // fonts, then the paginator lays the pages out

  const { data } = await s.send('Page.printToPDF', {
    paperWidth: 148 * MM,
    paperHeight: 210 * MM,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
    printBackground: true,
    preferCSSPageSize: true,
  });
  s.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);

  const out = path.join(dist, `jonah-booklet-${colour}.pdf`);
  fs.writeFileSync(out, Buffer.from(data, 'base64'));
  const buf = fs.readFileSync(out);
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(colour, pages, 'pages', Math.round(buf.length / 1024) + 'KB');
}

process.exit(0);
