// Builds the Advent book: one interior (the same for every copy) and four
// cover wraps, one per reading colour.
//   node print/advent-book/build.mjs      → dist/*.html
//   node print/advent-book/render.mjs     → dist/*.pdf (Playwright Chromium)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COVERS, DAYS, WEEKS } from './content.mjs';
import { css } from './styles.mjs';
import {
  titlePage, copyrightPage, readAloudPage, howToPage, shapePage, contentsPages,
  weekPage, dayOpener, dayClose, christmasPage, notesPage,
} from './pages.mjs';
import { frontCoverPage } from './cover.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

const FACES = [
  ['Manrope-Regular.ttf', 400], ['Manrope-Medium.ttf', 500], ['Manrope-SemiBold.ttf', 600],
  ['Manrope-Bold.ttf', 700], ['Manrope-ExtraBold.ttf', 800],
];
export const fontFaces = FACES.map(([file, weight]) => {
  const b64 = fs.readFileSync(path.join(root, 'assets/fonts', file)).toString('base64');
  return `@font-face{font-family:'Manrope';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}).join('\n') + '\n' + fs.readFileSync(path.join(here, 'fonts/charis.css'), 'utf8').replace(
  /url\(https:\/\/fonts\.gstatic\.com\/[^)]*\/([^/)]+\.woff2)\)/g,
  (_, f) => `url(data:font/woff2;base64,${fs.readFileSync(path.join(here, 'fonts', f)).toString('base64')})`
);

// The Jonah paginator, extended: whole pages (week dividers, day openers) ride
// in the flow, each story's running head follows its day, and the contents
// page numbers are filled in once everything is laid out.
const paginator = `
(function(){
  var doc = document.getElementById('doc');
  var flow = Array.prototype.slice.call(document.getElementById('flow-tpl').content.children);
  var back = Array.prototype.slice.call(document.getElementById('back-tpl').content.children);
  var filler = document.getElementById('filler-tpl').content.firstElementChild;
  var body = null, mark = '';

  function storyPage(){
    var sec = document.createElement('section');
    sec.className = 'page';
    sec.setAttribute('data-kind','story');
    sec.innerHTML = '<div class="page-body"></div><div class="folio"><span class="mark"></span><span class="num"></span></div>';
    sec.querySelector('.mark').textContent = mark;
    doc.appendChild(sec);
    return sec.querySelector('.page-body');
  }
  function overflows(){
    var last = body.lastElementChild;
    if (!last) return false;
    var cs = getComputedStyle(body);
    var limit = body.getBoundingClientRect().top + body.clientHeight - parseFloat(cs.paddingBottom);
    return last.getBoundingClientRect().bottom > limit + 0.5;
  }

  for (var i = 0; i < flow.length; i++){
    var item = flow[i];
    if (item.classList.contains('flow-page')){
      doc.appendChild(item.firstElementChild.cloneNode(true));
      if (item.getAttribute('data-mark')) mark = item.getAttribute('data-mark');
      body = null;
      continue;
    }
    if (!body) body = storyPage();
    var node = item.cloneNode(true);
    body.appendChild(node);
    if (!overflows()) continue;

    var bubble = node.querySelector('.bubble');
    var carried = [];
    if (bubble && bubble.children.length > 1){
      while (overflows() && bubble.children.length > 1){
        carried.unshift(bubble.lastElementChild);
        bubble.removeChild(bubble.lastElementChild);
      }
      while (carried.length && carried[0].classList.contains('para--gap')) carried.shift();
    }
    if (carried.length && !overflows()){
      body = storyPage();
      var cont = node.cloneNode(false);
      cont.className = node.className.replace(/\\bhas-tail\\b/,'').trim() + ' turn--cont';
      var nb = document.createElement('div');
      nb.className = 'bubble';
      for (var c = 0; c < carried.length; c++) nb.appendChild(carried[c]);
      cont.appendChild(nb);
      body.appendChild(cont);
      continue;
    }
    for (var r = 0; r < carried.length; r++) bubble.appendChild(carried[r]);
    if (body.children.length === 1) continue;
    node.remove();
    var lastBody = body;
    body = storyPage();
    body.appendChild(node);
    var stranded = lastBody.lastElementChild;
    if (stranded && stranded.classList.contains('chapter-rule')){
      body.insertBefore(stranded, body.firstElementChild);
    }
  }

  for (var b = 0; b < back.length; b++) doc.appendChild(back[b]);
  while (doc.children.length % 4 !== 0) doc.appendChild(filler.cloneNode(true));

  var pages = doc.children;
  for (var p = 0; p < pages.length; p++){
    var n = p + 1;
    if (n % 2 === 0) pages[p].classList.add('verso');
    var num = pages[p].querySelector('.folio .num');
    if (num) num.textContent = n;
    var anchor = pages[p].getAttribute('data-anchor');
    if (anchor){
      var slot = document.querySelector('[data-page-of="' + anchor + '"]');
      if (slot) slot.textContent = n;
    }
  }
  document.documentElement.setAttribute('data-pages', pages.length);
  document.title = document.title.replace('{{pages}}', pages.length);
})();
`;

const flowPage = (html, mark = '') => `<div class="flow-page" data-mark="${mark}">${html}</div>`;

function flowHtml() {
  const out = [];
  for (const w of WEEKS) {
    out.push(flowPage(weekPage(w)));
    for (const d of DAYS.filter((x) => x.week.key === w.key)) {
      out.push(flowPage(dayOpener(d), `Day ${d.n} · ${d.shortRef}`));
      out.push(...d.items, ...dayClose(d));
    }
  }
  return out.join('\n');
}

export function interiorHtml() {
  const [c1, c2] = contentsPages();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>From promise to manger — interior — {{pages}} pages</title>
<style>${fontFaces}</style>
<style>${css(COVERS.black)}</style>
</head>
<body>
<main id="doc">
${titlePage()}
${copyrightPage()}
${readAloudPage()}
${howToPage()}
${shapePage()}
${c1}
${c2}
</main>
<template id="flow-tpl">${flowHtml()}</template>
<template id="back-tpl">${christmasPage()}</template>
<template id="filler-tpl">${notesPage()}</template>
<script>${paginator}</script>
</body>
</html>`;
}

export function coverPreviewHtml(cover) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Front cover — ${cover.name}</title>
<style>${fontFaces}</style><style>${css(cover)}</style></head>
<body><main id="doc">${frontCoverPage(cover)}</main></body></html>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(dist, 'advent-book-interior.html'), interiorHtml());
  for (const key of ['black', 'red', 'green', 'blue']) {
    fs.writeFileSync(path.join(dist, `advent-book-front-${key}.html`), coverPreviewHtml(COVERS[key]));
  }
  console.log('wrote interior and four front covers to', path.relative(root, dist));
}
