// Builds the four cover variants of the Jonah A5 booklet.
//   node print/jonah-booklet/build.mjs
// Output: print/jonah-booklet/dist/jonah-booklet-<colour>.html
//
// Each file is fully self-contained (fonts embedded) and paginates itself into
// fixed 148x210mm pages when opened, so screen preview and print are identical.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COVERS, buildStoryFlow, castList, voiceShare, getFootnotes, meta, questions } from './content.mjs';
import { css } from './styles.mjs';
import {
  coverPage, insideCoverPage, howToPage, storyTitlePage,
  questionPages, fillerPages, storyEndPage, backCoverPage,
} from './pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
fs.mkdirSync(dist, { recursive: true });

// --- fonts ---------------------------------------------------------------
const FACES = [
  ['Manrope-Regular.ttf', 400, 'normal'],
  ['Manrope-Medium.ttf', 500, 'normal'],
  ['Manrope-SemiBold.ttf', 600, 'normal'],
  ['Manrope-Bold.ttf', 700, 'normal'],
  ['Manrope-ExtraBold.ttf', 800, 'normal'],
];
const fontFaces = FACES.map(([file, weight]) => {
  const b64 = fs.readFileSync(path.join(root, 'assets/fonts', file)).toString('base64');
  return `@font-face{font-family:'Manrope';font-style:normal;font-weight:${weight};font-display:block;` +
    `src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}).join('\n');

// --- client-side paginator ----------------------------------------------
const paginator = `
(function(){
  var doc = document.getElementById('doc');
  var flow = Array.prototype.slice.call(document.getElementById('flow-tpl').content.children);
  var back = Array.prototype.slice.call(document.getElementById('back-tpl').content.children);
  var fillers = Array.prototype.slice.call(document.getElementById('filler-tpl').content.children);

  function storyPage(){
    var sec = document.createElement('section');
    sec.className = 'page';
    sec.setAttribute('data-kind','story');
    sec.innerHTML = '<div class="page-body"></div>' +
      '<div class="folio"><span class="mark">Jonah</span><span class="num"></span></div>';
    doc.appendChild(sec);
    return sec.querySelector('.page-body');
  }

  var body = storyPage();
  // scrollHeight under-reports the bottom padding, so measure the last box
  // against the padding box directly.
  function overflows(){
    var last = body.lastElementChild;
    if (!last) return false;
    var cs = getComputedStyle(body);
    var limit = body.getBoundingClientRect().top + body.clientHeight - parseFloat(cs.paddingBottom);
    return last.getBoundingClientRect().bottom > limit + 0.5;
  }

  // Never leave a chapter divider stranded at the foot of a page.
  function pullTrailingRule(target){
    var prev = target.previousElementSibling;
    if (prev && prev.classList.contains('chapter-rule')) { target.parentNode.insertBefore(prev, target); return true; }
    return false;
  }

  for (var i = 0; i < flow.length; i++){
    var node = flow[i].cloneNode(true);
    body.appendChild(node);
    if (!overflows()) continue;

    var bubble = node.querySelector('.bubble');
    var carried = [];
    if (bubble && bubble.children.length > 1){
      while (overflows() && bubble.children.length > 1){
        carried.unshift(bubble.lastElementChild);
        bubble.removeChild(bubble.lastElementChild);
      }
      // Drop a trailing blank stanza line rather than carrying it over.
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

    // Could not split: give the whole item its own start of page.
    for (var r = 0; r < carried.length; r++) bubble.appendChild(carried[r]);
    if (body.children.length === 1) continue; // page was empty; let it ride
    node.remove();
    var lastBody = body;
    body = storyPage();
    body.appendChild(node);
    var stranded = lastBody.lastElementChild;
    if (stranded && stranded.classList.contains('chapter-rule')){
      body.insertBefore(stranded, body.firstElementChild);
    }
  }

  // Back matter, then pad to a multiple of four so it folds as a booklet.
  var backCover = back.pop();
  for (var b = 0; b < back.length; b++) doc.appendChild(back[b]);
  var f = 0;
  while ((doc.children.length + 1) % 4 !== 0){
    doc.appendChild(fillers[Math.min(f, fillers.length - 1)].cloneNode(true));
    f++;
  }
  doc.appendChild(backCover);

  // Recto / verso and folios.
  var pages = doc.children;
  for (var p = 0; p < pages.length; p++){
    var n = p + 1;
    if (n % 2 === 0) pages[p].classList.add('verso');
    var num = pages[p].querySelector('.folio .num');
    if (num) num.textContent = n;
  }
  document.documentElement.setAttribute('data-pages', pages.length);
  document.title = document.title.replace('{{pages}}', pages.length);
})();
`;

// --- assemble ------------------------------------------------------------
const flowItems = buildStoryFlow();
const share = voiceShare();
const cast = castList();
const [qA, qB] = questionPages(questions);
const endPage = storyEndPage(getFootnotes());

function html(cover) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Jonah — ${cover.name} cover — SourceView Together</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${fontFaces}</style>
<style>${css(cover)}</style>
</head>
<body>
<main id="doc">
${coverPage(cover)}
${insideCoverPage()}
${howToPage()}
${storyTitlePage(meta, share, cast)}
</main>

<template id="flow-tpl">${flowItems.join('\n')}</template>
<template id="back-tpl">
${endPage}
${qA}
${qB}
${backCoverPage(share, cover)}
</template>
<template id="filler-tpl">${fillerPages().join('\n')}</template>

<script>${paginator}</script>
</body>
</html>`;
}

for (const key of ['black', 'red', 'green', 'blue']) {
  const file = path.join(dist, `jonah-booklet-${key}.html`);
  fs.writeFileSync(file, html(COVERS[key]));
  console.log('wrote', path.relative(root, file), (fs.statSync(file).size / 1024).toFixed(0) + 'KB');
}
