/* Play — homepage interactions.
   One piece of state drives the stage, filmstrip, dock, library preview and taste tray. */
(function (P) {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = P.esc;
  const t = P.t;
  const nm = P.nm;
  const clone = o => JSON.parse(JSON.stringify(o));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const toEl = html => { const tpl = document.createElement('template'); tpl.innerHTML = html.trim(); return tpl.content.firstElementChild; };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const icon = (d, s = 18) => `<svg class="ico" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    upload: icon('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),
    download: icon('<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>'),
    share: icon('<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>'),
    dice: icon('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>'),
    lock: icon('<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
    lockLg: icon('<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', 28),
    heart: '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 20.5C6.2 16.2 2.8 12.8 2.8 8.8 2.8 6 5 3.9 7.6 3.9c1.8 0 3.4.9 4.4 2.5 1-1.6 2.6-2.5 4.4-2.5 2.6 0 4.8 2.1 4.8 4.9 0 4-3.4 7.4-9.2 11.7Z"/></svg>',
    spark: '<svg class="ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Z" fill="currentColor"/></svg>',
    left: icon('<path d="M15 5l-7 7 7 7"/>', 20),
    right: icon('<path d="M9 5l7 7-7 7"/>', 20),
  };
  $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
  $('#prevBtn').innerHTML = ICON.left;
  $('#nextBtn').innerHTML = ICON.right;

  /* ---------------- state ---------------- */
  const themeOf = id => P.THEMES.find(x => x.id === id) || P.THEMES[0];
  const paletteOf = id => state.extra.concat(P.PALETTES).find(p => p.id === id);
  const bgOf = id => P.BGS.find(b => b.id === id) || P.BGS[0];
  const stickerOf = id => P.STICKERS.find(s => s.id === id);
  const tplOf = id => P.TEMPLATES.find(x => x.id === id);

  const state = {
    deck: clone(P.demo()),
    deckV: 0, // bumps whenever the deck changes
    source: 'demo', // demo | upload | template
    tplId: null, // which template, so a language switch can swap its text
    theme: 'bauhaus',
    palette: null, // null = the style's own colours
    bg: 'none',
    cur: 0,
    registered: false,
    stickers: {}, // slide index -> [{ id, x, y, r, c }]
    taste: [], // [{ kind, id }]
    extra: [], // palettes the "AI" extended from the user's taste
    fresh: new Set(),
    autoplay: false,
    tab: 'theme',
    hover: null,
  };

  const colors = () => state.palette || themeOf(state.theme).colors;
  const total = () => state.deck.slides.length;
  const isLocked = i => state.source !== 'demo' && !state.registered && i >= P.FREE_PAGES;
  const lockedCount = () => (state.source === 'demo' || state.registered ? 0 : Math.max(0, total() - P.FREE_PAGES));
  const baseOpts = i => ({ theme: state.theme, colors: colors(), bg: state.bg, stickers: state.stickers[i] || [] });
  const lockMini = `<div class="lock">${ICON.lock}</div>`;
  const lockFull = i =>
    `<div class="lock"><div class="lock-card">${ICON.lockLg}<b>${t('lock.title', i + 1)}</b>` +
    `<span>${t('lock.text', total())}</span>` +
    `<button class="btn btn-primary btn-sm" data-open="unlock">${t('lock.btn', lockedCount())}</button></div></div>`;

  /* ---------------- stage ---------------- */
  const stage = $('#stage');
  const stageWrap = $('#stageWrap');

  function renderStage(fx) {
    const i = state.cur;
    const el = toEl(`<div class="stage-slide">${P.slideHTML(state.deck.slides[i], i, total(), { ...baseOpts(i), locked: isLocked(i), lockHTML: lockFull(i), interactive: true })}</div>`);
    $$('.stk-x', el).forEach(b => b.setAttribute('aria-label', t('stk.remove')));
    const olds = $$('.stage-slide', stage);
    stage.append(el);
    $('#prevBtn').disabled = i === 0;
    $('#nextBtn').disabled = i === total() - 1;
    if (!fx || reduceMotion) { olds.forEach(o => o.remove()); return; }
    const r = stage.getBoundingClientRect();
    let kf;
    let dur = 720;
    if (fx.type === 'reveal') {
      // the new look spreads out from wherever the change came from
      const x = (fx.x ?? r.left + r.width / 2) - r.left;
      const y = (fx.y ?? r.top + r.height / 2) - r.top;
      const R = Math.hypot(Math.max(Math.abs(x), Math.abs(r.width - x)), Math.max(Math.abs(y), Math.abs(r.height - y)));
      kf = { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] };
    } else {
      const d = fx.type === 'next' ? 1 : -1;
      dur = 420;
      kf = { transform: [`translateX(${d * 8}%) rotate(${d * 1.5}deg)`, 'none'], opacity: [0, 1] };
    }
    el.animate(kf, { duration: dur, easing: 'cubic-bezier(.65,0,.25,1)' }).finished.then(() => olds.forEach(o => o.remove()), () => {});
    const all = $$('.stage-slide', stage);
    if (all.length > 3) all.slice(0, all.length - 3).forEach(o => o.remove());
  }

  function scrollIntoRow(row, item) {
    if (!row || !item) return;
    const fr = row.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    if (ir.left < fr.left || ir.right > fr.right) row.scrollBy({ left: ir.left - fr.left - fr.width / 2 + ir.width / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function renderFilm(deal) {
    const film = $('#film');
    film.innerHTML = state.deck.slides
      .map((s, i) =>
        `<button class="film-item${i === state.cur ? ' on' : ''}" data-i="${i}" style="--k:${i}" aria-label="${t('film.page', i + 1, isLocked(i))}"${i === state.cur ? ' aria-current="true"' : ''}>` +
        P.slideHTML(s, i, total(), { ...baseOpts(i), locked: isLocked(i), lockHTML: lockMini }) +
        `<span class="film-no">${i + 1}</span></button>`)
      .join('');
    if (deal && !reduceMotion) {
      film.classList.add('deal');
      setTimeout(() => film.classList.remove('deal'), 700 + total() * 70);
    }
    scrollIntoRow(film, $('.film-item.on', film));
  }

  function renderDock() {
    const dock = $('#dock');
    dock.innerHTML =
      `<button class="pill pill-ap${state.autoplay ? ' on' : ''}" id="apBtn" aria-pressed="${state.autoplay}"><span class="eq"><i></i><i></i><i></i></span>${state.autoplay ? t('dock.on') : t('dock.off')}</button>` +
      P.THEMES.map(th =>
        `<button class="pill${th.id === state.theme ? ' on' : ''}" data-theme="${th.id}" aria-pressed="${th.id === state.theme}">` +
        `<span class="sw"><i style="background:${th.colors.bg}"></i><i style="background:${th.colors.a1}"></i><i style="background:${th.colors.a2}"></i></span>${nm(th)}</button>`).join('');
    scrollIntoRow(dock, $('.pill.on[data-theme]', dock));
  }

  function renderInfo() {
    const lc = lockedCount();
    $('#deckInfo').innerHTML =
      `<span class="src src-${state.source}">${t('src.' + state.source)}</span><b title="${esc(state.deck.title)}">${esc(state.deck.title)}</b>` +
      `<span class="pg">${state.cur + 1} / ${total()}</span>` +
      (lc ? `<button class="free-badge" data-open="unlock" aria-label="${t('badge.aria', P.FREE_PAGES, total())}">${ICON.lock}${t('badge', P.FREE_PAGES)}</button>` : '');
    const parts = [`${t('combo.style')} <b>${nm(themeOf(state.theme))}</b>`];
    if (state.palette) parts.push(`${t('combo.palette')} <b>${esc(nm(state.palette))}</b> <button data-clear="palette" aria-label="${t('combo.clearPalette')}">×</button>`);
    if (state.bg !== 'none') parts.push(`${t('combo.bg')} <b>${nm(bgOf(state.bg))}</b> <button data-clear="bg" aria-label="${t('combo.clearBg')}">×</button>`);
    const n = (state.stickers[state.cur] || []).length;
    if (n) parts.push(`${t('combo.stickers')} <b>${n}</b> <button data-clear="stickers" aria-label="${t('combo.clearStickers')}">×</button>`);
    $('#combo').innerHTML = `<span>${t('combo.now')}</span>${parts.join('<span>·</span>')}<span class="keys">${t('combo.keys')}</span>`;
  }

  function update(o = {}) {
    renderStage(o.fx);
    renderFilm(o.deal);
    renderDock();
    renderInfo();
    renderLibPreview();
    refreshLib();
  }

  /* ---------------- changes ---------------- */
  function setTheme(id, pt, auto) {
    if (!auto) stopAutoplay();
    state.theme = id;
    state.palette = null; // a style comes with its own colours; palettes remix on top
    update({ fx: { type: 'reveal', ...(pt || {}) } });
  }
  function setPalette(p, pt) {
    stopAutoplay();
    state.palette = p || null;
    update({ fx: { type: 'reveal', ...(pt || {}) } });
  }
  function setBg(id, pt) {
    stopAutoplay();
    state.bg = id;
    update({ fx: { type: 'reveal', ...(pt || {}) } });
  }
  function addSticker(id, x, y) {
    stopAutoplay();
    const list = (state.stickers[state.cur] = state.stickers[state.cur] || []);
    if (x == null) { x = 58 + Math.random() * 32; y = 16 + Math.random() * 64; }
    list.push({ id, x: clamp(x, 4, 96), y: clamp(y, 6, 94), r: Math.round(Math.random() * 36 - 18), c: ['a1', 'a2', 'a3'][list.length % 3] });
    if (list.length > 12) list.shift();
    update();
    const last = $$('.stage-slide', stage).pop();
    const stk = last && last.querySelector('.stk:last-of-type');
    if (stk && !reduceMotion) stk.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  }
  function go(d) {
    const next = clamp(state.cur + d, 0, total() - 1);
    if (next === state.cur) return;
    stopAutoplay();
    state.cur = next;
    update({ fx: { type: d > 0 ? 'next' : 'prev' } });
  }
  function goTo(i) {
    if (i === state.cur) return;
    const d = i > state.cur ? 1 : -1;
    stopAutoplay();
    state.cur = i;
    update({ fx: { type: d > 0 ? 'next' : 'prev' } });
  }

  /* ---------------- autoplay: the hero shows off until you touch it ---------------- */
  let apTimer = 0;
  let heroOn = true;
  let openModalId = null;
  function startAutoplay() {
    if (reduceMotion) return;
    clearInterval(apTimer);
    state.autoplay = true;
    renderDock();
    apTimer = setInterval(() => {
      if (!heroOn || document.hidden || openModalId) return;
      const k = P.THEMES.findIndex(x => x.id === state.theme);
      const next = P.THEMES[(k + 1) % P.THEMES.length];
      if (k + 1 >= P.THEMES.length && state.source === 'demo') state.cur = (state.cur + 1) % total();
      const pill = $(`#dock [data-theme="${next.id}"]`);
      setTheme(next.id, pill ? center(pill) : null, true);
    }, 2400);
  }
  function stopAutoplay() {
    if (!state.autoplay) return;
    clearInterval(apTimer);
    state.autoplay = false;
    renderDock();
  }
  new IntersectionObserver(([e]) => {
    heroOn = e.isIntersecting;
    document.body.classList.toggle('hero-on', heroOn); // the taste tray steps aside so it never covers the dock
  }, { threshold: 0.3 }).observe(stage);

  /* ---------------- chips: drag onto the slide, or just click ---------------- */
  const BRANDC = { bg: '#FFFDF8', fg: '#15121A', a1: '#FF4D1F', a2: '#2F3BFF', a3: '#FFC83D' };
  const STK_COLORS = ['#FF4D1F', '#2F3BFF', '#FFA3D1', '#FFC83D', '#15121A', '#FF4D1F'];
  const CHIPS = {
    L: [
      { kind: 'palette', id: 'tomato' }, { kind: 'bg', id: 'dots' }, { kind: 'palette', id: 'klein' },
      { kind: 'palette', id: 'dopamine' }, { kind: 'bg', id: 'checker' }, { kind: 'palette', id: 'cyber' },
    ],
    R: [
      { kind: 'sticker', id: 'star' }, { kind: 'palette', id: 'mint' }, { kind: 'sticker', id: 'smiley' },
      { kind: 'bg', id: 'sunburst' }, { kind: 'sticker', id: 'new' }, { kind: 'sticker', id: 'flower' },
    ],
  };
  // [x as a fraction of the free width, y %, rotation]
  const SPOTS = {
    L: [[0.75, 3, -5], [0.1, 17, 6], [0.85, 33, 4], [0.15, 49, -6], [0.8, 64, 7], [0.1, 81, -4]],
    R: [[0.15, 1, 8], [0.85, 15, -5], [0.1, 31, -8], [0.75, 47, 5], [0.2, 65, 10], [0.8, 80, -7]],
  };

  function chipHTML(c, k, side) {
    const sp = side && SPOTS[side][k];
    const pos = sp ? `--x:${sp[0]};--y:${sp[1]}%;--r:${sp[2]}deg;--d:${(-k * 0.8).toFixed(1)}s;` : '';
    const data = `data-kind="${c.kind}" data-id="${c.id}"`;
    if (c.kind === 'palette') {
      const p = paletteOf(c.id);
      return `<button class="chip chip-pal" ${data} style="${pos}" aria-label="${t('chip.palette', nm(p))}"><span class="dots">${[p.bg, p.a1, p.a2, p.a3].map(x => `<i style="background:${x}"></i>`).join('')}</span>${nm(p)}</button>`;
    }
    if (c.kind === 'bg') {
      const b = bgOf(c.id);
      return `<button class="chip chip-bg" ${data} style="${pos}" aria-label="${t('chip.bg', nm(b))}"><span class="sf"><span class="slide" style="${P.vars(BRANDC)}"><span class="bgp bgp-${b.id}"></span></span></span>${nm(b)}</button>`;
    }
    const s = stickerOf(c.id);
    return `<button class="chip chip-stk" ${data} style="${pos}color:${STK_COLORS[k % STK_COLORS.length]}" aria-label="${t('chip.sticker', nm(s))}">${P.stickerSVG(s)}</button>`;
  }

  function renderChips() {
    const hintGone = $('#chipHint') && $('#chipHint').classList.contains('gone');
    $('#chipsL').innerHTML =
      `<div class="chip-hint${hintGone ? ' gone' : ''}" id="chipHint">${t('chip.hint')}<svg viewBox="0 0 44 30" aria-hidden="true"><path d="M2 6C14 2 30 4 38 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M30 20l8 4 2-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` +
      CHIPS.L.map((c, k) => chipHTML(c, k, 'L')).join('');
    $('#chipsR').innerHTML = CHIPS.R.map((c, k) => chipHTML(c, k, 'R')).join('');
    $('#chipsM').innerHTML = `<span class="chips-m-label">${t('chip.try')}</span>` + CHIPS.L.concat(CHIPS.R).map((c, k) => chipHTML(c, k)).join('');
    $$('.chip').forEach(bindChip);
  }

  const hideHint = () => { const h = $('#chipHint'); if (h) h.classList.add('gone'); };
  const overStage = ev => {
    const r = stage.getBoundingClientRect();
    return ev.clientX > r.left - 16 && ev.clientX < r.right + 16 && ev.clientY > r.top - 16 && ev.clientY < r.bottom + 16;
  };

  function bindChip(el) {
    const c = { kind: el.dataset.kind, id: el.dataset.id };
    let dragged = false;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (e.pointerType !== 'mouse' && el.closest('.chips-m')) return; // let the row scroll on touch
      const start = { x: e.clientX, y: e.clientY };
      const r = el.getBoundingClientRect();
      const off = { x: e.clientX - r.left, y: e.clientY - r.top };
      let ghost = null;
      dragged = false;
      const move = ev => {
        if (!ghost) {
          if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
          ghost = el.cloneNode(true);
          ghost.classList.add('ghost');
          ghost.removeAttribute('style');
          ghost.style.cssText = el.getAttribute('style') || '';
          ghost.style.transition = 'none';
          if (el.classList.contains('chip-stk')) ghost.style.width = r.width + 'px';
          document.body.append(ghost);
          el.classList.add('lifted');
          document.body.classList.add('dragging');
          stopAutoplay();
          hideHint();
        }
        ghost.style.transform = `translate(${ev.clientX - off.x}px, ${ev.clientY - off.y}px) rotate(-6deg) scale(1.08)`;
        stageWrap.classList.toggle('drop-ok', overStage(ev));
      };
      const up = ev => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (!ghost) return;
        dragged = true;
        setTimeout(() => { dragged = false; }, 0);
        const ok = ev.type === 'pointerup' && overStage(ev);
        stageWrap.classList.remove('drop-ok');
        document.body.classList.remove('dragging');
        el.classList.remove('lifted');
        if (ok) {
          ghost.remove();
          apply(c, { x: ev.clientX, y: ev.clientY, onStage: true });
        } else {
          const back = el.getBoundingClientRect();
          ghost
            .animate([{ transform: ghost.style.transform }, { transform: `translate(${back.left}px, ${back.top}px)` }], { duration: 320, easing: 'cubic-bezier(.3,1.4,.5,1)' })
            .finished.then(() => ghost.remove(), () => ghost.remove());
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
    el.addEventListener('click', e => {
      if (dragged) return;
      hideHint();
      const onScreen = heroOn;
      apply(c, onScreen ? center(el) : null);
      if (!onScreen) e.preventDefault();
    });
  }

  function apply(c, pt) {
    if (c.kind === 'theme') setTheme(c.id, pt);
    else if (c.kind === 'palette') setPalette(paletteOf(c.id), pt);
    else if (c.kind === 'bg') setBg(c.id, pt);
    else if (c.kind === 'sticker') {
      if (pt && pt.onStage) {
        const r = stage.getBoundingClientRect();
        addSticker(c.id, ((pt.x - r.left) / r.width) * 100, ((pt.y - r.top) / r.height) * 100);
      } else addSticker(c.id);
    }
  }

  /* stickers on the stage can be moved and removed */
  stage.addEventListener('pointerdown', e => {
    const st = e.target.closest('.stk');
    if (!st || e.target.closest('.stk-x')) return;
    const item = (state.stickers[state.cur] || [])[+st.dataset.k];
    if (!item) return;
    e.preventDefault();
    stopAutoplay();
    const r = stage.getBoundingClientRect();
    st.setPointerCapture(e.pointerId);
    const move = ev => {
      item.x = clamp(((ev.clientX - r.left) / r.width) * 100, 2, 98);
      item.y = clamp(((ev.clientY - r.top) / r.height) * 100, 3, 97);
      st.style.left = item.x + '%';
      st.style.top = item.y + '%';
    };
    const up = () => {
      st.removeEventListener('pointermove', move);
      st.removeEventListener('pointerup', up);
      st.removeEventListener('pointercancel', up);
      renderFilm();
      renderLibPreview();
    };
    st.addEventListener('pointermove', move);
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
  });
  const removeSticker = st => {
    (state.stickers[state.cur] || []).splice(+st.dataset.k, 1);
    update();
  };
  stage.addEventListener('click', e => { const x = e.target.closest('.stk-x'); if (x) removeSticker(x.closest('.stk')); });
  stage.addEventListener('dblclick', e => { const st = e.target.closest('.stk'); if (st) removeSticker(st); });

  /* ---------------- generate (upload or template) ---------------- */
  let genToken = 0;
  async function generate(deck, source, o) {
    const token = ++genToken;
    stopAutoplay();
    closeModals(true);
    $('#top').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    const th = themeOf(o.theme);
    const steps = [t('gen.read', deck.slides.length), t('gen.find'), t('gen.style', nm(th)) + (o.palette ? ' · ' + esc(nm(o.palette)) : ''), t('gen.polish')];
    const gen = $('#gen');
    gen.innerHTML =
      `<div class="gen-card">${o.file ? `<div class="gen-file">${esc(o.file)}</div>` : ''}<div class="gen-title">${esc(deck.title)}</div>` +
      `<ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol><div class="gen-bar"><i></i></div></div>`;
    gen.hidden = false;
    const lis = $$('li', gen);
    const bar = $('.gen-bar i', gen);
    for (let k = 0; k < lis.length; k++) {
      lis[k].classList.add('doing');
      bar.style.width = ((k + 0.6) / lis.length) * 100 + '%';
      await wait(reduceMotion ? 60 : 460 + Math.random() * 240);
      if (token !== genToken) return;
      lis[k].classList.replace('doing', 'done');
    }
    bar.style.width = '100%';
    await wait(reduceMotion ? 0 : 220);
    if (token !== genToken) return;
    gen.hidden = true;
    Object.assign(state, { deck, source, tplId: o.tplId || null, cur: 0, stickers: {}, theme: o.theme, palette: o.palette || null, bg: o.bg || 'none' });
    state.deckV++;
    update({ fx: { type: 'reveal' }, deal: true });
    const lc = lockedCount();
    toast(lc ? t('gen.doneLocked', total(), P.FREE_PAGES) : t('gen.done', total()));
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/\.pptx$/i.test(file.name)) {
      toast(/\.(ppt|key|pdf)$/i.test(file.name) ? t('file.convert') : t('file.wrong'));
      return;
    }
    let deck;
    try {
      deck = await P.parsePptx(file);
    } catch (err) {
      console.warn('[play] could not read pptx', err);
      toast(t('file.broken'));
      return;
    }
    if (!deck.slides.length) { toast(t('file.empty')); return; }
    // keep whatever look the visitor was already playing with
    generate(deck, 'upload', { theme: state.theme, palette: state.palette, bg: state.bg, file: file.name });
  }

  const fileInput = $('#file');
  fileInput.addEventListener('change', () => { handleFile(fileInput.files[0]); fileInput.value = ''; });

  const dropover = $('#dropover');
  const hasFiles = e => Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files');
  let dragDepth = 0;
  window.addEventListener('dragenter', e => { if (!hasFiles(e)) return; dragDepth++; dropover.hidden = false; });
  window.addEventListener('dragleave', e => { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dropover.hidden = true; });
  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    dropover.hidden = true;
    handleFile(e.dataTransfer.files[0]);
  });

  /* ---------------- templates ---------------- */
  const tplColors = tp => (tp.palette ? paletteOf(tp.palette) : themeOf(tp.theme).colors);
  const tplSlide = (tp, i) => { const d = P.tplDeck(tp); return P.slideHTML(d.slides[i], i, d.slides.length, { theme: tp.theme, colors: tplColors(tp), bg: tp.bg || 'none' }); };

  function useTemplate(tp, over) {
    over = over || {};
    generate(clone(P.tplDeck(tp)), 'template', {
      tplId: tp.id,
      theme: over.theme || tp.theme,
      palette: 'palette' in over ? over.palette : tp.palette ? paletteOf(tp.palette) : null,
      bg: over.bg || tp.bg || 'none',
    });
  }

  function renderTemplates() {
    const grid = $('#tplGrid');
    grid.innerHTML = P.TEMPLATES.map(tp =>
      `<button class="tpl" data-t="${tp.id}" aria-label="${t('tpl.aria', nm(tp))}"><div class="tpl-pv">${tplSlide(tp, 0)}</div>` +
      `<div class="tpl-meta"><b>${nm(tp)}</b><span>${t('tpl.meta', P.tplDeck(tp).slides.length, nm(themeOf(tp.theme)))}</span></div><span class="tpl-go">${t('tpl.go')}</span></button>`).join('');
    $$('.tpl', grid).forEach(btn => {
      const tp = tplOf(btn.dataset.t);
      const pv = $('.tpl-pv', btn);
      const n = P.tplDeck(tp).slides.length;
      let k = 0;
      let timer = 0;
      const flip = () => { k = (k + 1) % n; pv.innerHTML = tplSlide(tp, k); };
      btn.addEventListener('pointerenter', e => {
        if (reduceMotion || e.pointerType !== 'mouse') return;
        clearInterval(timer);
        flip();
        timer = setInterval(flip, 850);
      });
      btn.addEventListener('pointerleave', () => { clearInterval(timer); if (k) { k = 0; pv.innerHTML = tplSlide(tp, 0); } });
      btn.addEventListener('click', () => { clearInterval(timer); useTemplate(tp); });
    });
  }

  /* ---------------- asset library ---------------- */
  const TABS = ['theme', 'palette', 'bg', 'sticker'];
  const tasted = (kind, id) => state.taste.some(x => x.kind === kind && x.id === id);
  const itemOf = (kind, id) => (kind === 'theme' ? themeOf(id) : kind === 'palette' ? paletteOf(id) : kind === 'bg' ? bgOf(id) : stickerOf(id));
  const nameOf = (kind, id) => nm(itemOf(kind, id));
  let libOn = false;
  let libDirty = true;
  let libSig = '';

  function renderTabs() {
    const n = { theme: P.THEMES.length, palette: P.PALETTES.length + state.extra.length, bg: P.BGS.length, sticker: P.STICKERS.length };
    $('#libTabs').innerHTML = TABS.map(id => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${state.tab === id}">${t('tab.' + id)}<small>${n[id]}</small></button>`).join('');
  }

  function libSignature() {
    const c = JSON.stringify(colors());
    return P.lang + '|' + state.tab + '|' + { theme: state.deckV, palette: state.deckV + state.theme + state.extra.length, bg: c, sticker: c }[state.tab];
  }

  function renderLib(force) {
    const sig = libSignature();
    if (!force && sig === libSig) { markLib(); return; }
    libSig = sig;
    libDirty = false;
    const cover = state.deck.slides[0];
    const n = total();
    const card = (kind, id, pv, name, sub, extra) =>
      `<article class="lc${state.fresh.has(id) ? ' fresh' : ''}" data-kind="${kind}" data-id="${id}" style="--k:${extra && extra.k ? extra.k : 0}">` +
      (extra && extra.badge ? `<span class="ai-badge">${extra.badge}</span>` : '') +
      `<button class="lc-main" aria-label="${esc(t('card.apply', name))}"><div class="lc-pv">${pv}</div><div class="lc-foot"><b>${esc(name)}</b><span>${esc(sub || '')}</span></div></button>` +
      `<button class="heart" aria-pressed="false" aria-label="${esc(t('card.save', name))}">${ICON.heart}</button></article>`;
    let html = '';
    if (state.tab === 'theme') {
      html = P.THEMES.map(th => card('theme', th.id, P.slideHTML(cover, 0, n, { theme: th.id, colors: th.colors, bg: 'none' }), nm(th), P.lang === 'en' ? th.desc : th.en)).join('');
    } else if (state.tab === 'palette') {
      let k = 0;
      html = state.extra.concat(P.PALETTES).map(p =>
        card('palette', p.id,
          P.slideHTML(cover, 0, n, { theme: state.theme, colors: p, bg: 'none' }) +
          `<div class="pal-strip">${['bg', 'fg', 'a1', 'a2', 'a3'].map(x => `<i style="background:${p[x]}"></i>`).join('')}</div>`,
          nm(p), p.ai ? '' : t('card.playPalette'), p.ai ? { badge: t('card.ai'), k: k++ } : null)).join('');
    } else if (state.tab === 'bg') {
      html = P.BGS.map(b => card('bg', b.id, `<div class="sf"><div class="slide" style="${P.vars(colors())}"><div class="bgp bgp-${b.id}"></div></div></div>`, nm(b), '')).join('');
    } else {
      html = P.STICKERS.map((s, k) => card('sticker', s.id, `<div class="stk-tile" style="${P.vars(colors())};color:var(--${['a1', 'a2', 'a3'][k % 3]})">${P.stickerSVG(s)}</div>`, nm(s), '')).join('');
    }
    $('#libGrid').innerHTML = html;
    state.fresh.clear();
    renderTabs();
    markLib();
  }

  function refreshLib() {
    if (libOn) renderLib();
    else libDirty = true;
  }

  function markLib() {
    $$('#libGrid .lc').forEach(el => {
      const { kind, id } = el.dataset;
      const on = (kind === 'theme' && id === state.theme) || (kind === 'palette' && !!state.palette && state.palette.id === id) || (kind === 'bg' && id === state.bg);
      el.classList.toggle('on', on);
      el.querySelector('.heart').setAttribute('aria-pressed', String(tasted(kind, id)));
    });
  }

  function renderLibPreview() {
    const i = isLocked(state.cur) ? 0 : state.cur;
    const o = { ...baseOpts(i) };
    const h = state.hover;
    if (h) {
      if (h.kind === 'theme') { o.theme = h.id; o.colors = themeOf(h.id).colors; }
      if (h.kind === 'palette') o.colors = paletteOf(h.id) || o.colors;
      if (h.kind === 'bg') o.bg = h.id;
      if (h.kind === 'sticker') o.stickers = o.stickers.concat([{ id: h.id, x: 82, y: 28, r: -10, c: 'a1' }]);
    }
    $('#libPreview').innerHTML = P.slideHTML(state.deck.slides[i], i, total(), o);
    const combo = `<b>${nm(themeOf(state.theme))}</b>${state.palette ? ' · <b>' + esc(nm(state.palette)) + '</b>' : ''}${state.bg !== 'none' ? ' · <b>' + nm(bgOf(state.bg)) + '</b>' : ''}`;
    $('#libCap').innerHTML = h ? t('lib.previewing', esc(nameOf(h.kind, h.id))) : t('lib.onStage', combo, i + 1);
  }

  $('#libTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    state.tab = b.dataset.tab;
    renderLib();
  });
  const libGrid = $('#libGrid');
  libGrid.addEventListener('click', e => {
    const card = e.target.closest('.lc');
    if (!card) return;
    const { kind, id } = card.dataset;
    if (e.target.closest('.heart')) { toggleTaste(kind, id); return; }
    if (kind === 'theme') setTheme(id);
    else if (kind === 'palette') setPalette(paletteOf(id));
    else if (kind === 'bg') setBg(id);
    else { addSticker(id); toast(t('lib.stuck', state.cur + 1)); }
  });
  libGrid.addEventListener('pointerover', e => {
    const card = e.target.closest('.lc');
    const h = card ? { kind: card.dataset.kind, id: card.dataset.id } : null;
    if (JSON.stringify(h) === JSON.stringify(state.hover)) return;
    state.hover = h;
    renderLibPreview();
  });
  libGrid.addEventListener('pointerleave', () => { state.hover = null; renderLibPreview(); });
  new IntersectionObserver(([e]) => { libOn = e.isIntersecting; if (libOn && libDirty) renderLib(); }, { rootMargin: '300px 0px' }).observe($('#library'));

  /* ---------------- taste: pick what you like, let Play extend it ---------------- */
  function toggleTaste(kind, id) {
    const k = state.taste.findIndex(x => x.kind === kind && x.id === id);
    if (k >= 0) state.taste.splice(k, 1);
    else {
      state.taste.push({ kind, id });
      if (state.taste.length > 8) state.taste.shift();
    }
    renderTaste();
    markLib();
  }

  function tasteThumb(x) {
    if (x.kind === 'theme') { const th = themeOf(x.id); return `<span class="ti-name" style="background:${th.colors.bg};color:${th.colors.a1}">${nm(th).slice(0, 1)}</span>`; }
    if (x.kind === 'palette') { const p = paletteOf(x.id); return `<span class="ti-dots">${[p.bg, p.a1, p.a2, p.a3].map(c => `<i style="background:${c}"></i>`).join('')}</span>`; }
    if (x.kind === 'bg') return `<span class="sf"><span class="slide" style="${P.vars(colors())}"><span class="bgp bgp-${x.id}"></span></span></span>`;
    return `<span style="${P.vars(BRANDC)};display:block;width:100%;height:100%;color:#FF4D1F">${P.stickerSVG(stickerOf(x.id))}</span>`;
  }

  function renderTaste() {
    const el = $('#taste');
    el.classList.toggle('show', state.taste.length > 0);
    $('#tasteCount').textContent = state.taste.length;
    $('#tasteItems').innerHTML = state.taste.map((x, k) => {
      const n = esc(nameOf(x.kind, x.id));
      return `<button class="ti" data-k="${k}" title="${n}" aria-label="${esc(t('taste.remove', n))}">${tasteThumb(x)}</button>`;
    }).join('');
  }

  // colour helpers for blending / extending palettes
  function hexToHsl(hex) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
    }
    return [h, s, l];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const f = n => {
      const k = (n + h / 30) % 12;
      const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }
  const shiftHue = (hex, dh) => { const [h, s, l] = hexToHsl(hex); return hslToHex(h + dh, s, l); };
  const lum = hex => {
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contrast = (a, b) => { const x = lum(a); const y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

  // generated palettes carry names in both languages so a language switch keeps them readable
  function blend(ps) {
    const [p, q] = ps.slice(-2);
    const a1 = contrast(q.a1, p.bg) >= 2.2 ? q.a1 : p.a1;
    return { id: `mix-${p.id}-${q.id}`, name: `${p.name} × ${q.name}`, en: `${p.en || p.name} × ${q.en || q.name}`, bg: p.bg, fg: p.fg, a1, a2: a1 === q.a1 ? p.a1 : q.a1, a3: q.a2 };
  }

  const TAGS = { warm: ['暖调', 'Warm'], cool: ['冷调', 'Cool'], clash: ['撞色', 'Clash'] };
  let aiSeq = 0;
  function variant(p, tag, dh) {
    const acc = tag === 'clash'
      ? { a1: shiftHue(p.a1, 180), a2: p.a1, a3: shiftHue(p.a3, 150) }
      : { a1: shiftHue(p.a1, dh), a2: shiftHue(p.a2, dh), a3: shiftHue(p.a3, dh) };
    return {
      id: 'ai' + ++aiSeq,
      name: `${p.name.split('·')[0]}·${TAGS[tag][0]}`,
      en: `${(p.en || p.name).split(' · ')[0]} · ${TAGS[tag][1]}`,
      bg: tag === 'clash' ? p.bg : shiftHue(p.bg, dh / 2), fg: p.fg, ...acc, ai: true,
    };
  }

  function applyTaste() {
    const of = kind => state.taste.filter(x => x.kind === kind).map(x => x.id);
    const themes = of('theme');
    const pals = of('palette').map(paletteOf).filter(Boolean);
    const bgs = of('bg');
    const stks = of('sticker');
    stopAutoplay();
    if (themes.length) state.theme = themes[themes.length - 1];
    state.palette = pals.length === 0 ? null : pals.length === 1 ? pals[0] : blend(pals);
    if (bgs.length) state.bg = bgs[bgs.length - 1];
    if (stks.length) {
      const spots = [[84, 22, 12], [70, 76, -10], [92, 60, 8], [60, 16, -14]];
      state.stickers[0] = stks.slice(0, 4).map((id, k) => ({ id, x: spots[k][0], y: spots[k][1], r: spots[k][2], c: ['a1', 'a2', 'a3'][k % 3] }));
    }
    state.cur = 0;
    $('#top').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => {
      update({ fx: { type: 'reveal' } });
      toast(t('taste.built', state.taste.length, state.palette ? nm(state.palette) : ''));
    }, reduceMotion ? 0 : 450);
  }

  function extendPalettes() {
    const mine = state.taste.filter(x => x.kind === 'palette').map(x => paletteOf(x.id)).filter(Boolean);
    const th = themeOf(state.theme);
    const src = mine[mine.length - 1] || { ...colors(), name: th.name, en: th.en };
    const out = [['warm', 24], ['cool', -40], ['clash', 180]].map(([tag, dh]) => variant(src, tag, dh));
    state.extra.unshift(...out);
    out.forEach(p => state.fresh.add(p.id));
    state.tab = 'palette';
    $('#library').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    renderLib(true);
    toast(t('taste.extended', nm(src)));
  }

  $('#tasteItems').addEventListener('click', e => {
    const b = e.target.closest('.ti');
    if (!b) return;
    state.taste.splice(+b.dataset.k, 1);
    renderTaste();
    markLib();
  });
  $('#tasteGo').addEventListener('click', applyTaste);
  $('#extendBtn').addEventListener('click', extendPalettes);
  $('#tasteClear').addEventListener('click', () => { state.taste = []; renderTaste(); markLib(); });

  /* ---------------- gallery wall ---------------- */
  function renderGallery() {
    P.GALLERY.forEach((row, r) => {
      const items = row.map(([tid, si, theme, pal, bg]) => {
        const tp = tplOf(tid);
        const d = P.tplDeck(tp);
        const c = pal ? paletteOf(pal) : themeOf(theme).colors;
        const tag = nm(themeOf(theme)) + (pal ? ' × ' + nm(paletteOf(pal)) : '');
        return `<button class="g-item" data-g="${tid}|${theme}|${pal || ''}|${bg}" aria-label="${esc(t('gallery.aria', nm(tp), tag))}">` +
          P.slideHTML(d.slides[si], si, d.slides.length, { theme, colors: c, bg }) +
          `<span class="g-tag">${tag}</span></button>`;
      }).join('');
      const copy = items.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');
      $('#mq' + r).innerHTML = `<div class="mq-track">${items}${copy}</div>`;
    });
  }
  document.addEventListener('click', e => {
    const g = e.target.closest('.g-item');
    if (!g) return;
    const [tid, theme, pal, bg] = g.dataset.g.split('|');
    useTemplate(tplOf(tid), { theme, palette: pal ? paletteOf(pal) : null, bg });
  });

  /* ---------------- modals ---------------- */
  let lastFocus = null;
  function openModal(id) {
    closeModals(true);
    const m = $('#' + id);
    lastFocus = document.activeElement;
    m.hidden = false;
    openModalId = id;
    requestAnimationFrame(() => m.classList.add('show'));
    setTimeout(() => { const x = $('.modal-x', m); if (x) x.focus(); }, 60);
  }
  function closeModals(silent) {
    clearInterval(shareTimer);
    $$('.modal').forEach(m => { m.classList.remove('show'); m.hidden = true; });
    if (openModalId && !silent && lastFocus && lastFocus.focus) lastFocus.focus();
    openModalId = null;
  }
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModals(); }));

  // spread a few slides like a hand of cards; the last one sits on top
  function fanOut(container, spread, centerY) {
    const els = $$('.sf', container);
    const mid = (els.length - 1) / 2;
    els.forEach((el, k) => {
      const d = k - mid;
      const dy = Math.abs(d) * 10;
      el.style.translate = `calc(-50% + ${d * spread}px) ${centerY ? `calc(-50% + ${dy}px)` : dy + 'px'}`;
      el.style.rotate = `${d * 8}deg`;
      el.style.zIndex = String(k);
    });
  }

  function openUnlock() {
    const lc = lockedCount();
    const idx = lc ? state.deck.slides.map((_, i) => i).filter(isLocked).slice(0, 3) : [0, 1, 2].filter(i => i < total());
    $('#unlockFan').innerHTML = idx.map(i => P.slideHTML(state.deck.slides[i], i, total(), { ...baseOpts(i), locked: lc > 0, lockHTML: lockMini })).join('');
    fanOut($('#unlockFan'), 40);
    $('#unlockTitle').innerHTML = lc ? t('unlock.more', lc) : state.registered ? t('unlock.done') : t('unlock.join');
    $('#unlockText').textContent = lc ? t('unlock.moreText') : state.registered ? t('unlock.doneText') : t('unlock.joinText');
    $('#unlockModal .modal-actions').hidden = state.registered;
    openModal('unlockModal');
  }

  $$('[data-register]').forEach(b => b.addEventListener('click', () => {
    const had = lockedCount();
    state.registered = true;
    closeModals();
    update();
    confetti();
    toast(had ? t('reg.unlocked', total()) : t('reg.done'));
  }));

  let shareTimer = 0;
  function openShare() {
    stopAutoplay();
    const th = themeOf(state.theme);
    const idx = [0, 1, 2].filter(i => i < total() && !isLocked(i)).reverse();
    $('#shareCard').innerHTML =
      `<div class="sc-top"><span class="logo"><span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span>play</span><span id="scLive">Made with Play</span></div>` +
      `<div class="sc-fan" id="scFan"></div>` +
      `<div class="sc-title">${esc(state.deck.title)}</div>` +
      `<div class="sc-sub">${t('share.sub', P.THEMES.length, nm(th))}</div>` +
      `<div class="sc-foot"><span>${t('share.cta')}</span><span>${t('share.try')}</span></div>`;
    const draw = (theme, c, bg) => {
      $('#scFan').innerHTML = idx.map(i => P.slideHTML(state.deck.slides[i], i, total(), { theme, colors: c, bg, stickers: state.stickers[i] || [] })).join('');
      fanOut($('#scFan'), 22, true);
    };
    draw(state.theme, colors(), state.bg);
    let k = P.THEMES.findIndex(x => x.id === state.theme);
    clearInterval(shareTimer);
    if (!reduceMotion) {
      shareTimer = setInterval(() => {
        k = (k + 1) % P.THEMES.length;
        const nt = P.THEMES[k];
        draw(nt.id, nt.colors, 'none');
        $('#scLive').textContent = t('share.live', nm(nt));
      }, 1500);
    }
    openModal('shareModal');
  }
  $('#shareBtn').addEventListener('click', openShare);
  $('#shareBtn2').addEventListener('click', openShare);
  $('#copyShare').addEventListener('click', async () => {
    const text = t('share.caption', state.deck.title, P.THEMES.length, nm(themeOf(state.theme)));
    try {
      await navigator.clipboard.writeText(text);
      toast(t('share.copied'));
    } catch (err) {
      toast(t('share.blocked') + text);
    }
  });
  $('#exportBtn').addEventListener('click', () => {
    if (!state.registered) { openUnlock(); return; }
    toast(t('export.todo'));
  });

  /* ---------------- misc controls ---------------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action],[data-open],[data-close],[data-clear]');
    if (!el) return;
    if (el.dataset.action === 'upload') { e.preventDefault(); fileInput.click(); }
    if (el.dataset.open === 'unlock') { e.preventDefault(); openUnlock(); }
    if ('close' in el.dataset) closeModals();
    if (el.dataset.clear === 'palette') setPalette(null);
    if (el.dataset.clear === 'bg') setBg('none');
    if (el.dataset.clear === 'stickers') { delete state.stickers[state.cur]; update(); }
  });

  $('#dock').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'apBtn') { if (state.autoplay) stopAutoplay(); else startAutoplay(); return; }
    hideHint();
    setTheme(b.dataset.theme, e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : center(b));
  });
  $('#film').addEventListener('click', e => { const b = e.target.closest('.film-item'); if (b) goTo(+b.dataset.i); });
  $('#prevBtn').addEventListener('click', () => go(-1));
  $('#nextBtn').addEventListener('click', () => go(1));
  $('#shuffleBtn').addEventListener('click', e => {
    stopAutoplay();
    hideHint();
    state.theme = pick(P.THEMES.filter(x => x.id !== state.theme)).id;
    state.palette = Math.random() < 0.55 ? pick(P.PALETTES) : null;
    state.bg = Math.random() < 0.5 ? pick(P.BGS.slice(1)).id : 'none';
    update({ fx: { type: 'reveal', x: e.clientX || undefined, y: e.clientY || undefined } });
  });

  document.addEventListener('keydown', e => {
    if (openModalId) {
      if (e.key === 'Escape') { closeModals(); return; }
      if (e.key === 'Tab') {
        const f = $$(`#${openModalId} button:not([disabled])`).filter(b => b.offsetParent);
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (!heroOn || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  const nav = $('#nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function confetti() {
    if (reduceMotion) return;
    const hues = P.BRAND.slice(2).map(b => b.hex);
    for (let k = 0; k < 90; k++) {
      const s = document.createElement('i');
      s.className = 'confetti';
      s.style.background = pick(hues);
      s.style.left = '50%';
      s.style.top = '38%';
      document.body.append(s);
      const a = Math.random() * Math.PI * 2;
      const v = 160 + Math.random() * 380;
      s.animate(
        [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px, ${Math.sin(a) * v + 420}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }],
        { duration: 1300 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.4,1)' },
      ).finished.then(() => s.remove(), () => s.remove());
    }
  }

  /* ---------------- static bits ---------------- */
  function bindStatic() {
    $('#tokens').addEventListener('click', async e => {
      const b = e.target.closest('.token');
      if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.hex); toast(t('token.copied', b.dataset.hex)); } catch (err) { toast(b.dataset.hex); }
    });

    const FONTS = ['"Bricolage Grotesque"', '"Inter Tight"', '"ZCOOL KuaiLe"', '"Instrument Serif"', '"Space Mono"', '"Unbounded"', '"Archivo Black"', '"Ma Shan Zheng"'];
    const HOT = ['#FF4D1F', '#2F3BFF', '#D5F53F', '#FFA3D1', '#FFC83D'];
    $$('#giant span').forEach(s => {
      let f = 0;
      s.addEventListener('pointerenter', () => {
        s.style.rotate = Math.round(Math.random() * 30 - 15) + 'deg';
        s.style.translate = `0 ${Math.round(Math.random() * -28)}px`;
        s.style.color = pick(HOT);
      });
      s.addEventListener('pointerleave', () => { s.style.translate = '0 0'; });
      s.addEventListener('click', () => {
        f = (f + 1) % FONTS.length;
        s.style.fontFamily = FONTS[f] + ', sans-serif';
        if (!reduceMotion) s.animate([{ transform: 'scale(.7)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)' });
      });
    });
  }

  // everything on the page that depends on the language but not on the stage
  function renderCopy() {
    const root = document.documentElement;
    root.lang = P.lang === 'en' ? 'en' : 'zh-CN';
    document.title = t('doc.title');
    const meta = $('meta[name="description"]');
    if (meta) meta.content = t('doc.desc');
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('#langBtn [data-l]').forEach(s => s.classList.toggle('on', s.dataset.l === P.lang));
    $('[disabled][data-i18n="share.mp4"]').title = t('share.mp4tip');

    const run = t('ticker').map(w => `<span>${w}</span><i>✺</i>`).join('');
    $('#ticker').innerHTML = run.repeat(4);
    $('#artSwatch').innerHTML = P.PALETTES.slice(0, 10).map(p => `<i style="background:${p.a1}" title="${nm(p)}"></i>`).join('');
    const mem = themeOf('memphis');
    const demo = P.demo();
    $('#artPages').innerHTML = demo.slides.slice(0, 6).map((s, i) => P.slideHTML(s, i, demo.slides.length, { theme: 'memphis', colors: mem.colors, bg: 'none', locked: i >= P.FREE_PAGES, lockHTML: '' })).join('');
    $('#tokens').innerHTML = P.BRAND.map(b => `<button class="token" data-hex="${b.hex}" aria-label="${t('token.copy', b.hex)}"><i style="background:${b.hex}"></i><span>${b.name} ${b.en}<small>${b.hex}</small></span></button>`).join('');
  }

  /* ---------------- language switch ---------------- */
  function setLang(lang) {
    if (lang === P.lang) return;
    P.lang = lang;
    try { localStorage.setItem('play-lang', lang); } catch (err) { /* per-viewer nicety only */ }
    try {
      const u = new URL(location.href);
      u.searchParams.set('lang', lang);
      history.replaceState(null, '', u);
    } catch (err) { /* sandboxed frames may refuse; the switch still works */ }
    // our own decks change language; an uploaded deck stays as the visitor wrote it
    if (state.source === 'demo') state.deck = clone(P.demo());
    if (state.source === 'template' && state.tplId) state.deck = clone(P.tplDeck(tplOf(state.tplId)));
    state.deckV++;
    closeModals(true);
    $('#toast').classList.remove('show');
    renderCopy();
    renderChips();
    renderTemplates();
    renderGallery();
    renderTaste();
    renderTabs();
    update();
    if (libOn) renderLib(true);
  }
  $('#langBtn').addEventListener('click', () => setLang(P.lang === 'en' ? 'zh' : 'en'));

  /* ---------------- boot ---------------- */
  bindStatic();
  renderCopy();
  renderChips();
  renderTemplates();
  renderGallery();
  renderTabs();
  renderTaste();
  update();
  startAutoplay();

  // handle for debugging / tests in the console
  P.app = { state, update, generate, handleFile, useTemplate, setLang };
})(window.PLAY);
