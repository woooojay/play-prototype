/* Play — homepage interactions.
   One piece of state drives the stage, filmstrip, dock, library preview and taste tray. */
(function (P) {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = P.esc;
  const clone = o => JSON.parse(JSON.stringify(o));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const toEl = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
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
  const themeOf = id => P.THEMES.find(t => t.id === id) || P.THEMES[0];
  const paletteOf = id => state.extra.concat(P.PALETTES).find(p => p.id === id);
  const bgOf = id => P.BGS.find(b => b.id === id) || P.BGS[0];
  const stickerOf = id => P.STICKERS.find(s => s.id === id);
  const tplOf = id => P.TEMPLATES.find(t => t.id === id);

  const state = {
    deck: clone(P.DEMO),
    deckV: 0, // bumps whenever a new deck is generated
    source: 'demo', // demo | upload | template
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
    `<div class="lock"><div class="lock-card">${ICON.lockLg}<b>第 ${i + 1} 页已经做好了</b>` +
    `<span>免费注册，看完全部 ${total()} 页，还能导出 PPTX</span>` +
    `<button class="btn btn-primary btn-sm" data-open="unlock">免费解锁剩下 ${lockedCount()} 页</button></div></div>`;

  /* ---------------- stage ---------------- */
  const stage = $('#stage');
  const stageWrap = $('#stageWrap');

  function renderStage(fx) {
    const i = state.cur;
    const el = toEl(`<div class="stage-slide">${P.slideHTML(state.deck.slides[i], i, total(), { ...baseOpts(i), locked: isLocked(i), lockHTML: lockFull(i), interactive: true })}</div>`);
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
        `<button class="film-item${i === state.cur ? ' on' : ''}" data-i="${i}" style="--k:${i}" aria-label="第 ${i + 1} 页${isLocked(i) ? '（注册后解锁）' : ''}"${i === state.cur ? ' aria-current="true"' : ''}>` +
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
      `<button class="pill pill-ap${state.autoplay ? ' on' : ''}" id="apBtn" aria-pressed="${state.autoplay}"><span class="eq"><i></i><i></i><i></i></span>${state.autoplay ? '自动换装中' : '自动换装'}</button>` +
      P.THEMES.map(t =>
        `<button class="pill${t.id === state.theme ? ' on' : ''}" data-theme="${t.id}" aria-pressed="${t.id === state.theme}">` +
        `<span class="sw"><i style="background:${t.colors.bg}"></i><i style="background:${t.colors.a1}"></i><i style="background:${t.colors.a2}"></i></span>${t.name}</button>`).join('');
    scrollIntoRow(dock, $('.pill.on[data-theme]', dock));
  }

  function renderInfo() {
    const src = { demo: '示例', upload: '你的 PPT', template: '模板' }[state.source];
    const lc = lockedCount();
    $('#deckInfo').innerHTML =
      `<span class="src src-${state.source}">${src}</span><b title="${esc(state.deck.title)}">${esc(state.deck.title)}</b>` +
      `<span class="pg">${state.cur + 1} / ${total()}</span>` +
      (lc ? `<button class="free-badge" data-open="unlock" aria-label="已免费预览 ${P.FREE_PAGES} 页，注册解锁全部 ${total()} 页">${ICON.lock}免费看了 ${P.FREE_PAGES} 页 · 解锁</button>` : '');
    const parts = [`风格 <b>${themeOf(state.theme).name}</b>`];
    if (state.palette) parts.push(`配色 <b>${esc(state.palette.name)}</b> <button data-clear="palette" aria-label="清除配色">×</button>`);
    if (state.bg !== 'none') parts.push(`背景 <b>${bgOf(state.bg).name}</b> <button data-clear="bg" aria-label="清除背景">×</button>`);
    const n = (state.stickers[state.cur] || []).length;
    if (n) parts.push(`贴纸 <b>${n}</b> <button data-clear="stickers" aria-label="清除这一页的贴纸">×</button>`);
    $('#combo').innerHTML = `<span>当前组合</span>${parts.join('<span>·</span>')}<span class="keys">← → 翻页 · 贴纸可拖动</span>`;
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
      const k = P.THEMES.findIndex(t => t.id === state.theme);
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
      return `<button class="chip chip-pal" ${data} style="${pos}" aria-label="配色：${p.name}"><span class="dots">${[p.bg, p.a1, p.a2, p.a3].map(x => `<i style="background:${x}"></i>`).join('')}</span>${p.name}</button>`;
    }
    if (c.kind === 'bg') {
      const b = bgOf(c.id);
      return `<button class="chip chip-bg" ${data} style="${pos}" aria-label="背景：${b.name}"><span class="sf"><span class="slide" style="${P.vars(BRANDC)}"><span class="bgp bgp-${b.id}"></span></span></span>${b.name}</button>`;
    }
    const s = stickerOf(c.id);
    return `<button class="chip chip-stk" ${data} style="${pos}color:${STK_COLORS[k % STK_COLORS.length]}" aria-label="贴纸：${s.name}">${P.stickerSVG(s)}</button>`;
  }

  function renderChips() {
    $('#chipsL').innerHTML =
      `<div class="chip-hint" id="chipHint">拖到幻灯片上<svg viewBox="0 0 44 30" aria-hidden="true"><path d="M2 6C14 2 30 4 38 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M30 20l8 4 2-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>` +
      CHIPS.L.map((c, k) => chipHTML(c, k, 'L')).join('');
    $('#chipsR').innerHTML = CHIPS.R.map((c, k) => chipHTML(c, k, 'R')).join('');
    $('#chipsM').innerHTML = `<span class="chips-m-label">试试 →</span>` + CHIPS.L.concat(CHIPS.R).map((c, k) => chipHTML(c, k)).join('');
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
    const steps = [`读取 ${deck.slides.length} 页内容`, '识别标题、要点和关键数字', `套用「${th.name}」风格${o.palette ? ' · ' + esc(o.palette.name) : ''}`, '排版、留白、加点小装饰'];
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
    Object.assign(state, { deck, source, cur: 0, stickers: {}, theme: o.theme, palette: o.palette || null, bg: o.bg || 'none' });
    state.deckV++;
    update({ fx: { type: 'reveal' }, deal: true });
    const lc = lockedCount();
    toast(lc ? `生成好了：共 ${total()} 页，前 ${P.FREE_PAGES} 页免费看` : `生成好了：共 ${total()} 页`);
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/\.pptx$/i.test(file.name)) {
      toast(/\.(ppt|key|pdf)$/i.test(file.name) ? '目前先支持 .pptx，可以在 PowerPoint / Keynote 里另存为 .pptx 再拖进来' : '这不是 .pptx 文件，换一个试试？');
      return;
    }
    let deck;
    try {
      deck = await P.parsePptx(file);
    } catch (err) {
      console.warn('[play] could not read pptx', err);
      toast('这个文件没读懂（可能加密或损坏），换一个试试？');
      return;
    }
    if (!deck.slides.length) { toast('没在这个 PPT 里找到文字，换一个试试？'); return; }
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
  const tplColors = t => (t.palette ? paletteOf(t.palette) : themeOf(t.theme).colors);
  const tplSlide = (t, i) => P.slideHTML(t.deck.slides[i], i, t.deck.slides.length, { theme: t.theme, colors: tplColors(t), bg: t.bg || 'none' });

  function useTemplate(t, over) {
    over = over || {};
    generate(clone(t.deck), 'template', {
      theme: over.theme || t.theme,
      palette: 'palette' in over ? over.palette : t.palette ? paletteOf(t.palette) : null,
      bg: over.bg || t.bg || 'none',
    });
  }

  function renderTemplates() {
    const grid = $('#tplGrid');
    grid.innerHTML = P.TEMPLATES.map(t =>
      `<button class="tpl" data-t="${t.id}" aria-label="用模板「${t.name}」开始"><div class="tpl-pv">${tplSlide(t, 0)}</div>` +
      `<div class="tpl-meta"><b>${t.name}</b><span>${t.deck.slides.length} 页 · ${themeOf(t.theme).name}</span></div><span class="tpl-go">用这个开始 →</span></button>`).join('');
    $$('.tpl', grid).forEach(btn => {
      const t = tplOf(btn.dataset.t);
      const pv = $('.tpl-pv', btn);
      let k = 0;
      let timer = 0;
      const flip = () => { k = (k + 1) % t.deck.slides.length; pv.innerHTML = tplSlide(t, k); };
      btn.addEventListener('pointerenter', e => {
        if (reduceMotion || e.pointerType !== 'mouse') return;
        clearInterval(timer);
        flip();
        timer = setInterval(flip, 850);
      });
      btn.addEventListener('pointerleave', () => { clearInterval(timer); if (k) { k = 0; pv.innerHTML = tplSlide(t, 0); } });
      btn.addEventListener('click', () => { clearInterval(timer); useTemplate(t); });
    });
  }

  /* ---------------- asset library ---------------- */
  const TABS = [['theme', '风格'], ['palette', '配色'], ['bg', '背景'], ['sticker', '贴纸']];
  const tasted = (kind, id) => state.taste.some(t => t.kind === kind && t.id === id);
  const nameOf = (kind, id) => (kind === 'theme' ? themeOf(id).name : kind === 'palette' ? (paletteOf(id) || {}).name : kind === 'bg' ? bgOf(id).name : stickerOf(id).name);
  let libOn = false;
  let libDirty = true;
  let libSig = '';

  function renderTabs() {
    const n = { theme: P.THEMES.length, palette: P.PALETTES.length + state.extra.length, bg: P.BGS.length, sticker: P.STICKERS.length };
    $('#libTabs').innerHTML = TABS.map(([id, name]) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${state.tab === id}">${name}<small>${n[id]}</small></button>`).join('');
  }

  function libSignature() {
    const c = JSON.stringify(colors());
    return state.tab + '|' + { theme: state.deckV, palette: state.deckV + state.theme + state.extra.length, bg: c, sticker: c }[state.tab];
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
      `<button class="lc-main" aria-label="应用${esc(name)}"><div class="lc-pv">${pv}</div><div class="lc-foot"><b>${esc(name)}</b><span>${esc(sub || '')}</span></div></button>` +
      `<button class="heart" aria-pressed="false" aria-label="把${esc(name)}收进我的口味">${ICON.heart}</button></article>`;
    let html = '';
    if (state.tab === 'theme') {
      html = P.THEMES.map(t => card('theme', t.id, P.slideHTML(cover, 0, n, { theme: t.id, colors: t.colors, bg: 'none' }), t.name, t.en)).join('');
    } else if (state.tab === 'palette') {
      let k = 0;
      html = state.extra.concat(P.PALETTES).map(p =>
        card('palette', p.id,
          P.slideHTML(cover, 0, n, { theme: state.theme, colors: p, bg: 'none' }) +
          `<div class="pal-strip">${['bg', 'fg', 'a1', 'a2', 'a3'].map(x => `<i style="background:${p[x]}"></i>`).join('')}</div>`,
          p.name, p.ai ? '' : 'Play 配色', p.ai ? { badge: 'AI 扩展', k: k++ } : null)).join('');
    } else if (state.tab === 'bg') {
      html = P.BGS.map(b => card('bg', b.id, `<div class="sf"><div class="slide" style="${P.vars(colors())}"><div class="bgp bgp-${b.id}"></div></div></div>`, b.name, '')).join('');
    } else {
      html = P.STICKERS.map((s, k) => card('sticker', s.id, `<div class="stk-tile" style="${P.vars(colors())};color:var(--${['a1', 'a2', 'a3'][k % 3]})">${P.stickerSVG(s)}</div>`, s.name, '')).join('');
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
    $('#libCap').innerHTML = h
      ? `预览中：<b>${esc(nameOf(h.kind, h.id))}</b> —— 点击应用到舞台`
      : `舞台上：<b>${themeOf(state.theme).name}</b>${state.palette ? ' · <b>' + esc(state.palette.name) + '</b>' : ''}${state.bg !== 'none' ? ' · <b>' + bgOf(state.bg).name + '</b>' : ''} · 第 ${i + 1} 页`;
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
    else { addSticker(id); toast(`贴到了舞台第 ${state.cur + 1} 页，回到上面可以拖动它`); }
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
    const k = state.taste.findIndex(t => t.kind === kind && t.id === id);
    if (k >= 0) state.taste.splice(k, 1);
    else {
      state.taste.push({ kind, id });
      if (state.taste.length > 8) state.taste.shift();
    }
    renderTaste();
    markLib();
  }

  function tasteThumb(t) {
    if (t.kind === 'theme') { const c = themeOf(t.id).colors; return `<span class="ti-name" style="background:${c.bg};color:${c.a1}">${themeOf(t.id).name.slice(0, 1)}</span>`; }
    if (t.kind === 'palette') { const p = paletteOf(t.id); return `<span class="ti-dots">${[p.bg, p.a1, p.a2, p.a3].map(x => `<i style="background:${x}"></i>`).join('')}</span>`; }
    if (t.kind === 'bg') return `<span class="sf"><span class="slide" style="${P.vars(colors())}"><span class="bgp bgp-${t.id}"></span></span></span>`;
    return `<span style="${P.vars(BRANDC)};display:block;width:100%;height:100%;color:#FF4D1F">${P.stickerSVG(stickerOf(t.id))}</span>`;
  }

  function renderTaste() {
    const el = $('#taste');
    el.classList.toggle('show', state.taste.length > 0);
    $('#tasteCount').textContent = state.taste.length;
    $('#tasteItems').innerHTML = state.taste.map((t, k) => `<button class="ti" data-k="${k}" title="移除：${esc(nameOf(t.kind, t.id))}" aria-label="从口味里移除${esc(nameOf(t.kind, t.id))}">${tasteThumb(t)}</button>`).join('');
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

  function blend(ps) {
    const [p, q] = ps.slice(-2);
    const a1 = contrast(q.a1, p.bg) >= 2.2 ? q.a1 : p.a1;
    return { id: `mix-${p.id}-${q.id}`, name: `${p.name} × ${q.name}`, bg: p.bg, fg: p.fg, a1, a2: a1 === q.a1 ? p.a1 : q.a1, a3: q.a2 };
  }

  let aiSeq = 0;
  function variant(p, tag, dh) {
    const acc = tag === '撞色'
      ? { a1: shiftHue(p.a1, 180), a2: p.a1, a3: shiftHue(p.a3, 150) }
      : { a1: shiftHue(p.a1, dh), a2: shiftHue(p.a2, dh), a3: shiftHue(p.a3, dh) };
    return { id: 'ai' + ++aiSeq, name: `${p.name.split('·')[0]}·${tag}`, bg: tag === '撞色' ? p.bg : shiftHue(p.bg, dh / 2), fg: p.fg, ...acc, ai: true };
  }

  function applyTaste() {
    const of = kind => state.taste.filter(t => t.kind === kind).map(t => t.id);
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
      toast(`按你挑的 ${state.taste.length} 样东西，拼出了一套新风格${state.palette ? '「' + state.palette.name + '」' : ''}`);
    }, reduceMotion ? 0 : 450);
  }

  function extendPalettes() {
    const mine = state.taste.filter(t => t.kind === 'palette').map(t => paletteOf(t.id)).filter(Boolean);
    const src = mine[mine.length - 1] || { ...colors(), name: themeOf(state.theme).name };
    const out = [['暖调', 24], ['冷调', -40], ['撞色', 180]].map(([tag, dh]) => variant(src, tag, dh));
    state.extra.unshift(...out);
    out.forEach(p => state.fresh.add(p.id));
    state.tab = 'palette';
    $('#library').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    renderLib(true);
    toast(`照着「${src.name}」扩展了 3 套新配色，就在配色列表最前面`);
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
        const t = tplOf(tid);
        const c = pal ? paletteOf(pal) : themeOf(theme).colors;
        const tag = themeOf(theme).name + (pal ? ' × ' + paletteOf(pal).name : '');
        return `<button class="g-item" data-g="${tid}|${theme}|${pal || ''}|${bg}" aria-label="用「${t.name}」· ${tag} 开始">` +
          P.slideHTML(t.deck.slides[si], si, t.deck.slides.length, { theme, colors: c, bg }) +
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
    $('#unlockTitle').innerHTML = lc ? `还有 <em>${lc}</em> 页等你看` : state.registered ? '你已经注册啦 🎉' : '注册 Play，免费';
    $('#unlockText').textContent = lc
      ? '免费注册就能看完整结果、导出 PPTX / PDF，还会记住你的口味，下次接着玩。'
      : state.registered ? '完整页面和导出都已解锁。去摇一摇，再做一份吧。' : '注册后可以看完整结果、导出 PPTX / PDF，并保存你的口味和作品。';
    $('#unlockModal .modal-actions').hidden = state.registered;
    openModal('unlockModal');
  }

  $$('[data-register]').forEach(b => b.addEventListener('click', () => {
    const had = lockedCount();
    state.registered = true;
    closeModals();
    update();
    confetti();
    toast(had ? `解锁成功！全部 ${total()} 页都能看了（原型模拟）` : '注册成功（原型模拟）');
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
      `<div class="sc-sub">一份内容，${P.THEMES.length} 种风格。我最爱「${th.name}」。</div>` +
      `<div class="sc-foot"><span>你也来玩一下 →</span><span>免费试玩</span></div>`;
    const draw = (theme, c, bg) => {
      $('#scFan').innerHTML = idx.map(i => P.slideHTML(state.deck.slides[i], i, total(), { theme, colors: c, bg, stickers: state.stickers[i] || [] })).join('');
      fanOut($('#scFan'), 22, true);
    };
    draw(state.theme, colors(), state.bg);
    let k = P.THEMES.findIndex(t => t.id === state.theme);
    clearInterval(shareTimer);
    if (!reduceMotion) {
      shareTimer = setInterval(() => {
        k = (k + 1) % P.THEMES.length;
        const t = P.THEMES[k];
        draw(t.id, t.colors, 'none');
        $('#scLive').textContent = `自动换装 · ${t.name}`;
      }, 1500);
    }
    openModal('shareModal');
  }
  $('#shareBtn').addEventListener('click', openShare);
  $('#shareBtn2').addEventListener('click', openShare);
  $('#copyShare').addEventListener('click', async () => {
    const text = `我用 Play 把「${state.deck.title}」换了 ${P.THEMES.length} 种风格，最后选了「${themeOf(state.theme).name}」。你也来 Play 玩一下。`;
    try {
      await navigator.clipboard.writeText(text);
      toast('文案已复制，去分享吧');
    } catch (err) {
      toast('浏览器没让复制，手动复制一下：' + text);
    }
  });
  $('#exportBtn').addEventListener('click', () => {
    if (!state.registered) { openUnlock(); return; }
    toast('导出 PPTX 还没接后端（原型），先做张分享卡吧');
  });

  /* ---------------- misc controls ---------------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action],[data-open],[data-close],[data-clear]');
    if (!t) return;
    if (t.dataset.action === 'upload') { e.preventDefault(); fileInput.click(); }
    if (t.dataset.open === 'unlock') { e.preventDefault(); openUnlock(); }
    if ('close' in t.dataset) closeModals();
    if (t.dataset.clear === 'palette') setPalette(null);
    if (t.dataset.clear === 'bg') setBg('none');
    if (t.dataset.clear === 'stickers') { delete state.stickers[state.cur]; update(); }
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
    state.theme = pick(P.THEMES.filter(t => t.id !== state.theme)).id;
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
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
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
  function renderStatic() {
    const words = ['上传 PPT', '点选风格', '拖拽配色', '贴个贴纸', '前 3 页免费', '摇一摇', '一键分享卡', '口味越用越懂你'];
    const run = words.map(w => `<span>${w}</span><i>✺</i>`).join('');
    $('#ticker').innerHTML = run.repeat(4);

    $('#artSwatch').innerHTML = P.PALETTES.slice(0, 10).map(p => `<i style="background:${p.a1}" title="${p.name}"></i>`).join('');
    const mem = themeOf('memphis');
    $('#artPages').innerHTML = P.DEMO.slides.slice(0, 6).map((s, i) => P.slideHTML(s, i, P.DEMO.slides.length, { theme: 'memphis', colors: mem.colors, bg: 'none', locked: i >= P.FREE_PAGES, lockHTML: '' })).join('');

    $('#tokens').innerHTML = P.BRAND.map(b => `<button class="token" data-hex="${b.hex}" aria-label="复制 ${b.name} ${b.hex}"><i style="background:${b.hex}"></i><span>${b.name} ${b.en}<small>${b.hex}</small></span></button>`).join('');
    $('#tokens').addEventListener('click', async e => {
      const b = e.target.closest('.token');
      if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.hex); toast(`已复制 ${b.dataset.hex}`); } catch (err) { toast(b.dataset.hex); }
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

  /* ---------------- boot ---------------- */
  renderChips();
  renderTemplates();
  renderGallery();
  renderStatic();
  renderTabs();
  renderTaste();
  update();
  startAutoplay();

  // handle for debugging / tests in the console
  P.app = { state, update, generate, handleFile, useTemplate };
})(window.PLAY);
