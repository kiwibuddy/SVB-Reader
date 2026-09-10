// Renders the built HTML to PDF over the DevTools protocol, then to PNGs so the
// pages can be looked at. Chrome's --print-to-pdf shortcut hangs on some builds;
// this drives Page.printToPDF directly against a running headless Chrome:
//   chrome --headless --no-sandbox --remote-debugging-port=9222 about:blank
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 22 ships a WebSocket client, so this needs no dependencies and runs
// against a bare clone. jonah-booklet's renderer predates that and uses `ws`.
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const PORT = process.env.CDP_PORT || 9222;
const MM = 1 / 25.4;
const NAME = 'sourceview-together-schools';

function session(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      }
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        pending.set(++id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      }),
      close: () => ws.close(),
    }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const target = await (await fetch(
  `http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }
)).json();

const s = await session(target.webSocketDebuggerUrl);
await s.send('Page.enable');
await s.send('Page.navigate', { url: `file://${path.join(dist, NAME + '.html')}` });
await sleep(2500); // let the embedded fonts land before measuring type

const { data } = await s.send('Page.printToPDF', {
  paperWidth: 210 * MM,
  paperHeight: 297 * MM,
  marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  printBackground: true,
  preferCSSPageSize: true,
});

// Page PNGs, for looking at the result without a PDF viewer.
if (process.argv.includes('--png')) {
  await s.send('Emulation.setDeviceMetricsOverride', {
    width: 794, height: 1123, deviceScaleFactor: 2, mobile: false,
  });
  for (let i = 0; i < 4; i++) {
    await s.send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.page')[${i}].scrollIntoView({block:'start'})`,
    });
    await sleep(220);
    const shot = await s.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(dist, `page-${i + 1}.png`), Buffer.from(shot.data, 'base64'));
  }
  console.log('wrote 4 page PNGs');
}

s.close();
await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);

const out = path.join(dist, NAME + '.pdf');
fs.writeFileSync(out, Buffer.from(data, 'base64'));
const buf = fs.readFileSync(out);
const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log('wrote', path.basename(out), pages, 'pages', Math.round(buf.length / 1024) + 'KB');
process.exit(0);
