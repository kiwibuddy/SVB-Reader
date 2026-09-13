// Reports how far each page's content runs past its own padding box, so a
// four-page fixed layout can be tuned without eyeballing PDFs.
//   node print/schools-brochure/check.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.CDP_PORT || 9222;

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
      send: (m, p = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method: m, params: p })); }),
      close: () => ws.close(),
    }));
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const s = await session(target.webSocketDebuggerUrl);
await s.send('Page.enable');
await s.send('Page.navigate', { url: `file://${path.join(here, 'dist/sourceview-together-schools.html')}` });
await sleep(2500);

const expr = `
JSON.stringify([...document.querySelectorAll('.page')].map((page, i) => {
  const body = page.querySelector('.page-body') || page.querySelector('.cover-body');
  const cs = getComputedStyle(body);
  const box = body.getBoundingClientRect();
  const limit = box.bottom - parseFloat(cs.paddingBottom);
  let worst = 0, who = '';
  for (const el of body.querySelectorAll('*')) {
    if (!el.getClientRects().length) continue;
    const over = el.getBoundingClientRect().bottom - limit;
    if (over > worst) { worst = over; who = el.className || el.tagName; }
  }
  const px2mm = 25.4 / 96;
  return { page: i + 1, overflowMm: +(worst * px2mm).toFixed(1), culprit: String(who).slice(0, 42) };
}))`;
const { result } = await s.send('Runtime.evaluate', { expression: expr, returnByValue: true });
for (const r of JSON.parse(result.value)) {
  const flag = r.overflowMm > 0.5 ? 'OVER' : ' ok ';
  console.log(`[${flag}] page ${r.page}  ${String(r.overflowMm).padStart(6)}mm  ${r.culprit}`);
}
s.close();
await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
process.exit(0);
