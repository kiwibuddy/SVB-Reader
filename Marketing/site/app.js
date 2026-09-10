/*
 * Landing page behaviour. No dependencies, no build step.
 *
 * Two things happen here, and both exist to demonstrate the product rather than
 * to decorate the page: the passage can be switched between undifferentiated
 * prose and the app's own attribution, and a visitor can take a colour and watch
 * everything else recede — which is the single interaction the app is built on.
 */
(function () {
  'use strict';

  var wall = document.getElementById('wall');
  var script = document.getElementById('script');
  var picker = document.getElementById('picker');
  var viewButtons = document.querySelectorAll('.seg button');
  var takeButtons = document.querySelectorAll('.chips button');
  var nudged = false;

  // The guide pages share this file but have no interactive passage, so the
  // demo half is skipped and only the reveal and nav behaviour runs.
  var hasDemo = wall && script && picker;

  function setView(view) {
    var colour = view === 'colour';

    wall.hidden = colour;
    script.hidden = !colour;
    picker.hidden = !colour;

    viewButtons.forEach(function (b) {
      b.classList.toggle('on', b.dataset.view === view);
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    });

    // Re-trigger the entrance so the bubbles arrive in sequence each time,
    // which is what makes the switch feel like the app rather than a toggle.
    if (colour) {
      Array.prototype.forEach.call(script.children, function (bub, i) {
        bub.style.animation = 'none';
        void bub.offsetWidth;
        bub.style.animation = '';
        bub.style.animationDelay = i * 0.07 + 's';
      });
    } else {
      take('none');
    }
  }

  function take(colour) {
    var all = colour === 'none';

    script.classList.toggle('taking', !all);
    Array.prototype.forEach.call(script.children, function (bub) {
      bub.classList.toggle('mine', !all && bub.classList.contains(colour));
    });

    takeButtons.forEach(function (b) {
      b.classList.toggle('on', b.dataset.take === colour);
      b.setAttribute('aria-pressed', String(b.dataset.take === colour));
    });
  }

  if (hasDemo) {
    viewButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        nudged = true;
        setView(b.dataset.view);
      });
    });

    takeButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        take(b.dataset.take);
      });
    });

    // Show the coloured version unprompted after a moment. Someone who does not
    // press anything still needs to see the point of the product.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTimeout(function () {
        if (nudged) return;
        nudged = true;
        setView('colour');
      }, 2600);
    }
  }

  /* ── reveal on scroll ──────────────────────────────────────────────────── */

  var reveals = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    reveals.forEach(function (el) {
      el.classList.add('in');
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          // Stagger siblings so a grid arrives as a group, not all at once.
          var siblings = Array.prototype.slice.call(entry.target.parentNode.children);
          var i = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = Math.min(i, 5) * 0.06 + 's';
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    reveals.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ── nav hairline once scrolled ────────────────────────────────────────── */

  var nav = document.querySelector('.nav');
  var onScroll = function () {
    nav.classList.toggle('stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
