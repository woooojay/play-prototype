/* Play — slide renderer.
   A slide is plain HTML sized in container units (cqw), so one renderer
   serves the 120px filmstrip, the library cards and the full stage. */
(function (P) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
  // Visual length: a CJK glyph is about twice as wide as a Latin one.
  const vlen = s => [...String(s || '')].reduce((n, ch) => n + (CJK.test(ch) ? 1 : 0.56), 0);
  const pad = n => String(n).padStart(2, '0');
  const size = (s, a, b, c) => {
    const v = vlen(s);
    return v <= a ? 'xl' : v <= b ? 'l' : v <= c ? 'm' : 's';
  };
  const vars = c => `--bg:${c.bg};--fg:${c.fg};--a1:${c.a1};--a2:${c.a2};--a3:${c.a3}`;
  const D = (cls, st, inner = '') => `<i class="d ${cls}" style="${st}">${inner}</i>`;
  const kick = (s, i) => `<div class="kicker">${pad(i + 1)}${s.kicker ? ' — ' + esc(s.kicker) : ''}</div>`;

  const SVG = {
    squig: '<svg viewBox="0 0 120 30" preserveAspectRatio="none"><path d="M3 15Q13 3 23 15T43 15T63 15T83 15T103 15T117 12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
    zig: '<svg viewBox="0 0 120 30" preserveAspectRatio="none"><polyline points="3,26 15,4 27,26 39,4 51,26 63,4 75,26 87,4 99,26 111,4 117,14" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    enso: '<svg viewBox="0 0 200 200"><path d="M150 40A78 78 0 1 0 175 120" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" filter="url(#ink-rough)"/><path d="M144 36A82 82 0 1 0 171 128" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity=".45" filter="url(#ink-rough)"/></svg>',
    hills: '<svg viewBox="0 0 400 100" preserveAspectRatio="none"><path d="M0 100V72Q40 38 84 62T168 48Q206 18 246 54T330 42Q368 26 400 58V100Z" fill="currentColor"/></svg>',
    sparkle: '<svg viewBox="0 0 100 100"><path d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z" fill="currentColor"/></svg>',
  };

  // Per-style decoration. `i` varies the arrangement so consecutive pages differ.
  const DECOR = {
    bauhaus(l, i) {
      if (l === 'cover')
        return (
          D('circ', 'left:58%;top:-20%;width:46cqw;height:46cqw;background:var(--a1)') +
          D('', 'left:76%;bottom:0;width:26cqw;height:13cqw;border-radius:13cqw 13cqw 0 0;background:var(--a2)') +
          D('', 'left:7cqw;top:10.5cqw;width:13cqw;height:1.4cqw;background:var(--a3)') +
          D('circ', 'left:91%;top:9%;width:4.4cqw;height:4.4cqw;background:var(--fg)')
        );
      return [
        D('', 'right:0;top:0;width:24cqw;height:24cqw;border-radius:0 0 0 100%;background:var(--a2)') +
          D('circ', 'right:8%;bottom:11%;width:11cqw;height:11cqw;background:var(--a3)') +
          D('', 'right:24%;bottom:11%;width:1.6cqw;height:11cqw;background:var(--a1)'),
        D('', 'right:0;top:20%;width:15cqw;height:30cqw;border-radius:30cqw 0 0 30cqw;background:var(--a1)') +
          D('', 'right:19%;bottom:9%;width:8cqw;height:8cqw;background:var(--a2)') +
          D('circ', 'right:4%;top:6%;width:5cqw;height:5cqw;background:var(--a3)'),
        D('', 'right:5%;bottom:0;width:24cqw;height:21cqw;clip-path:polygon(50% 0,100% 100%,0 100%);background:var(--a3)') +
          D('', 'right:5%;top:11%;width:17cqw;height:2.4cqw;background:var(--a1)') +
          D('circ', 'right:15%;top:22%;width:9cqw;height:9cqw;border:1.4cqw solid var(--a2)'),
      ][i % 3];
    },
    swiss(l, i, n) {
      return (
        D('sw-grid', '') +
        D('', 'left:7cqw;top:6.5cqw;width:2.4cqw;height:2.4cqw;background:var(--a1)') +
        D('sw-num', '', pad(i + 1)) +
        D('sw-foot', '', `<span>Play Studio</span><span>${pad(i + 1)} / ${pad(n)}</span>`)
      );
    },
    memphis(l, i) {
      return [
        D('', 'right:5%;top:9%;width:22cqw;height:6cqw;color:var(--a2)', SVG.squig) +
          D('', 'right:9%;bottom:10%;width:13cqw;height:11cqw;clip-path:polygon(50% 0,100% 100%,0 100%);background:var(--a3);rotate:12deg') +
          D('me-dots', 'right:26%;bottom:6%;width:14cqw;height:8cqw') +
          D('circ', 'right:3%;top:40%;width:8cqw;height:8cqw;border:1cqw solid var(--fg)') +
          D('', 'right:30%;top:5%;width:10cqw;height:3cqw;border-radius:2cqw;background:var(--a1);rotate:-18deg'),
        D('circ', 'right:-5%;top:-12%;width:26cqw;height:26cqw;background:var(--a1)') +
          D('me-dots', 'right:4%;top:6%;width:16cqw;height:12cqw;--dc:var(--fg)') +
          D('', 'right:6%;bottom:13%;width:20cqw;height:5cqw;color:var(--a2);rotate:-8deg', SVG.squig) +
          D('', 'right:28%;bottom:5%;width:12cqw;height:3.6cqw;color:var(--fg)', SVG.zig),
        D('', 'right:6%;top:12%;width:15cqw;height:13cqw;clip-path:polygon(0 0,100% 50%,0 100%);background:var(--a2);rotate:-14deg') +
          D('circ', 'right:22%;bottom:-9%;width:18cqw;height:18cqw;background:var(--a3)') +
          D('me-dots', 'right:5%;bottom:12%;width:12cqw;height:12cqw') +
          D('', 'right:24%;top:6%;width:14cqw;height:4cqw;color:var(--a1)', SVG.squig),
      ][i % 3];
    },
    editorial(l, i, n) {
      return (
        D('ed-head', '', `<span>Play Quarterly</span><span>№ ${pad(i + 1)}</span><span>MMXXVI</span>`) +
        D('ed-foot', '', `<span>${pad(i + 1)} / ${pad(n)}</span>`) +
        (l === 'bullets' || l === 'statement' ? D('ed-num', '', String(i + 1)) : '') +
        (l === 'cover' ? D('ed-ring', '') : '')
      );
    },
    neon(l) {
      const sun = l === 'cover' || l === 'end' ? 'left:57%;top:9%;width:32cqw;height:32cqw' : 'right:-5%;top:-14%;width:24cqw;height:24cqw;opacity:.7';
      return D('ne-sun', sun) + D('ne-floor', '') + D('ne-scan', '');
    },
    ink(l, i) {
      if (l === 'cover')
        return (
          D('ink-wash', 'left:48%;top:-12%;width:62cqw;height:62cqw') +
          D('ink-enso', 'left:56%;top:4%;width:38cqw;height:38cqw', SVG.enso) +
          D('ink-hills', '', SVG.hills) +
          D('ink-seal', 'right:7cqw;bottom:8cqw', '玩')
        );
      return [
        D('ink-enso', 'right:5%;top:12%;width:24cqw;height:24cqw;opacity:.45', SVG.enso) + D('ink-seal', 'right:7cqw;bottom:7cqw', '乐'),
        D('ink-hills', 'opacity:.7', SVG.hills) + D('ink-seal', 'right:7cqw;top:7cqw', '趣'),
        D('ink-wash', 'right:-10%;bottom:-30%;width:50cqw;height:50cqw') + D('ink-seal', 'right:7cqw;bottom:7cqw', '妙'),
      ][i % 3];
    },
    jelly(l, i) {
      const p = [
        ['left:56%;top:-18%;width:44cqw;height:44cqw', 'left:-8%;bottom:-30%;width:40cqw;height:40cqw', 'right:-6%;bottom:-10%;width:26cqw;height:26cqw'],
        ['right:-10%;top:-20%;width:40cqw;height:40cqw', 'left:30%;bottom:-36%;width:44cqw;height:44cqw', 'left:-6%;top:-14%;width:22cqw;height:22cqw'],
      ][i % 2];
      return (
        D('je-blob', p[0] + ';background:var(--a1)') +
        D('je-blob', p[1] + ';background:var(--a2)') +
        D('je-blob', p[2] + ';background:var(--a3)') +
        D('je-star', 'right:9%;top:14%;width:5cqw;height:5cqw', SVG.sparkle) +
        D('je-star', 'right:16%;top:27%;width:2.6cqw;height:2.6cqw', SVG.sparkle) +
        (l === 'cover' ? D('je-pill', 'right:7cqw;bottom:14cqw', '✦ PLAY') : '')
      );
    },
    brutal(l, i) {
      const en = P.lang === 'en';
      const tags = en ? ['NEW!', 'KEY!', 'HOT', 'LOOK', 'WOW'] : ['NEW!', '重点!', 'HOT', '看这里', 'WOW'];
      return (
        D('br-frame', '') +
        D('br-tag', `right:6cqw;top:6cqw;rotate:${i % 2 ? -7 : 8}deg`, tags[i % tags.length]) +
        D('br-bar', '', '<span>' + (en ? 'PLAY ✺ DESIGN IS PLAY ✺ ' : 'PLAY ✺ 设计可以玩 ✺ ').repeat(8) + '</span>') +
        (l === 'cover' || l === 'stat' ? D('br-code', 'right:6cqw;bottom:13cqw') : '')
      );
    },
  };

  const CONTENT = {
    cover: s =>
      `<div class="kicker">${esc(s.kicker)}</div><h1 class="title ${size(s.title, 6, 11, 20)}">${esc(s.title)}</h1>` +
      (s.sub ? `<p class="sub">${esc(s.sub)}</p>` : '') +
      `<div class="meta"><span>${esc(s.meta || '')}</span><span>Made with Play</span></div>`,
    statement: (s, i) =>
      kick(s, i) + `<h2 class="title ${size(s.title, 8, 14, 24)}">${esc(s.title)}</h2>` + (s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''),
    bullets: (s, i) => {
      const b = (s.bullets || []).slice(0, 6);
      const avg = b.reduce((n, x) => n + vlen(x), 0) / Math.max(b.length, 1);
      let cols = b.length === 4 ? 2 : Math.min(Math.max(b.length, 1), 3);
      if (avg > 22) cols = Math.min(cols, 2);
      if (avg > 44) cols = 1;
      return (
        kick(s, i) +
        `<h2 class="title ${size(s.title, 8, 14, 22)}">${esc(s.title)}</h2>` +
        `<ol class="list${avg > 26 ? ' long' : ''}" style="--cols:${cols}">${b.map((x, k) => `<li><b>${pad(k + 1)}</b><span>${esc(x)}</span></li>`).join('')}</ol>`
      );
    },
    stat: (s, i) =>
      kick(s, i) +
      `<p class="stat-t">${esc(s.title)}</p><div class="num ${size(s.stat, 3.5, 5.5, 8)}">${esc(s.stat)}</div>` +
      (s.statLabel ? `<p class="label">${esc(s.statLabel)}</p>` : ''),
    quote: s =>
      `<div class="qmark">“</div><blockquote class="${size(s.quote, 12, 20, 34)}">${esc(s.quote)}</blockquote>` +
      (s.author ? `<cite>— ${esc(s.author)}</cite>` : ''),
    end: s => `<h2 class="title ${size(s.title, 5, 10, 18)}">${esc(s.title)}</h2>` + (s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''),
  };

  P.stickerSVG = def => `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">${typeof def.svg === 'function' ? def.svg(P.lang) : def.svg}</svg>`;

  P.stickerHTML = (k, n, o) => {
    const def = P.STICKERS.find(s => s.id === k.id);
    if (!def) return '';
    let c = k.c || 'a1';
    if (o.colors[c] === o.colors.fg) c = c === 'a1' ? 'a3' : 'a1';
    return (
      `<div class="stk" data-k="${n}" style="left:${k.x}%;top:${k.y}%;--r:${k.r || 0}deg;--s:${k.s || 1};color:var(--${c})">` +
      P.stickerSVG(def) +
      (o.interactive ? '<button class="stk-x" aria-label="移除贴纸">×</button>' : '') +
      '</div>'
    );
  };

  // o: { theme, colors, bg, stickers, locked, lockHTML, interactive }
  P.slideHTML = function (s, i, total, o) {
    const layout = CONTENT[s.layout] ? s.layout : 'bullets';
    const cls = ['slide', 't-' + o.theme, 'l-' + layout];
    const title = s.title || '';
    if (title && [...title].every(ch => CJK.test(ch) || /\s/.test(ch)) && vlen(title) <= 5) cls.push('short-cjk');
    const decor = DECOR[o.theme] ? DECOR[o.theme](layout, i, total) : '';
    return (
      `<div class="sf${o.locked ? ' is-locked' : ''}"><div class="${cls.join(' ')}" style="${vars(o.colors)}">` +
      `<div class="bgp bgp-${o.bg || 'none'}"></div>` +
      `<div class="decor">${decor}</div>` +
      `<div class="content">${CONTENT[layout](s, i, total)}</div>` +
      `<div class="stks">${(o.stickers || []).map((k, n) => P.stickerHTML(k, n, o)).join('')}</div>` +
      `</div>${o.locked ? o.lockHTML || '' : ''}</div>`
    );
  };

  P.esc = esc;
  P.vars = vars;
})(window.PLAY);
