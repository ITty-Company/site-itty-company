/* ITty Company — site mechanics.
   Film: scroll-scrub of an all-intra LTX film (video.currentTime), chapter plateaus, mobile 9:16 film, «Живий екран» (matrix3d),
   PREVIEW mode (no clips yet): scroll crossfade of the key frames with the same timeline.
   + 3D ribbon (ribbon.js), lime-scan portal, GSAP effects, UA/EN switch, «стрічка-шторка» page transition. */
const g = window.gsap, ST = window.ScrollTrigger;
g.registerPlugin(...[ST, window.SplitText, window.Flip, window.DrawSVGPlugin, window.MotionPathPlugin, window.ScrambleTextPlugin].filter(Boolean));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOB = matchMedia('(max-width:760px)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a, b) => x < a ? a : x > b ? b : x, ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k, pad = n => ('0' + n).slice(-2);
const root = document.documentElement, PAGE = root.dataset.page;
const KW = 1344, KH = 752; // key-frame base size

/* ================================================================= i18n */
const I = JSON.parse($('#i18n').textContent), META = JSON.parse($('#meta-i18n').textContent);
let LANG = root.dataset.lang === 'en' ? 'en' : 'ua';
const L = (pair) => Array.isArray(pair) ? pair[LANG === 'en' ? 1 : 0] : pair;
const tk = key => (I[key] || ['', ''])[LANG === 'en' ? 1 : 0];
const langHooks = [];
const _d = document.createElement('textarea'); const dec = h => { _d.innerHTML = h.replace(/<[^>]+>/g, ''); return _d.value; };
function applyLang(first) {
  root.lang = LANG === 'en' ? 'en' : 'uk'; root.dataset.lang = LANG;
  $$('[data-i]').forEach(el => {
    const v = tk(el.dataset.i); if (el._lang === LANG) return; el._lang = LANG;
    if (el._split) { el._split.revert(); el._split = null; el.innerHTML = v; splitStatic(el); } else el.innerHTML = v;
  });
  $$('*').forEach(el => { for (const a of el.getAttributeNames()) if (a.startsWith('data-i-')) el.setAttribute(a.slice(7), dec(tk(el.getAttribute(a)))); });
  document.title = L(META.title); const md = $('meta[name=description]'); if (md) md.content = L(META.desc);
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG));
  markers(); langHooks.forEach(f => f(first));
  root.classList.remove('lang-wait');
}
$$('.lang button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.lang === LANG) return; LANG = b.dataset.lang;
  try { localStorage.setItem('itty-lang', LANG); } catch (e) { }
  applyLang(false); ST.refresh();
}));

/* lime markers: draw when visible */
const mio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); mio.unobserve(e.target); } }), { threshold: .6 });
function markers() { $$('mark.lm').forEach(m => { if (!m.closest('.ftitle')) { if (RM) m.classList.add('on'); else mio.observe(m); } }); }

/* ================================================================= curtain («стрічка-шторка») */
const curtain = $('#curtain'), clbl = curtain && $('.clbl', curtain);
const fileOf = u => u.pathname.split('/').pop() || 'index.html';
if (window.__cu && clbl) {
  clbl.textContent = window.__cu.l;
  requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.remove('cu-noanim'); root.classList.add('cu-exit'); root.classList.remove('cu-closed'); setTimeout(() => root.classList.remove('cu-exit'), 900); }));
} else root.classList.remove('cu-closed', 'cu-noanim');
addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('cu-closed', 'cu-noanim', 'cu-exit'); });
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target || a.hasAttribute('download')) return;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname)) return;
  if (fileOf(u) === fileOf(location) && u.hash) return;
  if (fileOf(u) === fileOf(location) && u.search === location.search) return;
  e.preventDefault();
  const lbl = L(META.curtain[fileOf(u)] || META.curtain['index.html']);
  clbl.textContent = lbl;
  try { sessionStorage.setItem('itty-curtain', JSON.stringify({ l: lbl })); } catch (er) { }
  root.classList.add('cu-noanim'); root.classList.remove('cu-exit');
  requestAnimationFrame(() => { root.classList.remove('cu-noanim'); requestAnimationFrame(() => root.classList.add('cu-closed')); });
  setTimeout(() => { location.href = u.href; }, RM ? 200 : 820);
});

/* ================================================================= header, menu, cta bar */
const hd = $('.hd'), burger = $('.burger');
burger && burger.addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); o ? lenis && lenis.stop() : lenis && lenis.start(); });
$$('.nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger && burger.setAttribute('aria-expanded', false); lenis && lenis.start(); }));
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); lenis && lenis.start(); } });
let filmDark = null;
function headerTone() {
  if (hd) hd.classList.toggle('solid', scrollY > 30);
  let dark = false;
  if (filmDark !== null) dark = filmDark;
  else {
    const els = document.elementsFromPoint(innerWidth / 2, 40);
    const el = els.find(x => !x.closest('.hd') && x.closest('section,footer'));
    const sec = el && el.closest('section,footer');
    if (sec) dark = sec.classList.contains('bg-ink') || sec.classList.contains('final') || sec.classList.contains('dark') || sec.classList.contains('p404') || sec.tagName === 'FOOTER' || sec.classList.contains('portal') || (sec.classList.contains('phero') && sec.classList.contains('dark'));
  }
  root.classList.toggle('hd-dark', dark && !document.body.classList.contains('menu-open'));
}
const ctabar = $('.ctabar');
if (ctabar) {
  const hideOn = $$('.final,.ft,.kform,.p404');
  const io = new IntersectionObserver(() => { ctabar.classList.toggle('hide', hideOn.some(s => { const r = s.getBoundingClientRect(); return r.top < innerHeight * .8 && r.bottom > 0; })); }, { threshold: [0, .2] });
  hideOn.forEach(s => io.observe(s));
}

/* ================================================================= lenis + gsap */
const lenis = (!RM && window.Lenis) ? new Lenis({ lerp: .1, smoothWheel: true }) : null;
if (lenis) { lenis.on('scroll', ST.update); g.ticker.add(t => lenis.raf(t * 1000)); g.ticker.lagSmoothing(0); }
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -70, duration: 1.4 }) : t.scrollIntoView(); }));

