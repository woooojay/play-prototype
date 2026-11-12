/* Play — read a .pptx entirely in the browser (nothing is uploaded).
   A .pptx is a zip of XML; we read the central directory ourselves and
   inflate with the native DecompressionStream, so there is no dependency. */
(function (P) {
  async function readZip(buf) {
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    const dec = new TextDecoder();
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('not a zip file');
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const entries = {};
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const csize = dv.getUint32(off + 20, true);
      const nameLen = dv.getUint16(off + 28, true);
      const extraLen = dv.getUint16(off + 30, true);
      const commentLen = dv.getUint16(off + 32, true);
      const local = dv.getUint32(off + 42, true);
      entries[dec.decode(u8.subarray(off + 46, off + 46 + nameLen))] = { method, csize, local };
      off += 46 + nameLen + extraLen + commentLen;
    }
    return {
      names: Object.keys(entries),
      has: name => name in entries,
      async text(name) {
        const e = entries[name];
        if (!e) return null;
        const start = e.local + 30 + dv.getUint16(e.local + 26, true) + dv.getUint16(e.local + 28, true);
        const data = u8.subarray(start, start + e.csize);
        if (e.method === 0) return dec.decode(data);
        if (e.method !== 8) throw new Error('unsupported compression');
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        return new Response(stream).text();
      },
    };
  }

  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const byTag = (el, tag) => Array.from(el.getElementsByTagName(tag));
  const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const textOf = el => byTag(el, 'a:t').map(t => t.textContent).join('').replace(/\s+/g, ' ').trim();
  // A number worth blowing up: has a currency sign or a unit, not just a year.
  const STAT = /([¥$€£]\s?\d[\d,.]*\s?(?:万|亿|千|百万|k|K|M|B)?|\d[\d,.]*\s?(?:%|％|倍|万|亿|千|百万|x|X|k|K|M|B|\+|h|天|人|元|个|家|次|分钟|秒|小时|步|页))/;

  function readSlide(doc) {
    const out = { title: '', sub: '', body: [], rows: [] };
    for (const sp of byTag(doc, 'p:sp')) {
      const ph = sp.getElementsByTagName('p:ph')[0];
      const type = ph ? ph.getAttribute('type') || 'body' : 'free';
      if (['sldNum', 'dt', 'ftr', 'hdr'].includes(type)) continue;
      const paras = byTag(sp, 'a:p').map(textOf).filter(Boolean);
      if (!paras.length) continue;
      if ((type === 'title' || type === 'ctrTitle') && !out.title) out.title = paras.join(' ');
      else if (type === 'subTitle' && !out.sub) out.sub = paras.join(' ');
      else out.body.push(...paras);
    }
    for (const tr of byTag(doc, 'a:tr')) {
      const row = byTag(tr, 'a:tc').map(textOf).filter(Boolean).join(' · ');
      if (row) out.rows.push(row);
    }
    if (!out.title && out.body.length) out.title = out.body.shift();
    if (!out.title && out.rows.length) out.title = out.rows.shift();
    return out;
  }

  // Map raw text onto Play's layouts.
  function toSlide(raw, i, n) {
    const title = clip(raw.title || `第 ${i + 1} 页`, 40);
    const body = raw.body.filter(b => b !== raw.title).map(b => clip(b, 80));
    if (i === 0) return { layout: 'cover', kicker: '', title, sub: clip(raw.sub || body[0] || '', 70), meta: '' };
    if (i === n - 1 && /谢谢|感谢|thank|q\s*&\s*a|问答|结束|the end/i.test(title)) return { layout: 'end', title, sub: clip(raw.sub || body[0] || '', 60) };
    // a table keeps its rows as list items
    if (raw.rows.length) return { layout: 'bullets', title, bullets: body.concat(raw.rows).slice(0, 6).map(b => clip(b, 64)) };
    const items = raw.sub ? [raw.sub, ...body] : body;
    if (!items.length) return { layout: 'statement', title };
    const si = items.findIndex(t => t.length <= 28 && STAT.test(t));
    if (items.length <= 3 && si >= 0) {
      const t = items[si];
      const stat = t.match(STAT)[1].trim();
      const rest = t.replace(stat, ' ').replace(/(\s*[·:：,，、]\s*)+/g, ' · ').replace(/^[\s·\-—]+|[\s·\-—]+$/g, '');
      const others = items.filter((_, k) => k !== si);
      return { layout: 'stat', title, stat: clip(stat, 12), statLabel: clip([rest, ...others].filter(Boolean).join(' · '), 60) };
    }
    if (items.length === 1 && items[0].length > 24) return { layout: 'quote', quote: clip(items[0], 70), author: title };
    if (items.length === 1) return { layout: 'statement', title, sub: items[0] };
    return { layout: 'bullets', title, bullets: items.slice(0, 6).map(b => clip(b, 64)) };
  }

  P.parsePptx = async function (file) {
    const zip = await readZip(await file.arrayBuffer());
    const [pres, rels] = await Promise.all([zip.text('ppt/presentation.xml'), zip.text('ppt/_rels/presentation.xml.rels')]);
    let order = [];
    if (pres && rels) {
      const map = {};
      for (const r of byTag(xml(rels), 'Relationship')) map[r.getAttribute('Id')] = r.getAttribute('Target');
      for (const s of byTag(xml(pres), 'p:sldId')) {
        const t = map[s.getAttribute('r:id')];
        if (t) order.push(t.startsWith('/') ? t.slice(1) : 'ppt/' + t.replace(/^\.\//, ''));
      }
    }
    order = order.filter(zip.has);
    if (!order.length) {
      order = zip.names
        .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => +a.match(/(\d+)\.xml$/)[1] - +b.match(/(\d+)\.xml$/)[1]);
    }
    if (!order.length) throw new Error('no slides found');

    const raws = [];
    for (const name of order.slice(0, 40)) {
      const doc = xml(await zip.text(name));
      if (doc.documentElement.getAttribute('show') === '0') continue; // hidden slide
      const r = readSlide(doc);
      if (r.title || r.body.length) raws.push(r);
    }
    const slides = raws.slice(0, 30).map((r, i, a) => toSlide(r, i, a.length));
    const name = file.name.replace(/\.pptx$/i, '');
    if (slides[0]) {
      slides[0].kicker = name;
      slides[0].meta = `${slides.length} 页 · 由 Play 重新设计`;
    }
    return { title: (slides[0] && slides[0].title) || name, slides };
  };
})(window.PLAY);
