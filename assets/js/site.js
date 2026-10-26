/* ============================================================
   Bhaskar Karnatak — site behaviour
   Vanilla, ~3kb. Degrades to a fully readable page without JS.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- freeze SVG packet motion when motion is unwelcome ---------- */
  if (reduced) {
    document.querySelectorAll('svg').forEach(function (svg) {
      if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
    });
  }

  /* ---------- scroll progress ---------- */
  var bar = document.querySelector('#progress span');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        bar.style.width = pct.toFixed(2) + '%';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on enter ---------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        revealer.unobserve(el);
        // Drop the stagger once the reveal has played — otherwise it would also
        // delay every later transition on the element (card hovers, etc).
        setTimeout(function () { el.style.transitionDelay = ''; },
                   800 + parseInt(el.dataset.delay || '0', 10));
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealables.forEach(function (el, i) {
      // light stagger so grids cascade rather than pop as one block
      var delay = Math.min(i % 6, 5) * 70;
      el.dataset.delay = delay;
      el.style.transitionDelay = delay + 'ms';
      revealer.observe(el);
    });
  }

  /* ---------- metric counters ---------- */
  function animateCount(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    if (isNaN(to)) return;

    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';

    if (reduced) {
      el.textContent = prefix + to.toFixed(decimals) + suffix;
      return;
    }

    var duration = 1400;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + (to * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-to]');
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCount);
  } else {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        counterObs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterObs.observe(el); });
  }

  /* ---------- side rail active state ---------- */
  var railLinks = document.querySelectorAll('.rail a[data-rail]');
  var sections = [];
  railLinks.forEach(function (link) {
    var target = document.getElementById(link.getAttribute('data-rail'));
    if (target) sections.push({ el: target, link: link });
  });

  if (sections.length && 'IntersectionObserver' in window) {
    var railObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sections.find(function (s) { return s.el === entry.target; });
        if (!match) return;
        if (entry.isIntersecting) {
          railLinks.forEach(function (l) { l.classList.remove('on'); });
          match.link.classList.add('on');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { railObs.observe(s.el); });
  }

  /* ---------- hero glow follows the pointer ---------- */
  var glow = document.getElementById('glow');
  var hero = document.querySelector('.hero');
  if (glow && hero && !reduced && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.setProperty('--gx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      glow.style.setProperty('--gy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  /* ---------- copy email ---------- */
  var copyBtn = document.getElementById('copyMail');
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-mail')).then(function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Copied ✓';
        setTimeout(function () { copyBtn.textContent = original; }, 1800);
      }).catch(function () {
        copyBtn.textContent = 'Press ⌘/Ctrl+C';
      });
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }
})();