/* ================================================================= split headings, reveals, magnetic, tilt, marquee, kb */
function onceIn(el, fn, margin = '0px 0px -6% 0px') {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { rootMargin: margin });
  io.observe(el);
  // safety: anything already on screen after load is revealed even if no observer callback fires
  setTimeout(() => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { io.disconnect(); fn(); } }, 2500);
}
function splitStatic(el) { if (!window.SplitText) return; el._split = new SplitText(el, { type: 'words', wordsClass: 'sw' }); }
function splitHeads() {
  $$('[data-split]').forEach(el => {
    if (RM || !window.SplitText) return;
    el._split = new SplitText(el, { type: 'words', wordsClass: 'sw' });
    const w = el._split.words; g.set(w, { yPercent: 70, opacity: 0, rotate: 3 });
    let done = false; onceIn(el, () => { if (done) return; done = true; g.to(w, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: .06, clearProps: 'all' }); });
  });
}
function reveals() {
  if (RM) return;
  $$('[data-reveal]').forEach(el => { g.set(el, { y: 40, opacity: 0 }); let d = false; onceIn(el, () => { if (d) return; d = true; g.to(el, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity' }); }); });
}
function magnetic() {
  if (!FINE || RM) return;
  $$('[data-magnetic]').forEach(el => {
    const x = g.quickTo(el, 'x', { duration: .5, ease: 'elastic.out(1,.4)' }), y = g.quickTo(el, 'y', { duration: .5, ease: 'elastic.out(1,.4)' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .3); y((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('mouseleave', () => { x(0); y(0); });
  });
}
function tilt() {
  if (!FINE || RM) return;
  $$('[data-tilt]').forEach(el => {
    el.style.transformStyle = 'preserve-3d'; el.parentElement.style.perspective = '1000px';
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); g.to(el, { rotateY: ((e.clientX - r.left) / r.width - .5) * 12, rotateX: -((e.clientY - r.top) / r.height - .5) * 12, duration: .6 }); });
    el.addEventListener('mouseleave', () => g.to(el, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1,.5)' }));
  });
}
function marquee() {
  $$('[data-marquee]').forEach(el => {
    if (RM) return;
    el.innerHTML += el.innerHTML;
    const tw = g.to(el, { xPercent: -50, repeat: -1, duration: +(el.dataset.marquee || 20), ease: 'none' });
    ST.create({ onUpdate: s => g.to(tw, { timeScale: 1 + Math.min(Math.abs(s.getVelocity()) / 300, 4), duration: .2, overwrite: true, onComplete: () => g.to(tw, { timeScale: 1, duration: 1 }) }) });
  });
}
function kenburns() {
  if (RM) return;
  $$('[data-kb]').forEach(el => g.fromTo(el, { scale: 1.16, yPercent: -3 }, { scale: 1.02, yPercent: 3, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));
}
/* page background shifts between chapters (lavender ↔ ink ↔ travertine) */
function bgShift() {
  const secs = $$('section[data-bgc]'); if (!secs.length || RM) return;
  secs.forEach(s => ST.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onToggle: e => { if (e.isActive) g.to(document.body, { backgroundColor: s.dataset.bgc, duration: .8, overwrite: 'auto' }); } }));
}

/* ================================================================= homography → matrix3d («Живий екран») */
function adj(m) { return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]; }
function mm(a, b) { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; }
function mv(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
function b2p(p) { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]; const v = mv(adj(m), [p[3][0], p[3][1], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
function quadCSS(w, h, dst) {
  const t = mm(b2p(dst), adj(b2p([[0, 0], [w, 0], [w, h], [0, h]])));
  for (let i = 0; i < 9; i++) t[i] = t[i] / t[8];
  return `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
}
const qpx = q => q.map(p => [p[0] * KW, p[1] * KH]);
const qlerp = (a, b, k) => a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]);
function placeScreen(el, q) { el.style.transform = quadCSS(el.offsetWidth, el.offsetHeight, qpx(q)); }
/* rotating content + chat typing */
function screenPlay(el) {
  const its = $$('.it', el); if (!its.length) return;
  let i = 0; its[0].classList.add('on');
  el._chat = () => {
    const bs = $$('.sc-chat .b', its[i] || its[0]); if (!bs.length) return;
    clearTimeout(el._ct); bs.forEach(b => b.classList.remove('show', 'typing'));
    let k = 0; const step = () => { if (k >= bs.length) return; const b = bs[k]; b.classList.add('typing'); el._ct = setTimeout(() => { b.classList.remove('typing'); b.classList.add('show'); k++; el._ct = setTimeout(step, 450); }, b.classList.contains('in') ? 500 : 900); };
    step();
  };
  if (its.length > 1) el._cyc = () => { its[i].classList.remove('on'); i = (i + 1) % its.length; its[i].classList.add('on'); };
}
function flash(el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }

/* ================================================================= ribbon (three.js) */
let RIB = null;
async function ribbon() {
  const cv = $('#ribbon'); if (!cv || RM) return;
  try { const m = await import('./ribbon.js'); RIB = m.createRibbon(cv, { mobile: MOB }); } catch (e) { console.warn('ribbon', e); }
}

/* ================================================================= FILM (index) */
function film() {
  const F = $('#film'); if (!F) return null;
  if (RM) { F.classList.add('still'); return null; }
  const CH = JSON.parse($('.chj', F).textContent);
  const AT = JSON.parse(F.dataset.at), MC = JSON.parse(F.dataset.mc), mode = F.dataset.mode;
  const VW = +F.dataset.vw, VH = +F.dataset.vh;
  const cw = Math.min(1, (VW / VH) / (KW / KH)), x0 = (1 - cw) / 2 * KW; // visible part of the key frame inside the clip
  const DARK = [false, false, true, true, true, false, false, true];
  const LOCKED = { 1: 1, 2: 1, 4: 1, 6: 1 }; // clips F2,F3,F5,F7 = locked-off camera: screens stay mapped through the clip
  const stage = $('.stage', F), media = $('.media', F), V = $('video', F), pv = $$('.pv img', F);
  const scrs = $$('.scr', F), hero = $('.fhero', F), T = $('.ftitle', F), H2 = $('h2', T), SP = $('p', T);
  const cards = $$('.fcard', F), hudL = $('.hud .hl', F), hudS = $('.hud .st', F), load = $('.hud .load s', F), rail = $('.rail i', F), hint = $('.fhint', F), fly = $('.fly', F);
  const cv = $('canvas.fx', F), ctx = cv.getContext('2d'), tip = $('.scr-tip', F);
  const fl = $('.fload', F), flb = fl && $('i s', fl), flp = fl && $('b', fl);
  media.style.width = KW + 'px'; media.style.height = KH + 'px';
  const rests = [{ t: AT[0], ch: -1 }].concat(CH.map((c, i) => ({ t: AT[c.kf], ch: i })));
  const M = rests.length, HOLD = .75;
  let cur = -2, pS = 0, vt = 0, want = 0, words = [], ready = false, dpr = Math.min(devicePixelRatio || 1, 2);
  const scrState = new Map(); scrs.forEach(s => { s._q = JSON.parse(s.dataset.q); s._kf = +s.dataset.kf.slice(1) - 1; s._dev = s.className.split(' ')[1]; screenPlay(s); scrState.set(s, 0); });
  const byKf = {}; scrs.forEach(s => { (byKf[s._kf] = byKf[s._kf] || {})[s._dev] = s; });
  if (mode === 'video') {
    V.muted = true;
    V.addEventListener('loadedmetadata', () => { V.pause(); ready = true; V.currentTime = vt = want; });
    V.addEventListener('seeked', () => { if (ready && !V.classList.contains('ready')) { V.classList.add('ready'); } });
  }
  let started = false;
  function start() {
    if (started || mode !== 'video') return; started = true;
    const src = MOB ? F.dataset.srcM : F.dataset.src;
    fetch(src).then(r => {
      if (!r.ok) throw 0; const total = +r.headers.get('content-length') || 0;
      if (!r.body || !total) return r.blob();
      const rd = r.body.getReader(); let got = 0; const parts = [];
      const pump = () => rd.read().then(x => { if (x.done) return new Blob(parts, { type: 'video/mp4' }); parts.push(x.value); got += x.value.length; const k = got / total * 100; if (load) load.style.width = k + '%'; if (fl) { flb.style.width = k + '%'; flp.textContent = Math.round(k); } return pump(); });
      return pump();
    }).then(b => { V.src = URL.createObjectURL(b); load && (load.parentNode.style.opacity = 0); }).catch(() => { V.src = src; });
    if (fl) { fl.classList.add('on'); V.addEventListener('seeked', () => fl.classList.remove('on'), { once: true }); }
  }
  if (mode === 'preview' && load) load.parentNode.style.opacity = 0;
  start();

  function setTitle(i) {
    const j = Math.max(i, 0), c = CH[j];
    if (i < 0) { H2.innerHTML = ''; SP.textContent = ''; words = []; }
    else {
      const html = L(c.t);
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      // wrap words; keep <em>/<mark> intact
      const wrap = node => { [...node.childNodes].forEach(n => { if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(' ')); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.appendChild(s); } }); n.replaceWith(f); } else if (n.nodeName === 'MARK') { n.classList.add('w'); } else wrap(n); }); };
      // (punctuation after <em>/<mark> is kept together via span.nw from the generator)
      wrap(tmp); H2.innerHTML = tmp.innerHTML; SP.textContent = L(c.s);
      words = $$('.w', H2);
      T.classList.remove('tl', 'tc'); T.classList.add(c.pos); T.classList.toggle('c8', j === 7);
    }
    hudL.textContent = (LANG === 'en' ? 'SYSTEM' : 'СИСТЕМА') + ' · ' + pad(j + 1) + ' / 08';
    hudS._want = c.status;
    if (window.ScrambleTextPlugin) g.to(hudS, { duration: .5, scrambleText: { text: c.status, chars: '01', speed: .6 }, overwrite: true, onComplete: () => { hudS.textContent = hudS._want; } }); else hudS.textContent = c.status;
    stage.classList.toggle('dk', DARK[c.kf] && i >= 0);
    if (MOB) { const cd = cards[j]; stage.style.setProperty('--cardh', (cd && i >= 0 ? cd.offsetHeight + 12 : 0) + 'px'); }
  }
  langHooks.push(() => { const c = cur; cur = -3; setTitle(c); cur = c; });
  const seg = f => ease((f - .16) / .68);

  /* view: which part of the key frame fills the stage (desktop: whole clip; mobile: 9:16 window panning between key-frame centres) */
  function mcAt(t) {
    let i = 0; while (i < AT.length - 2 && t > AT[i + 1]) i++;
    const k = clamp((t - AT[i]) / (AT[i + 1] - AT[i]), 0, 1); return lerp(MC[i], MC[i + 1], k);
  }
  const view = { s: 1, tx: 0, ty: 0, wx: x0, ww: cw * KW };
  let heroZ = 0;
  function layout(t, S) {
    const W = stage.clientWidth, H = stage.clientHeight;
    let wx = x0, ww = cw * KW;
    if (MOB) { ww = KH * 9 / 16; const xc = mcAt(t) * KW; wx = clamp(xc - ww / 2, x0, x0 + cw * KW - ww); }
    let s = Math.max(W / ww, H / KH) * S;
    let tx = W / 2 - (wx + ww / 2) * s, ty = H / 2 - KH / 2 * s;
    if (MOB && heroZ > .001) { // zoomed-out K1: laptop + phone both visible, floating in lavender
      const zs = W / (KW * .5), zcx = .55 * KW, zcy = H * .5;
      const k = ease(heroZ); s = lerp(s, zs, k);
      tx = lerp(tx, W / 2 - zcx * zs, k); ty = lerp(ty, zcy - KH / 2 * zs, k);
      const m = (k * 16).toFixed(1); media.style.webkitMaskImage = media.style.maskImage = `linear-gradient(180deg,rgba(0,0,0,${(1 - k).toFixed(3)}) 0%,#000 ${m}%,#000 ${100 - m}%,rgba(0,0,0,${(1 - k).toFixed(3)}) 100%)`;
    } else if (MOB) media.style.webkitMaskImage = media.style.maskImage = '';
    Object.assign(view, { s, tx, ty, wx, ww });
    media.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${s.toFixed(5)})`;
    if (V) { V.style.left = wx + 'px'; V.style.top = 0; V.style.width = ww + 'px'; V.style.height = KH + 'px'; }
  }
  const toScreen = (bx, by) => [view.tx + bx * view.s, view.ty + by * view.s];

  /* screens */
  function screens(tt) {
    // find segment
    let i = 0; while (i < AT.length - 2 && tt > AT[i + 1] - 1e-4) i++;
    const k = clamp((tt - AT[i]) / (AT[i + 1] - AT[i]), 0, 1);
    const near = k < .5 ? i : i + 1, d = Math.abs(tt - AT[near]);
    scrs.forEach(s => {
      let o = 0, q = s._q;
      if (LOCKED[i] && (s._kf === i || s._kf === i + 1)) {
        const other = byKf[s._kf === i ? i + 1 : i] && byKf[s._kf === i ? i + 1 : i][s._dev];
        const kk = ease((k - .2) / .6);
        if (s._kf === i) { o = 1 - kk; if (other) q = qlerp(s._q, other._q, kk); else o = 1 - ease(k / .08); }
        else { o = kk; if (other) q = qlerp(other._q, s._q, kk); else o = ease((k - .92) / .08); }
      } else if (s._kf === near) o = 1 - ease((d - .06) / .14);
      if (s._kf === near && !LOCKED[i] && near !== i && LOCKED[near]) { /* entering from a moving clip into a locked one */ }
      o = clamp(o, 0, 1);
      const was = scrState.get(s);
      if (o > .01) { if (q !== s._lastq) { placeScreen(s, q); s._lastq = q; } }
      s.style.opacity = o.toFixed(3);
      if (o > .6 && was <= .6) { flash(s); s._chat && s._chat(); if (s._cyc && !s._iv) s._iv = setInterval(() => s._cyc(), 2800); }
      if (o < .05 && was >= .05) { clearInterval(s._iv); s._iv = 0; }
      scrState.set(s, o);
    });
  }
  /* «справжній кейс» tip follows the cursor over a lit screen */
  if (FINE && tip) stage.addEventListener('mousemove', e => {
    const lit = scrs.some(s => +s.style.opacity > .6 && !s.querySelector('.sc-ai,.sc-chat') && (() => { const r = s.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom; })());
    tip.style.opacity = lit ? 1 : 0; tip.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 14}px)`;
  });

  /* PREVIEW: crossfade of key frames on the same timeline (replaced by the LTX film when clips exist) */
  function preview(tt) {
    let i = 0; while (i < AT.length - 2 && tt > AT[i + 1]) i++;
    const k = clamp((tt - AT[i]) / (AT[i + 1] - AT[i]), 0, 1), e = ease(k);
    pv.forEach((im, j) => { const o = j === i ? 1 : j === i + 1 ? e : 0; im.style.opacity = o; im.style.zIndex = j === i + 1 ? 2 : 1; im.style.filter = (j === i + 1 && e > 0 && e < 1) ? `blur(${(Math.sin(Math.PI * e) * 6).toFixed(1)}px)` : ''; });
  }

  /* particles per chapter */
  const fx = { parts: [], mode: 'dust', ch: 0, vis: 0, t0: performance.now() };
  function size() { cv.width = stage.clientWidth * dpr; cv.height = stage.clientHeight * dpr; }
  size(); addEventListener('resize', size);
  function quadOf(kf, dev) { const s = byKf[kf] && byKf[kf][dev]; if (!s) return null; return s._q.map(p => toScreen(p[0] * KW, p[1] * KH)); }
  function spawn() {
    const W = cv.width, H = cv.height, R = Math.random, m = fx.mode, c = CH[fx.ch], dk = DARK[c.kf];
    if (m === 'ping') { const q = quadOf(c.kf, 'phone'); if (q && R() < .5) { const u = R(), v = R(); const x = lerp(lerp(q[0][0], q[1][0], u), lerp(q[3][0], q[2][0], u), v), y = lerp(lerp(q[0][1], q[1][1], u), lerp(q[3][1], q[2][1], u), v); return { x: x * dpr, y: y * dpr, ring: 1, r: 2 * dpr, gr: .5 * dpr, life: 1, dec: .016, c: '198,242,58' }; } }
    if (m === 'tokens') { const q = quadOf(c.kf, 'laptop'); if (q) { const cx = (q[0][0] + q[2][0]) / 2 * dpr, cy = (q[0][1] + q[2][1]) / 2 * dpr; return { orb: 1, cx, cy, a: R() * 6.28, rx: (180 + R() * 220) * dpr, ry: (60 + R() * 90) * dpr, va: .006 + R() * .01, r: (1 + R() * 2.2) * dpr, life: 0, up: 1, c: R() < .25 ? '198,242,58' : '183,156,255' }; } }
    if (m === 'sparks') return { x: R() * W, y: H * (.6 + R() * .45), vx: (R() - .5) * .3, vy: -(.3 + R() * .7), r: (.8 + R() * 2) * dpr, life: 0, up: 1, c: R() < .15 ? '198,242,58' : '183,156,255' };
    return { x: R() * W, y: R() * H * .9, vx: (R() - .3) * .2, vy: (R() - .55) * .16, r: (.7 + R() * 1.8) * dpr, life: 0, up: 1, c: dk ? (R() < .2 ? '198,242,58' : '183,156,255') : (R() < .15 ? '106,47,224' : '255,255,255') };
  }
  function tick() {
    const t = performance.now() - fx.t0; ctx.clearRect(0, 0, cv.width, cv.height);
    if (Math.random() < .85 * (.3 + .7 * fx.vis)) fx.parts.push(spawn());
    fx.parts = fx.parts.filter(q => {
      if (q.orb) { q.a += q.va; q.x = q.cx + Math.cos(q.a) * q.rx; q.y = q.cy + Math.sin(q.a) * q.ry - q.life * 20; }
      else { q.x += q.vx || 0; q.y += q.vy || 0; }
      if (q.up) { q.life += .01; if (q.life >= 1) q.up = 0; } else q.life -= q.dec || .005;
      if (q.life <= 0 && !q.up) return false;
      const al = clamp(q.life, 0, 1);
      ctx.beginPath();
      if (q.ring) { q.r += q.gr; ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.strokeStyle = `rgba(${q.c},${al})`; ctx.lineWidth = 1.5 * dpr; ctx.stroke(); return true; }
      ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fillStyle = `rgba(${q.c},${.8 * al})`; ctx.fill(); return true;
    });
    if (fx.parts.length > 360) fx.parts.splice(0, fx.parts.length - 360);
    // lime rim light running along the business card edge (identity chapter)
    if (fx.mode === 'rim' && fx.vis > .3) {
      const c = CH[fx.ch], q = quadOf(c.kf, 'card');
      if (q) {
        const per = 3200, ph = (t % per) / per; const segs = [[q[0], q[1]], [q[1], q[2]], [q[2], q[3]], [q[3], q[0]]];
        const pos = ph * 4, si = Math.floor(pos), f = pos - si, a = segs[si][0], b = segs[si][1];
        const x = lerp(a[0], b[0], f) * dpr, y = lerp(a[1], b[1], f) * dpr;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 40 * dpr); gr.addColorStop(0, `rgba(198,242,58,${.9 * fx.vis})`); gr.addColorStop(1, 'rgba(198,242,58,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 40 * dpr, 0, 6.283); ctx.fill();
      }
    }
  }

  function render() {
    const r = F.getBoundingClientRect(), tot = F.offsetHeight - innerHeight;
    if (r.bottom < -50 || r.top > innerHeight + 50) return false;
    const raw = clamp(-r.top / tot, 0, 1);
    pS += (raw - pS) * .18; if (Math.abs(raw - pS) < .0002) pS = raw;
    const u = Math.min(pS * (M - 1 + HOLD), M - 1), i = Math.min(Math.floor(u), M - 2), f = u - i, e = seg(f);
    want = lerp(rests[i].t, rests[i + 1].t, e);
    const near = f < .5 ? f : f - 1, nr = f < .5 ? i : i + 1, ch = rests[nr].ch;
    const vis = 1 - ease((Math.abs(near) - .1) / .2);
    if (ch !== cur) { cur = ch; setTitle(ch); }
    // film time actually shown
    if (mode === 'video' && ready && V.duration) { const tg = Math.min(want, V.duration - .04); vt += (tg - vt) * .35; if (Math.abs(vt - tg) < .004) vt = tg; if (!V.seeking && Math.abs(V.currentTime - vt) > .001) V.currentTime = vt; }
    else vt = want;
    const moving = rests[i].t !== rests[i + 1].t ? Math.sin(Math.PI * e) : 0;
    heroZ = MOB ? 1 - ease((u - 1.04) / .5) : 0; root.classList.toggle('hero-on', MOB && heroZ > .3);
    layout(vt, 1 + .035 * moving);
    const vOn = mode === 'video' && V.classList.contains('ready') && heroZ < .01;
    if (V) V.style.visibility = vOn ? 'visible' : 'hidden';
    if (!vOn) preview(vt); else pv.forEach(p => p.style.opacity = 0);
    screens(vt);
    const heroO = 1 - ease(u / .42);
    hero.style.opacity = heroO; hero.style.transform = `translateY(${(-(1 - heroO) * 40).toFixed(1)}px)`;
    hero.style.visibility = heroO < .01 ? 'hidden' : 'visible';
    const endF = 1 - ease((pS - .965) / .035);
    const tv = (ch < 0 ? 0 : vis) * endF;
    words.forEach((sp, k) => {
      const d = clamp((tv - k / Math.max(1, words.length - 1) * .3) / .62, 0, 1);
      sp.style.opacity = d; sp.style.transform = `translateY(${((1 - d) * .35).toFixed(3)}em)`; sp.style.filter = d > .99 ? 'none' : `blur(${((1 - d) * 10).toFixed(1)}px)`;
      if (sp.nodeName === 'MARK') sp.classList.toggle('on', d > .9);
    });
    SP.style.opacity = tv; T.style.setProperty('--sh', tv); $('.fcta', T).style.opacity = tv;
    cards.forEach((el, k) => { const o = k === ch ? ease((tv - .3) / .5) : 0; el.style.opacity = o; el.style.transform = `translateY(${((1 - o) * 24).toFixed(1)}px)`; el.style.pointerEvents = o > .6 ? 'auto' : 'none'; });
    if (fly) { const o = ch === 5 ? ease((tv - .2) / .6) : 0; fly.style.opacity = o; fly.style.transform = `translateY(${((1 - o) * 60).toFixed(1)}px) rotate(${((1 - o) * 8 + 4).toFixed(2)}deg)`; }
    if (MOB) rail.parentNode.style.setProperty('--rp', (pS * 100).toFixed(2) + '%'); else rail.style.height = (pS * 100).toFixed(2) + '%';
    hint.style.opacity = pS < .012 ? 1 : 0;
    if (vis > .9 && hudS._want && hudS.textContent !== hudS._want && !g.isTweening(hudS)) hudS.textContent = hudS._want;
    if (MOB) [$('.hud', F), $('.rail', F)].forEach(x => x.style.opacity = (1 - heroO).toFixed(3));
    fx.mode = CH[Math.max(ch, 0)].fx; fx.ch = Math.max(ch, 0); fx.vis = ch < 0 ? .5 : vis;
    filmDark = ch >= 0 && DARK[CH[ch].kf] && r.bottom > 60;
    // 3D ribbon sweeps across every joint between chapters (masks the clip seams)
    if (RIB) {
      const joint = rests[i].t !== rests[i + 1].t && pS < .985;
      if (joint && f > .1 && f < .92) {
        const k = ease((f - .1) / .82);
        RIB.set({ show: true, head: k * 1.5, tail: k * 1.5 - .62, x: 0, y: MOB ? .4 : 0, z: MOB ? -1 : .5, rz: (i % 2 ? .18 : -.12), rx: 0, ry: (i % 2 ? .3 : -.2), s: MOB ? .8 : 1, spin: k * 2.4 });
      } else if (pS > .985 || r.top > -2) RIB.set({ show: false });
      else RIB.set({ show: false, head: 0, tail: 0 });
    }
    return true;
  }
  setTitle(-1); layout(0, 1); screens(0);
  return { render, tick };
}

/* ================================================================= PORTAL lime-scan (shader noise) */
function portal() {
  const sec = $('.portal'); if (!sec) return null;
  if (RM) { sec.classList.add('still'); return null; }
  const cv = $('canvas.gl', sec), img = $('.pa', sec), txt = $('.ptext', sec), F = $('#film');
  const AT = F ? JSON.parse(F.dataset.at) : [0], MC = F ? JSON.parse(F.dataset.mc) : [.5];
  const VW = F ? +F.dataset.vw : 960, VH = F ? +F.dataset.vh : 544, cw = Math.min(1, (VW / VH) / (KW / KH));
  let gl = null, U = {}, ok = false;
  try { gl = cv.getContext('webgl', { premultipliedAlpha: false }); } catch (e) { }
  if (gl) {
    const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;varying vec2 uv;uniform sampler2D A;uniform vec2 R;uniform vec4 WIN;uniform float P,T;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){vec2 q=vec2(uv.x,1.-uv.y);
        float ra=R.x/R.y, wa=WIN.z/WIN.w*(${KW}./${KH}.); vec2 c=q-.5; if(ra>wa) c.y*=wa/ra; else c.x*=ra/wa; vec2 t=vec2(WIN.x+(c.x+.5)*WIN.z, WIN.y+(c.y+.5)*WIN.w);
        vec3 col=texture2D(A,t).rgb;
        float y=P*1.18-.09; float edge=y+(n(vec2(q.x*9.,T*.6))-.5)*.05+(n(vec2(q.x*40.,T*2.))-.5)*.012;
        float above=step(q.y,edge);
        vec3 ink=vec3(.039,.035,.051)+n(q*R*.5+T*30.)*.035;
        col=mix(col,ink,above);
        float d=abs(q.y-edge); col+=vec3(.776,.949,.227)*(exp(-d*d/.00004)*1.4+exp(-d*d/.002)*.35)*(1.-step(1.,P));
        col+=vec3(.42,.18,.88)*exp(-d*d/.02)*.25*above;
        gl_FragColor=vec4(col,1.);}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    try {
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      ['A', 'R', 'WIN', 'P', 'T'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
      const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40, 20, 70, 255]));
      ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach(w => gl.texParameteri(gl.TEXTURE_2D, gl[w], gl.CLAMP_TO_EDGE)); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      const im = new Image(); im.onload = () => { gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); ok = true; }; im.src = img.src;
      gl.uniform1i(U.A, 0); sec.classList.add('gl');
    } catch (e) { console.warn('portal', e); gl = null; }
  }
  const size = () => { const k = Math.min(devicePixelRatio || 1, 1.5); cv.width = cv.clientWidth * k; cv.height = cv.clientHeight * k; gl && gl.viewport(0, 0, cv.width, cv.height); };
  size(); addEventListener('resize', size);
  // window of the key frame = the film's last view (desktop: clip area; mobile: 9:16 window at K8 centre)
  const win = () => { if (!MOB) return [(1 - cw) / 2, 0, cw, 1]; const ww = (KH * 9 / 16) / KW, xc = MC[MC.length - 1]; const x = clamp(xc - ww / 2, (1 - cw) / 2, (1 + cw) / 2 - ww); return [x, 0, ww, 1]; };
  if (!gl) { const w = win(); img.style.objectPosition = `${(w[0] + w[2] / 2) * 100}% 50%`; }
  let sm = 0; const t0 = performance.now();
  return () => {
    const r = sec.getBoundingClientRect(), tot = sec.offsetHeight - innerHeight;
    sec.classList.toggle('live', r.top <= 1);
    if (r.bottom < 0 || r.top > 1) return;
    const raw = clamp(-r.top / tot, 0, 1); sm += (raw - sm) * .2;
    const P = clamp(sm / .62, 0, 1); filmDark = P > .3 ? true : filmDark;
    if (gl) { const w = win(); gl.uniform2f(U.R, cv.width, cv.height); gl.uniform4f(U.WIN, w[0], w[1], w[2], w[3]); gl.uniform1f(U.P, P); gl.uniform1f(U.T, (performance.now() - t0) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
    else sec.style.setProperty('--scan', (P * 100) + '%');
    const o = ease((sm - .5) / .2); txt.style.opacity = o; txt.style.transform = `translateY(calc(-50% + ${((1 - o) * 30).toFixed(1)}px))`;
  };
}

/* ================================================================= INDEX journal */
function journal() {
  const j1 = $('.j1');
  if (j1 && !RM) {
    const track = $('.track', j1), thread = $('.thread path', j1);
    const mmq = g.matchMedia();
    mmq.add('(min-width:761px)', () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      g.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: $('.j1pin', j1), pin: true, scrub: 1, start: 'top top', end: () => '+=' + dist(), invalidateOnRefresh: true } });
      if (thread && window.DrawSVGPlugin) g.fromTo(thread, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: $('.j1pin', j1), start: 'top top', end: () => '+=' + dist(), scrub: 1 } });
    });
    mmq.add('(max-width:760px)', () => { $$('.ped', j1).forEach(p => { g.set(p, { y: 50, opacity: 0 }); onceIn(p, () => g.to(p, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })); }); });
  }
  const st = $('[data-stack]');
  if (st && !RM) {
    const cs = $$('.card', st);
    g.matchMedia().add('(min-width:761px)', () => {
      cs.forEach((el, i) => {
        if (i === cs.length - 1) return;
        g.to(el, { scale: .9, filter: 'brightness(.35) blur(2px)', ease: 'none', scrollTrigger: { trigger: cs[i + 1], start: 'top bottom', end: 'top 18%', scrub: true } });
        ST.create({ trigger: el, start: 'top 14%', endTrigger: st, end: 'bottom bottom', pin: true, pinSpacing: false });
      });
    });
    g.matchMedia().add('(max-width:760px)', () => { cs.forEach(c => { g.set(c, { y: 60, opacity: 0 }); onceIn(c, () => g.to(c, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })); }); });
  }
  $$('.cm.tall').forEach(c => { const set = () => c.style.setProperty('--ch', c.clientHeight + 'px'); set(); addEventListener('resize', set); });
  const road = $('.road');
  if (road) {
    const p = $('#roadp'), dot = $('.dot', road), lis = $$('.steps li', road);
    if (RM) { lis.forEach(l => l.classList.add('on')); return; }
    const tl = g.timeline({ scrollTrigger: { trigger: road, start: 'top 80%', end: 'bottom 40%', scrub: 1, onUpdate: s => lis.forEach((l, i) => l.classList.toggle('on', s.progress >= i / (lis.length - 1) - .04)) } });
    tl.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none' }, 0);
    tl.to(dot, { motionPath: { path: p, align: p, alignOrigin: [.5, .5] }, ease: 'none' }, 0);
  }
}
/* fill text by scroll */
function fills() {
  $$('.fill').forEach(el => {
    const ps = $$('p', el);
    const prep = () => ps.forEach(p => { const words = p.textContent.trim().split(/\s+/); p.innerHTML = words.map((w, i) => `<span class="wd${i === 0 || i === 1 ? ' acc' : ''}">${w}</span>`).join(' '); p._lang = null; });
    prep(); langHooks.push(() => { prep(); ST.refresh(); });
    if (RM) { $$('.wd', el).forEach(s => s.classList.add('lit')); return; }
    ST.create({ trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true, onUpdate: s => { const sp = $$('.wd', el), k = s.progress * sp.length; sp.forEach((w, i) => w.classList.toggle('lit', i < k)); } });
  });
}
/* final: violet sparks + ribbon */
function sparks() {
  return $$('canvas.sparks').map(cv => {
    const ctx = cv.getContext('2d'); let parts = []; const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }; size(); addEventListener('resize', size);
    return () => {
      const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || RM) return;
      const W = cv.width, H = cv.height, R = Math.random;
      if (R() < .6) parts.push({ x: R() * W, y: H + 10, vx: (R() - .5) * .4, vy: -(.4 + R() * 1.1), r: (.6 + R() * 2.2) * dpr, life: 1, c: R() < .12 ? '198,242,58' : '183,156,255' });
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(q => { q.x += q.vx + Math.sin(q.y / 60) * .2; q.y += q.vy; q.life -= .003; if (q.life <= 0) return false; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fillStyle = `rgba(${q.c},${q.life * .8})`; ctx.fill(); return true; });
    };
  });
}

