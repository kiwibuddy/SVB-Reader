import { MOTION } from './data.mjs';

// Deck engine per the nb-presentation skill (entry cover, keyed slides,
// counters, source modals), plus the three things this deck adds: the reader
// that plays turn by turn, the four-part picker, and the breakout countdown.
export const js = `
(function(){
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var entry  = document.getElementById('entry');
  var prog   = document.getElementById('prog');
  var clock  = document.getElementById('clock');
  var notesEl= document.getElementById('notes');
  var modal  = document.getElementById('modal');
  var i = 0, started = false, notesOn = false;

  // ---- counters -----------------------------------------------------------
  function runCounters(slide){
    slide.querySelectorAll('.counter').forEach(function(el){
      if (el.dataset.done) return; el.dataset.done = '1';
      var to = parseFloat(el.dataset.target || '0');
      var dec = String(el.dataset.target).indexOf('.') > -1 ? 1 : 0;
      var suffix = el.dataset.suffix || '';
      var dur = ${MOTION.dur.slow + 340}, t0 = null;
      function step(ts){
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        var v = to * e;
        el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-NZ')) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ---- the reader, revealing turn by turn at the app's own stagger --------
  var readerTimers = [];
  function stopReader(){ readerTimers.forEach(clearTimeout); readerTimers = []; }

  function playReader(scroll){
    if (!scroll) return;
    stopReader();
    var turns = Array.prototype.slice.call(scroll.querySelectorAll('.turn'));
    var view = scroll.parentElement;
    turns.forEach(function(t){ t.classList.remove('in'); t.classList.add('pend'); });
    scroll.style.transform = 'translateY(0)';

    var PACE = 460;
    var STAGGER = ${MOTION.stagger.turn};
    turns.forEach(function(turn, k){
      readerTimers.push(setTimeout(function(){
        turn.classList.remove('pend');
        turn.classList.add('in');
        var over = (turn.offsetTop + turn.offsetHeight) - (view.clientHeight - 24);
        if (over > 0) scroll.style.transform = 'translateY(' + (-over) + 'px)';
      }, k * PACE + (k % ${MOTION.stagger.max}) * STAGGER));
    });
  }

  // ---- the four-part picker cycling through its colours -------------------
  var pickTimer = null;
  function playPicker(slide){
    clearInterval(pickTimer);
    var pick = slide.querySelector('.picker');
    if (!pick) return;
    var sws = Array.prototype.slice.call(pick.querySelectorAll('.sw'));
    var p = 0;
    function tick(){
      sws.forEach(function(s, k){ s.classList.toggle('pick', k === p); });
      p = (p + 1) % sws.length;
    }
    tick(); pickTimer = setInterval(tick, 1400);
  }

  // ---- nav ----------------------------------------------------------------
  function show(next){
    if (next < 0 || next >= slides.length) return;
    stopReader(); clearInterval(pickTimer);
    slides[i].classList.remove('active');
    i = next;
    var s = slides[i];
    s.classList.add('active');
    prog.style.width = ((i + 1) / slides.length * 100) + '%';
    notesEl.textContent = s.dataset.note || '';
    setTimeout(function(){
      runCounters(s);
      playReader(s.querySelector('.scroller[id$="-scroll"]'));
      playPicker(s);
    }, ${MOTION.dur.quick});
    try { location.hash = String(i + 1); } catch(e){}
  }

  function begin(){
    if (started) return;
    started = true;
    entry.classList.add('out');
    slides[i].classList.add('active');
    prog.style.width = ((i + 1) / slides.length * 100) + '%';
    notesEl.textContent = slides[i].dataset.note || '';
    setTimeout(function(){
      runCounters(slides[i]);
      playReader(slides[i].querySelector('.scroller[id$="-scroll"]'));
      playPicker(slides[i]);
    }, 240);
  }
  entry.addEventListener('click', begin);
  document.getElementById('next').onclick = function(){ started ? show(i + 1) : begin(); };
  document.getElementById('prev').onclick = function(){ if (started) show(i - 1); };

  document.addEventListener('keydown', function(e){
    if (!started) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); begin(); return;
      }
    }
    if (modal.classList.contains('open')) { if (e.key === 'Escape') closeModal(); return; }
    if (['ArrowRight','ArrowDown',' ','PageDown'].indexOf(e.key) > -1) { e.preventDefault(); show(i + 1); }
    else if (['ArrowLeft','ArrowUp','PageUp'].indexOf(e.key) > -1) { e.preventDefault(); show(i - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'r' || e.key === 'R') playReader(slides[i].querySelector('.scroller[id$="-scroll"]'));
    else if (e.key === 'n' || e.key === 'N') { notesOn = !notesOn; notesEl.style.display = notesOn ? 'block' : 'none'; }
    else if (e.key === 't' || e.key === 'T') toggleTimer();
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });

  // ---- source modals ------------------------------------------------------
  function openModal(id){
    var d = SOURCES[id]; if (!d) return;
    document.getElementById('m-stat').textContent = d.stat;
    document.getElementById('m-title').textContent = d.title;
    document.getElementById('m-body').textContent = d.body;
    document.getElementById('m-src').innerHTML = 'Source: ' + d.source +
      (d.link ? '<br><a href="' + d.link + '" target="_blank" rel="noopener">View source &rarr;</a>' : '');
    modal.classList.add('open');
  }
  function closeModal(){ modal.classList.remove('open'); }
  document.querySelectorAll('[data-modal]').forEach(function(el){
    el.addEventListener('click', function(){ openModal(el.dataset.modal); });
  });
  document.getElementById('m-close').onclick = closeModal;
  modal.addEventListener('click', function(e){ if (e.target.id === 'modal') closeModal(); });

  // ---- breakout countdown -------------------------------------------------
  var tRun = null, tLeft = 15 * 60;
  function paint(){
    var m = Math.floor(tLeft / 60), s = tLeft % 60;
    clock.textContent = m + ':' + String(s).padStart(2,'0');
  }
  function toggleTimer(){
    if (tRun) { clearInterval(tRun); tRun = null; clock.classList.remove('run'); return; }
    clock.classList.add('run');
    tRun = setInterval(function(){
      if (tLeft > 0) tLeft--; else { clearInterval(tRun); tRun = null; clock.classList.remove('run'); }
      paint();
    }, 1000);
  }
  paint();

  window.addEventListener('hashchange', function(){
    var h = parseInt((location.hash || '').replace('#',''), 10);
    if (!isNaN(h) && h - 1 !== i) { if (!started) begin(); show(Math.min(Math.max(h - 1, 0), slides.length - 1)); }
  });
  window.goTo = function(k){ if (!started) begin(); show(k - 1); };

  var start = parseInt((location.hash || '').replace('#',''), 10);
  if (!isNaN(start)) { i = Math.min(Math.max(start - 1, 0), slides.length - 1); begin(); }
})();
`;
