/* Alpha Built Racing — v3 shared behaviour.
   Native scrolling (no smooth-scroll library), nothing pinned, transforms and opacity only.
   Everything degrades: without GSAP, with reduced motion (or ?still=1), or on touch, pages still read and work. */
(() => {
  const html = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]still=1/.test(location.search);
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap && window.ScrollTrigger ? window.gsap : null;
  const ANIM = !!G && !RM;
  if (!ANIM) html.classList.remove('anim', 'intro', 'wipe-in');
  if (G) G.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: k => { try { sessionStorage.removeItem(k); } catch (e) {} } };

  /* ---------- loader (first page of a visit) and the wolf wipe between pages ---------- */
  const wipe = $('.wipe');
  let startDelay = 0.05;
  const clearWipe = () => { html.classList.remove('intro', 'wipe-in'); if (wipe && G) G.set(wipe, { clearProps: 'all' }); window.__wipeDone = Math.round(performance.now()); };
  if (wipe && ANIM && html.classList.contains('intro')) {
    startDelay = 0.75;                                   // under a second, and it never waits on video
    G.timeline({ onComplete: clearWipe })
      .to('.wipe-bar i', { scaleX: 1, duration: 0.5, ease: 'power2.inOut' })
      .to(wipe, { yPercent: -101, duration: 0.55, ease: 'expo.inOut' }, '+=0.05');
  } else if (wipe && ANIM && html.classList.contains('wipe-in')) {
    startDelay = 0.7;
    window.__wipeStart = Math.round(performance.now());
    G.fromTo(wipe, { yPercent: 0 }, { yPercent: -101, duration: 1.0, ease: 'expo.inOut', delay: 0.15, onComplete: clearWipe });
  } else clearWipe();
  store.set('abt-seen', '1'); store.del('abt-wipe');
  addEventListener('pageshow', e => { if (e.persisted) clearWipe(); });

  if (wipe && ANIM) document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    e.preventDefault();
    store.set('abt-wipe', '1');
    let gone = false;
    const go = () => { if (!gone) { gone = true; location.href = u.href; } };
    G.fromTo(wipe, { yPercent: 101 }, { yPercent: 0, duration: 0.65, ease: 'power3.inOut', onComplete: go });
    setTimeout(go, 1200);
  });

  /* ---------- mobile menu ---------- */
  const menu = $('.menu'), burger = $('.burger');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('lock', open);
    (open ? $('.menu-close') : burger).focus();
  };
  burger.addEventListener('click', () => setMenu(true));
  $('.menu-close').addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  /* ---------- headline word masks + reveals ---------- */
  function splitWords(el) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const o = document.createElement('span'); o.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part; o.append(i); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
  }
  $$('[data-split]').forEach(splitWords);

  if (ANIM) {
    $$('[data-split]').forEach(el => {
      const first = !!el.closest('[data-first]');
      G.to($$('.wi', el), { y: 0, yPercent: 0, duration: 0.85, ease: 'expo.out', stagger: 0.04, delay: first ? startDelay : 0,
        scrollTrigger: first ? null : { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-first] [data-rv="up"]').forEach((el, i) => G.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: startDelay + 0.25 + i * 0.07 }));
    ScrollTrigger.batch($$('[data-rv="up"]').filter(el => !el.closest('[data-first]')), { start: 'top 92%', once: true,
      onEnter: els => G.to(els, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 }) });
    $$('[data-rv="rule"]').forEach(el => G.to(el, { scaleX: 1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } }));
    $$('[data-rv="clip"]').forEach(el => G.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));

    // hero: panel slides in, stripe drops down
    if ($('.hero-media')) {
      G.from('.hero-shot', { xPercent: 9, opacity: 0, duration: 1.1, ease: 'expo.out', delay: startDelay });
      G.from('.hero-stripe', { yPercent: -102, duration: 0.9, ease: 'expo.out', delay: startDelay + 0.2 });
    }
    // footer wordmark: letters rise in turn
    const giant = $('.giant');
    if (giant) G.to($$('span', giant), { y: 0, yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: giant, start: 'top 96%', once: true } });
    // makes strip drifts sideways with the scroll (transform only)
    $$('.makes-row').forEach(row => G.fromTo(row, { xPercent: 4 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* ---------- things that "arrive" once: stage bars, chart ---------- */
  const once = (els, fn, th = 0.35) => { if (!els.length) return; const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), { threshold: th }); els.forEach(el => io.observe(el)); };
  $$('.stage').forEach((s, i) => s.style.setProperty('--i', i));
  once($$('.stages'), box => $$('.stage', box).forEach((s, i) => setTimeout(() => s.classList.add('in'), ANIM ? i * 160 : 0)), 0.3);

  $$('.chart-wrap').forEach(wrap => {
    const paths = $$('.chart path', wrap), nums = $$('[data-count]', wrap);
    if (!ANIM) return;
    paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    nums.forEach(n => n.firstChild.textContent = (n.dataset.count.startsWith('+') ? '+' : '') + '0');
    once([wrap], () => {
      G.to(paths, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.12 });
      nums.forEach(n => { const end = parseFloat(n.dataset.count), o = { v: 0 }, plus = n.dataset.count.startsWith('+') ? '+' : '';
        G.to(o, { v: end, duration: 1.4, ease: 'power2.out', onUpdate: () => { n.firstChild.textContent = plus + Math.round(o.v); } }); });
    }, 0.4);
  });

  /* ---------- video governor: never more than one clip moving ---------- */
  const autos = $$('video[data-auto]'), ratios = new Map();
  let hoverOwner = null;
  const stopAll = except => $$('video').forEach(v => { if (v !== except && !v.paused) v.pause(); });
  function pick() {
    if (hoverOwner) return;
    let best = null, br = 0.4;
    autos.forEach(v => { const r = ratios.get(v) || 0; if (r > br && !v.dataset.off) { best = v; br = r; } });
    autos.forEach(v => { if (v === best) { stopAll(v); if (v.paused) v.play().catch(() => {}); } else v.pause(); });
  }
  if (autos.length) {
    const io = new IntersectionObserver(es => { es.forEach(e => ratios.set(e.target, e.intersectionRatio)); pick(); }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    autos.forEach(v => { if (RM) v.dataset.off = '1'; io.observe(v); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); else pick(); });

  $$('[data-hover]').forEach(box => {
    const v = $('video', box); if (!v) return;
    const start = () => { hoverOwner = box; stopAll(v); if (!v.src) v.src = v.dataset.src; v.play().then(() => box.classList.add('playing')).catch(() => {}); };
    const stop = () => { v.pause(); box.classList.remove('playing'); if (hoverOwner === box) hoverOwner = null; pick(); };
    if (FINE) { box.addEventListener('pointerenter', start); box.addEventListener('pointerleave', stop); }
    else if (box.dataset.hover === 'tap') box.addEventListener('click', e => { e.preventDefault(); box.classList.contains('playing') ? stop() : start(); });
  });

  $$('.vtoggle').forEach(b => {
    const v = $(b.dataset.for); if (!v) return;
    const sync = () => { b.classList.toggle('paused', v.paused); b.setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video'); };
    b.addEventListener('click', () => { if (v.paused) { delete v.dataset.off; stopAll(v); v.play().catch(() => {}); } else { v.dataset.off = '1'; v.pause(); } });
    v.addEventListener('play', sync); v.addEventListener('pause', sync); sync();
  });

  /* ---------- cursor label + magnetic button (pointer devices) ---------- */
  const cur = $('.cursor');
  if (cur && ANIM && FINE) {
    G.set(cur, { scale: 0, opacity: 0 });
    const x = G.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' }), y = G.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
    addEventListener('pointermove', e => { x(e.clientX); y(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { cur.textContent = t.dataset.cursor; cur.classList.add('on'); G.to(cur, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out', overwrite: true }); }
      else G.to(cur, { scale: 0, opacity: 0, duration: 0.18, ease: 'power2.in', overwrite: true, onComplete: () => cur.classList.remove('on') });
    });
    $$('[data-magnetic]').forEach(el => {
      const mx = G.quickTo(el, 'x', { duration: 0.45, ease: 'elastic.out(1,0.5)' }), my = G.quickTo(el, 'y', { duration: 0.45, ease: 'elastic.out(1,0.5)' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.25); my((e.clientY - r.top - r.height / 2) * 0.25); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- unlocks: "does my car need one?" ---------- */
  const chk = $('#checker');
  if (chk) {
    const h = $('#verdict-h'), p = $('#verdict-p');
    const run = () => {
      const make = chk.make.value, year = +chk.year.value, car = make === 'supra' ? 'Supra' : 'BMW';
      let a, b;
      if (!make || !year) { a = 'Pick the car and year.'; b = 'This is a general guide. We confirm on your exact car before any work starts.'; }
      else if (make === 'other') { a = 'Ask us.'; b = 'We mostly unlock BMW and Supra ECUs. Send us the year and model and we will tell you where it stands.'; }
      else if (year >= 2020) { a = 'Most likely yes.'; b = `A ${year} ${car} usually leaves the factory with a locked ECU, so it needs a bench or Femto unlock before it can take a tune. We confirm which one on your exact car.`; }
      else { a = 'Usually not.'; b = `A ${year} ${car} can normally be tuned without an unlock. Send us the car and we confirm before you book.`; }
      h.textContent = a; p.textContent = b;
      if (ANIM) G.fromTo([h, p], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out', overwrite: true });
    };
    chk.addEventListener('change', run); run();
  }

  /* ---------- quote: three short steps that end in a ready-to-send DM ---------- */
  const qf = $('#quote');
  if (qf) {
    const steps = $$('.qstep', qf), prog = $$('.prog i', qf), status = $('#q-status');
    let at = 0;
    const pre = new URLSearchParams(location.search).get('service');
    if (pre) $$('input[name="service"]', qf).forEach(i => { if (i.value === pre) i.checked = true; });
    const show = (i, quiet) => {
      at = i;
      steps.forEach((s, k) => s.classList.toggle('on', k === i));
      prog.forEach((p, k) => p.classList.toggle('done', k <= i));
      if (!quiet) { const h = $('h2', steps[i]); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      if (ANIM && !quiet) G.fromTo(steps[i].children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' });
      status.textContent = '';
    };
    const fail = (input, msg) => { const e = $('#' + input.getAttribute('aria-describedby')); if (e) e.textContent = msg; input.setAttribute('aria-invalid', 'true'); };
    const clear = () => { $$('.err', qf).forEach(e => e.textContent = ''); $$('[aria-invalid]', qf).forEach(i => i.removeAttribute('aria-invalid')); };
    const valid = i => {
      clear(); let first = null;
      if (i === 0) {
        if (!/^(19|20)\d{2}$/.test(qf.year.value.trim())) { fail(qf.year, 'Enter the model year, for example 2024.'); first = first || qf.year; }
        if (qf.model.value.trim().length < 2) { fail(qf.model, 'Enter the make and model, for example BMW M340i.'); first = first || qf.model; }
      }
      if (i === 1 && !$$('input[name="service"]:checked', qf).length) { $('#e-service').textContent = 'Pick at least one. Choose "Not sure yet" if you want advice.'; first = $('input[name="service"]', qf); }
      if (i === 2) {
        if (qf.name.value.trim().length < 2) { fail(qf.name, 'Enter your name.'); first = first || qf.name; }
        if (qf.contact.value.trim().length < 3) { fail(qf.contact, 'Enter a phone number or Instagram handle.'); first = first || qf.contact; }
      }
      if (first) first.focus();
      return !first;
    };
    const compose = () => {
      const sv = $$('input[name="service"]:checked', qf).map(i => i.value).join(', ');
      const lines = [`Hi Alpha Built, I'd like a quote.`, ``, `Car: ${qf.year.value.trim()} ${qf.model.value.trim()}`, `Looking for: ${sv}`];
      if (qf.notes.value.trim()) lines.push(`Notes: ${qf.notes.value.trim()}`);
      lines.push(``, `${qf.name.value.trim()} — ${qf.contact.value.trim()}`);
      return lines.join('\n');
    };
    qf.addEventListener('click', e => {
      const b = e.target.closest('[data-go]'); if (!b) return;
      if (b.dataset.go === 'back') return show(at - 1);
      if (b.dataset.go === 'restart') return show(0);
      if (!valid(at)) return;
      if (at === 2) $('#q-msg').textContent = compose();
      show(at + 1);
    });
    qf.addEventListener('submit', e => e.preventDefault());
    qf.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); $('[data-go="next"]', steps[at])?.click(); } });
    $('#q-copy').addEventListener('click', async () => {
      const text = $('#q-msg').textContent;
      try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Paste it into a DM to @alphabuiltracing.'; }
      catch (err) { const r = document.createRange(); r.selectNodeContents($('#q-msg')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); status.textContent = 'Select the message above and copy it.'; }
    });
    show(0, true);
  }

  if (G) addEventListener('load', () => ScrollTrigger.refresh());
})();