/* ================================================================= inner hero: LTX loop + live screens + motes */
function pheros() {
  return $$('.phero').map(sec => {
    const media = $('.media', sec), v = $('video.loop', sec), cv = $('canvas.fx', sec), ctx = cv.getContext('2d');
    const scrs = $$('.scr', sec), mc = +sec.dataset.mc || .5, dark = sec.classList.contains('dark');
    media.style.width = KW + 'px'; media.style.height = KH + 'px'; media.style.position = 'absolute';
    scrs.forEach(s => { s._q = JSON.parse(s.dataset.q); screenPlay(s); s._chat && s._chat(); if (s._cyc) s._iv = setInterval(s._cyc, 2800); });
    let mx = 0, my = 0, smx = 0, smy = 0; const dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (FINE) addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    if (v && !RM) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { if (!v.src) { v.src = v.dataset.src; v.addEventListener('playing', () => v.classList.add('ready'), { once: true }); } v.play().catch(() => { }); } else v.pause(); }), { threshold: .05 });
      io.observe(sec);
    }
    let parts = [];
    const size = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }; size(); addEventListener('resize', size);
    const fitW = sec.dataset.fit === 'width';
    function lay(k) {
      const W = sec.clientWidth, H = sec.clientHeight;
      const s = (fitW && !MOB ? Math.max(W / KW, (H * .78) / KH) * 1.01 : Math.max(W / KW, H / KH) * 1.04) * (1 + .04 * k);
      const tx = clamp(W * .5 - mc * KW * s, W - KW * s, 0) - smx * 18;
      const ty = fitW && !MOB ? H - KH * s + 10 + H * (+sec.dataset.dy || 0) - smy * 8 : Math.max(H - KH * s, Math.min(0, (H - KH * s) / 2 - smy * 12 - k * 30));
      media.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(5)})`;
    }
    scrs.forEach(s => placeScreen(s, s._q)); lay(0);
    addEventListener('resize', () => scrs.forEach(s => placeScreen(s, s._q)));
    return () => {
      const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      smx += (mx - smx) * .05; smy += (my - smy) * .05;
      const k = RM ? 0 : clamp(-r.top / r.height, 0, 1); lay(k);
      if (RM) return;
      const W = cv.width, H = cv.height, R = Math.random;
      if (R() < .4) parts.push({ x: R() * W, y: R() * H, vx: (R() - .3) * .2, vy: -(R() * .25), r: (.7 + R() * 1.8) * dpr, life: 0, up: 1, c: dark ? (R() < .2 ? '198,242,58' : '183,156,255') : (R() < .2 ? '106,47,224' : '255,255,255') });
      ctx.clearRect(0, 0, W, H);
      parts = parts.filter(q => { q.x += q.vx; q.y += q.vy; if (q.up) { q.life += .01; if (q.life >= 1) q.up = 0; } else q.life -= .005; if (q.life <= 0 && !q.up) return false; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fillStyle = `rgba(${q.c},${.8 * q.life})`; ctx.fill(); return true; });
      if (parts.length > 200) parts.splice(0, parts.length - 200);
    };
  });
}

/* ================================================================= POSLUHY */
function posluhy() {
  $$('.checks').forEach(ul => {
    if (RM || !window.DrawSVGPlugin) return;
    const ck = $$('.ck', ul), li = $$('li', ul); g.set(ck, { drawSVG: '0%' }); g.set(li, { x: -16, opacity: 0 });
    let d = false; onceIn(ul, () => { if (d) return; d = true; g.to(ck, { drawSVG: '100%', duration: .6, stagger: .1, ease: 'power2.out' }); g.to(li, { x: 0, opacity: 1, duration: .6, stagger: .1, ease: 'power2.out', clearProps: 'transform,opacity' }); });
  });
  const sys = $('.sysb'); if (!sys) return;
  const chips = $$('.chip-t', sys), board = $('.board', sys), nodes = $$('.node', sys), path = $('.lk', sys), st = $('.sstate', sys), go = $('#sys-go');
  const POS = { site: [.16, .3], app: [.42, .2], bot: [.7, .28], ai: [.84, .66], identity: [.52, .74], banners: [.22, .72] };
  nodes.forEach(n => { const p = POS[n.dataset.id]; n.style.left = p[0] * 100 + '%'; n.style.top = p[1] * 100 + '%'; });
  const sel = new Set();
  function draw(anim) {
    const W = board.clientWidth, H = board.clientHeight, order = Object.keys(POS).filter(k => sel.has(k));
    nodes.forEach(n => n.classList.toggle('on', sel.has(n.dataset.id)));
    let d = '';
    order.forEach((k, i) => { const [x, y] = [POS[k][0] * W, POS[k][1] * H - 18]; if (!i) d = `M${x} ${y}`; else { const [px, py] = [POS[order[i - 1]][0] * W, POS[order[i - 1]][1] * H - 18]; const mx = (px + x) / 2; d += ` C ${mx} ${py - 60}, ${mx} ${y + 60}, ${x} ${y}`; } });
    if (order.length === 1) { const [x, y] = [POS[order[0]][0] * W, POS[order[0]][1] * H - 18]; d = `M${x - 30} ${y + 20} Q ${x} ${y - 40} ${x + 30} ${y + 20}`; }
    path.setAttribute('d', d || 'M0 0');
    if (anim && window.DrawSVGPlugin && !RM) g.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, ease: 'power2.inOut' });
    const n = sel.size; st.dataset.k = n === 0 ? st.dataset.s0 : n === 1 ? st.dataset.s1 : st.dataset.s2; st.innerHTML = tk(st.dataset.k);
    go.href = 'konsultatsiia.html' + (n ? '?need=' + order.join(',') : '');
  }
  chips.forEach(c => c.addEventListener('click', () => { const id = c.dataset.id; sel.has(id) ? sel.delete(id) : sel.add(id); c.setAttribute('aria-pressed', sel.has(id)); draw(true); }));
  addEventListener('resize', () => draw(false)); langHooks.push(() => draw(false)); draw(false);
}

/* ================================================================= KEISY */
function keisy() {
  const grid = $('.grid'); if (!grid) return;
  const data = JSON.parse($('#cases-json').textContent), cards = $$('.kc', grid), empty = $('.empty');
  $$('.filter button').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f; $$('.filter button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const state = window.Flip ? Flip.getState(cards) : null;
    let n = 0; cards.forEach(c => { const on = f === 'all' || c.dataset.type === f; c.classList.toggle('hide', !on); n += on; });
    empty.hidden = n > 0;
    if (state && !RM) Flip.from(state, { duration: .7, ease: 'power3.inOut', scale: true, absolute: true, onEnter: els => g.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6 }), onLeave: els => g.to(els, { opacity: 0, scale: .85, duration: .4 }) });
    ST.refresh();
  }));
  if (!RM) cards.forEach((c, i) => { g.set(c, { y: 60, opacity: 0 }); onceIn(c, () => g.to(c, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', delay: (i % 3) * .08, clearProps: 'transform,opacity' })); });
  // cursor pill
  const pill = $('.cursor-pill');
  if (FINE && pill) { addEventListener('mousemove', e => { pill.style.left = e.clientX + 'px'; pill.style.top = e.clientY + 'px'; }); cards.forEach(c => { c.addEventListener('mouseenter', () => pill.classList.add('on')); c.addEventListener('mouseleave', () => pill.classList.remove('on')); }); }
  $$('.cm.tall', grid).forEach(c => { const set = () => c.style.setProperty('--ch', c.clientHeight + 'px'); set(); addEventListener('resize', set); });
  // detail dialog
  const dlg = $('.kdlg'), kd = $('.kd', dlg), Lb = data.l;
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  function open(id) {
    const i = data.cases.findIndex(c => c.id === id); if (i < 0) return; const c = data.cases[i], nx = data.cases[(i + 1) % data.cases.length];
    const img = c.img ? (c.tall ? `<div class="cm tall"><img src="assets/shots/${c.img}-tall.webp" alt=""></div>` : `<div class="cm ig"><img src="assets/shots/${c.img}.webp" alt=""></div>`) : `<div class="cm typo"><span class="tn">${esc(c.name)}</span><span class="rib"></span></div>`;
    const ph = c.phone ? `<div class="ph"><div><img src="assets/shots/${c.phone}.webp" alt=""></div></div>` : '';
    const src = c.img ? `<p class="small" style="margin-top:10px">${L(c.img.startsWith('ig-') ? Lb.shot_ig : Lb.shot_real)}</p>` : '';
    kd.innerHTML = `<button class="x" type="button" aria-label="${L(Lb.close)}">×</button>
      <div><div class="devs"><div class="device">${img}</div>${ph}</div>${src}</div>
      <div><span class="ty">${L(Lb.types[c.type])}${c.place[0] ? ' · ' + L(c.place) : ''}</span><h2 id="kd-h">${esc(c.name)}</h2>
      <h4>${L(Lb.task)}</h4><p>${esc(L(c.d))}</p>
      ${c.did.length ? `<h4>${L(Lb.did)}</h4><ul>${c.did.map(d => `<li>${esc(L(d))}</li>`).join('')}</ul>` : ''}
      ${c.langs ? `<h4>${L(Lb.langs)}</h4><p>${esc(c.langs)}</p>` : ''}${c.stack ? `<h4>${L(Lb.stack)}</h4><p>${esc(c.stack)}</p>` : ''}
      <div class="row"><a class="btn lime" href="konsultatsiia.html?need=${c.type === 'identity' ? 'identity' : c.type === 'promo' ? 'banners' : c.type}">${L(Lb.want)}</a><button class="btn ghost" type="button" data-next="${nx.id}">${L(Lb.next)}</button></div></div>`;
    $('.x', kd).onclick = () => dlg.close(); $('[data-next]', kd).onclick = () => open(nx.id);
    if (!dlg.open) { dlg.showModal(); lenis && lenis.stop(); }
    history.replaceState(null, '', '#' + id);
  }
  dlg.addEventListener('close', () => { lenis && lenis.start(); history.replaceState(null, '', location.pathname + location.search); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  cards.forEach(c => $('.kopen', c).addEventListener('click', () => open(c.id)));
  if (location.hash) setTimeout(() => open(location.hash.slice(1)), 600);
}

/* ================================================================= YAK */
function yak() {
  const tl = $('.tl'); if (!tl) return;
  const p = $('#tlpath'), dot = $('.tlr .dot'), stps = $$('.stp');
  if (RM) { stps.forEach(s => s.classList.add('on')); return; }
  const t = g.timeline({ scrollTrigger: { trigger: $('.stps'), start: 'top 60%', end: 'bottom 60%', scrub: 1 } });
  t.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none' }, 0).to(dot, { motionPath: { path: p, align: p, alignOrigin: [.5, .5] }, ease: 'none' }, 0);
  stps.forEach(s => ST.create({ trigger: s, start: 'top 72%', end: 'bottom 30%', onToggle: e => e.isActive && s.classList.add('on') }));
}

/* ================================================================= KONSULTATSIIA */
function form() {
  const f = $('.cform'); if (!f) return;
  const K = JSON.parse(f.dataset.k), hints = JSON.parse(f.dataset.hints);
  const seg = $('.seg', f), segbg = $('.segbg', seg), contact = $('#f-contact');
  let channel = 'instagram';
  const moveSeg = () => { const b = $('[aria-checked=true]', seg); segbg.style.left = b.offsetLeft + 'px'; segbg.style.top = b.offsetTop + 'px'; segbg.style.width = b.offsetWidth + 'px'; segbg.style.height = b.offsetHeight + 'px'; };
  $$('button', seg).forEach(b => b.addEventListener('click', () => { $$('button', seg).forEach(x => x.setAttribute('aria-checked', x === b)); channel = b.dataset.v; moveSeg(); contact.type = channel === 'email' ? 'email' : channel === 'phone' || channel === 'whatsapp' ? 'tel' : 'text'; contact.focus(); }));
  setTimeout(moveSeg, 300); addEventListener('resize', moveSeg); langHooks.push(() => setTimeout(moveSeg, 50));
  // ?need= preselect
  const need = (new URLSearchParams(location.search).get('need') || '').split(',');
  $$('input[name=need]', f).forEach(i => { if (need.includes(i.value)) i.checked = true; });
  // rotating hints
  const ta = $('#f-more'), hint = $('.ta .hint', f), taw = $('.ta', f); let hi = 0;
  const showHint = () => { hint.textContent = L(hints[hi]); };
  showHint(); if (!RM) setInterval(() => { hi = (hi + 1) % hints.length; g.to(hint, { opacity: 0, y: -6, duration: .3, onComplete: () => { showHint(); g.fromTo(hint, { opacity: 0, y: 6 }, { opacity: .8, y: 0, duration: .4 }); } }); }, 3400);
  ta.addEventListener('input', () => taw.classList.toggle('has', !!ta.value)); langHooks.push(showHint);
  const err = (el, key) => { const fld = el.closest('.fld') || el.closest('label'); const e = fld && fld.classList.contains('consent') ? $('.err.c', f) : $('.err', fld); if (e) e.textContent = key ? tk(K[key]) : ''; fld && fld.classList.toggle('bad', !!key); };
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#f-name').value.trim(), cont = contact.value.trim(), needs = $$('input[name=need]:checked', f).map(i => i.parentNode.textContent.trim()), cons = $('input[name=consent]', f).checked;
    err($('#f-name'), name ? 0 : 'e_name'); err(contact, cont ? 0 : 'e_contact'); err($('input[name=need]', f), needs.length ? 0 : 'e_need'); err($('input[name=consent]', f), cons ? 0 : 'e_consent');
    if (!name || !cont || !needs.length || !cons) { const bad = $('.bad input, .bad', f); bad && bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const sub = $('button[type=submit]', f), sl = $('.sl', sub); sl.textContent = tk(K.sending).replace(/<[^>]+>/g, ''); sub.disabled = true;
    const pick = n => { const i = $(`input[name=${n}]:checked`, f); return i ? i.parentNode.textContent.trim() : '—'; };
    const strip = k => tk(K[k]).replace(/<[^>]+>/g, '');
    const msg = `${strip('msg_head')}\n${strip('name_l')} ${name}\n${strip('contact_l')} ${$('[aria-checked=true]', seg).textContent} — ${cont}\n${strip('need_l')} ${needs.join(', ')}\n${strip('budget_l')}: ${pick('budget')}\n${strip('country_l')}: ${pick('country')}\n${ta.value.trim() ? strip('more_l') + ': ' + ta.value.trim() : ''}`;
    // no backend (yet): copy the request and hand over to Instagram DM @itty.company
    const done = () => {
      setTimeout(() => {
        $$('.fld,.consent,button[type=submit],.err.c', f).forEach(x => x.hidden = true);
        const ok = $('.ok', f); ok.hidden = false; ok.focus({ preventScroll: true }); ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
        $$('mark.lm', ok).forEach(m => setTimeout(() => m.classList.add('on'), 300));
        if (!RM && window.DrawSVGPlugin) g.fromTo($('.bow path', ok), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.6, ease: 'power2.inOut' });
        burst();
      }, 500);
    };
    try { navigator.clipboard.writeText(msg).then(done, () => { $('.copied', f).hidden = true; done(); }); } catch (er) { $('.copied', f).hidden = true; done(); }
  });
  function burst() {
    const cv = $('canvas.burst', f); if (RM) return; const ctx = cv.getContext('2d'); cv.width = cv.clientWidth; cv.height = cv.clientHeight;
    const ok = $('.ok', f).getBoundingClientRect(), fr = cv.getBoundingClientRect(); const cx = ok.left - fr.left + 90, cy = ok.top - fr.top + 50;
    let ps = Array.from({ length: 90 }, () => { const a = Math.random() * 6.28, v = 2 + Math.random() * 6; return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, l: 1, c: Math.random() < .6 ? '198,242,58' : '183,156,255', r: 1.5 + Math.random() * 2.5 }; });
    (function fr2() { ctx.clearRect(0, 0, cv.width, cv.height); ps = ps.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += .12; p.vx *= .98; p.l -= .014; if (p.l <= 0) return false; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = `rgba(${p.c},${p.l})`; ctx.fill(); return true; }); if (ps.length) requestAnimationFrame(fr2); })();
  }
  const h = $('.handle'); h && h.addEventListener('click', e => { try { navigator.clipboard.writeText(h.dataset.copy).then(() => { h.dataset.msg = tk(Object.keys(I).find(k => I[k][0] === 'Скопійовано!')) || 'Copied!'; h.classList.add('copied'); setTimeout(() => h.classList.remove('copied'), 1600); }); } catch (er) { } });
}

/* ================================================================= 404 glitch */
function p404() {
  const b = $('[data-glitch]'); if (!b || RM || !window.ScrambleTextPlugin) return;
  const run = () => g.to(b, { duration: 1.2, scrambleText: { text: '404', chars: '0123456789<>/_#', speed: .6, revealDelay: .4 } });
  run(); setInterval(run, 4200);
}

/* ================================================================= loader (index) */
function loader() {
  if (PAGE !== 'index' || window.__cu) return;
  const el = document.createElement('div'); el.className = 'loader';
  el.innerHTML = `<span class="mark">${$('.hd .mark').innerHTML}</span><span class="lt">${L(['система вмикається', 'system is booting'])} · <b>0</b>%</span><span class="ln"><s></s></span>`;
  document.body.appendChild(el);
  const b = $('b', el), s = $('s', el), m = $('.mark', el); requestAnimationFrame(() => m.style.setProperty('--lm', '0%'));
  const first = $('.pv img[data-k="0"]'); let k = 0;
  const iv = setInterval(() => { k = Math.min(k + 7 + Math.random() * 9, (first && first.complete) ? 100 : 88); b.textContent = Math.round(k); s.style.width = k + '%'; if (k >= 100) { clearInterval(iv); setTimeout(() => el.classList.add('done'), 250); setTimeout(() => el.remove(), 1100); } }, 70);
  setTimeout(() => { clearInterval(iv); el.classList.add('done'); setTimeout(() => el.remove(), 900); }, 3500);
}

/* ================================================================= ribbon choreography outside the film */
function ribbonIdle() {
  if (!RIB) return;
  const fin = $('.final'), ph = $('.phero'), p4 = $('.p404'), F = $('#film');
  if (p4) {
    RIB.set({ show: true, head: 1, tail: 0, s: MOB ? .55 : .7, z: -1, x: MOB ? 0 : 2.6, y: MOB ? -3.4 : 0, rz: MOB ? 0 : .9 });
    addEventListener('pointermove', e => { const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5; RIB.set({ x: (MOB ? 0 : 2.6) + x * 2.2, y: (MOB ? -3.4 : 0) - y * 1.6, ry: x * .8, rx: y * .6, rz: -x * .3 + (MOB ? 0 : .9) }); });
    return;
  }
  if (F) { const r = F.getBoundingClientRect(); if (r.bottom > 0) return; }
  if (fin) { const r = fin.getBoundingClientRect(); if (r.top < innerHeight * .9 && r.bottom > innerHeight * .1) { const k = clamp(1 - r.top / innerHeight, 0, 1.6); RIB.set(MOB ? { show: true, head: clamp(k * .9, 0, 1), tail: clamp(k * .9 - .7, 0, 1), y: -3.3, x: 0, z: -1, rz: .1, ry: 0, rx: 0, s: .6, spin: k } : { show: true, head: clamp(k * .9, 0, 1), tail: clamp(k * .9 - .75, 0, 1), y: -.4, x: 3.4, z: -.5, rz: 1.05, ry: .2, rx: 0, s: .72, spin: k }); return; } }
  if (ph) { const r = ph.getBoundingClientRect(); if (r.bottom > innerHeight * .3) { const k = clamp(-r.top / r.height, 0, 1); RIB.set(MOB ? { show: true, head: .5 + k * .6, tail: .1 + k * .7, x: .4, y: -2.2, z: -1, rz: .25, ry: .2, rx: 0, s: .55, spin: k * 2 } : { show: true, head: .55 + k * .6, tail: .1 + k * .7, x: 3.9, y: .3, z: -.6, rz: 1.25, ry: .25, rx: 0, s: .62, spin: k * 2 }); return; } }
  RIB.set({ show: false });
}

/* ================================================================= boot */
applyLang(true);
splitHeads(); reveals(); magnetic(); tilt(); marquee(); kenburns(); bgShift(); fills();
const F = film(), P = portal(), SPK = sparks(), PH = pheros();
journal(); posluhy(); keisy(); yak(); form(); p404(); loader();
ribbon().then(() => { if (PAGE === '404') ribbonIdle(); });
addEventListener('load', () => ST.refresh());
g.ticker.add(() => {
  filmDark = null;
  const fOn = F && F.render(); if (fOn) F.tick();
  if (P) P();
  SPK.forEach(s => s()); PH.forEach(p => p());
  if (!fOn && PAGE !== '404') ribbonIdle();
  headerTone();
});
