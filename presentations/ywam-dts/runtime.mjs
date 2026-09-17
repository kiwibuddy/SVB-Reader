import { MOTION } from './data.mjs';

export const js = `
(function(){
  var board = document.getElementById('board');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.getElementById('bar');
  var num = document.getElementById('num');
  var phase = document.getElementById('phase');
  var clock = document.getElementById('clock');
  var notesEl = document.getElementById('notes');
  var i = 0, notesOn = false;

  // ---- fit the fixed board into whatever window it is shared from ---------
  function fit(){
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    board.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit); fit();

  // ---- counters -----------------------------------------------------------
  function runCounters(slide){
    slide.querySelectorAll('[data-count]').forEach(function(el){
      var to = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.dec || '0', 10);
      var suffix = el.dataset.suffix || '';
      var dur = ${MOTION.dur.slow + 340}, t0 = null;
      function step(ts){
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        // same decelerate curve the app uses
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = (0).toFixed(dec) + suffix;
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

    var PACE = 460;              // one turn at a time, readable
    var STAGGER = ${MOTION.stagger.turn};
    turns.forEach(function(turn, k){
      readerTimers.push(setTimeout(function(){
        turn.classList.remove('pend');
        turn.classList.add('in');
        // keep the newest turn in frame, the way a thumb would
        var over = (turn.offsetTop + turn.offsetHeight) - (view.clientHeight - 28);
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
    slides[i].classList.remove('on');
    i = next;
    var s = slides[i];
    s.classList.add('on');
    bar.style.width = ((i + 1) / slides.length * 100) + '%';
    num.textContent = String(i + 1).padStart(2,'0') + ' / ' + slides.length;
    phase.textContent = s.dataset.phase || '';
    notesEl.textContent = s.dataset.note || '';
    document.body.classList.toggle('dark-chrome', s.classList.contains('dark'));
    // let the slide become visible before anything animates inside it
    setTimeout(function(){
      runCounters(s);
      playReader(s.querySelector('.scroller[id$="-scroll"]'));
      playPicker(s);
    }, ${MOTION.dur.quick});
    try { location.hash = String(i + 1); } catch(e){}
  }

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(i - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'r' || e.key === 'R') { playReader(slides[i].querySelector('.scroller[id$="-scroll"]')); }
    else if (e.key === 'n' || e.key === 'N') { notesOn = !notesOn; notesEl.style.display = notesOn ? 'block' : 'none'; }
    else if (e.key === 't' || e.key === 'T') { toggleTimer(); }
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
    }
  });
  board.addEventListener('click', function(e){
    if (e.clientX < window.innerWidth * 0.25) show(i - 1); else show(i + 1);
  });

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

  // jumping by hash, so a deep link or a nudge from the console lands right
  window.addEventListener('hashchange', function(){
    var h = parseInt((location.hash || '').replace('#',''), 10);
    if (!isNaN(h) && h - 1 !== i) show(Math.min(Math.max(h - 1, 0), slides.length - 1));
  });
  window.goTo = function(k){ show(k - 1); };

  var start = parseInt((location.hash || '').replace('#',''), 10);
  show(isNaN(start) ? 0 : Math.min(Math.max(start - 1, 0), slides.length - 1));
})();
`;
