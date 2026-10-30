(() => {
  const TTL = 6 * 3600e3;
  const ico = d => `<svg class="dk-ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  /* ---------- shared helpers ---------- */
  const pretty = s => { try { s = decodeURIComponent(s); } catch (e) {} return s.replace(/[-_+]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); };
  function parseBoard(input) {
    let u = input.trim();
    if (!u) throw new Error('Paste a board link first.');
    if (!/^https?:\/\//i.test(u)) u = u.includes('pinterest.') ? 'https://' + u : 'https://www.pinterest.com/' + u.replace(/^\/+/, '');
    let url; try { url = new URL(u); } catch (e) { throw new Error('That link doesn’t look right.'); }
    if (!/(^|\.)pinterest\.[a-z.]+$/i.test(url.hostname)) throw new Error('That doesn’t look like a Pinterest link.');
    const seg = url.pathname.split('/').filter(Boolean).map(s => s.replace(/\.rss$/i, ''));
    if (seg.length < 2 || ['pin', 'ideas', 'search', 'today', 'explore', '_saved', '_created'].includes(seg[0].toLowerCase()))
      throw new Error('Use a board link like pinterest.com/username/board-name');
    return { id: seg[0] + '/' + seg[1], user: seg[0], slug: seg[1], name: pretty(seg[1]) };
  }
  async function fetchItems(b) {
    const res = await fetch(`https://www.pinterest.com/${b.user}/${b.slug}.rss`, { credentials: 'omit' });
    if (!res.ok) throw new Error('Pinterest returned ' + res.status);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    if (xml.querySelector('parsererror')) throw new Error('Unreadable feed');
    const items = [...xml.querySelectorAll('item')].map(it => {
      const html = new DOMParser().parseFromString(it.querySelector('description')?.textContent || '', 'text/html');
      const s = html.querySelector('img')?.getAttribute('src');
      return s && { s, b: s.replace(/\/\d+x\//, '/736x/'), l: it.querySelector('link')?.textContent || '' };
    }).filter(Boolean);
    if (!items.length) throw new Error('No pins found');
    localStorage.setItem('vt.pinc.' + b.id, JSON.stringify({ t: Date.now(), items }));
    return items;
  }
  async function getItems(b) {
    let c = null; try { c = JSON.parse(localStorage.getItem('vt.pinc.' + b.id)); } catch (e) {}
    if (c && Date.now() - c.t < TTL) return c.items;
    try { return await fetchItems(b); } catch (e) { if (c) return c.items; throw e; }
  }
  const hourSlot = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 36e5);
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  /* ---------- one widget instance (each has its own boards + selection) ---------- */
  function mount(slot) {
    const KEY = slot.dataset.pin;
    slot.append(document.getElementById('pinTpl').content.cloneNode(true));
    const q = s => slot.querySelector(s);
    const pin = q('.pin'); pin.classList.add(slot.dataset.cls);
    const sel = q('.pn-board'), msg = q('.pn-msg'), link = q('.pn-link'), layers = [...slot.querySelectorAll('.pn-img')];
    const btnRef = q('.pn-ref'), btnAdd = q('.pn-add'), btnDel = q('.pn-del');
    let layer = 0, shownKey = '', slotShown = -1;

    let st; try { st = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!st || !Array.isArray(st.boards)) st = { boards: [], sel: '' };
    const save = () => localStorage.setItem(KEY, JSON.stringify(st));

    btnAdd.innerHTML = ico('<path d="M12 5v14M5 12h14"/>');
    btnRef.innerHTML = ico('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>');
    btnDel.innerHTML = ico('<path d="M6 6l12 12M18 6L6 18"/>');

    function say(t) { msg.textContent = t; msg.classList.add('on'); link.removeAttribute('href'); layers.forEach(l => l.classList.remove('on')); shownKey = ''; }
    function paint(it) {
      const tryLoad = (src, fallback) => {
        const im = new Image();
        im.onload = () => {
          const next = layers[1 - layer], prev = layers[layer];
          next.style.backgroundImage = `url("${src}")`; next.classList.add('on'); prev.classList.remove('on'); layer = 1 - layer;
          msg.classList.remove('on'); if (it.l) link.href = it.l; else link.removeAttribute('href');
        };
        im.onerror = () => fallback ? tryLoad(fallback) : say('Couldn’t load this image.');
        im.src = src;
      };
      tryLoad(it.b, it.s);
    }
    async function show() {
      const b = st.boards.find(x => x.id === st.sel);
      pin.classList.toggle('empty', !b);
      if (!b) { say('Add a Pinterest board to see its pins here.'); return; }
      const hs = hourSlot(), key = b.id + '|' + hs;
      if (key === shownKey) return;
      try {
        const items = await getItems(b);
        if (st.sel !== b.id) return;
        shownKey = key; slotShown = hs;
        paint(items[(hs + hash(b.id) + ((st.bump || {})[b.id] || 0)) % items.length]);
      } catch (e) { say('Couldn’t load this board. Make sure it’s public.'); }
    }
    function renderSelect() {
      sel.replaceChildren();
      if (!st.boards.length) { sel.add(new Option('No boards yet', '')); sel.disabled = true; }
      else { sel.disabled = false; st.boards.forEach(b => sel.add(new Option(b.name, b.id))); sel.value = st.sel; }
      btnDel.hidden = btnRef.hidden = !st.boards.length;
    }
    sel.onchange = () => { st.sel = sel.value; save(); shownKey = ''; show(); };
    btnRef.onclick = async () => {
      const b = st.boards.find(x => x.id === st.sel); if (!b || btnRef.classList.contains('spin')) return;
      btnRef.classList.add('spin');
      try { await fetchItems(b); } catch (e) {}
      st.bump = st.bump || {}; st.bump[b.id] = (st.bump[b.id] || 0) + 1; save();
      shownKey = ''; await show(); btnRef.classList.remove('spin');
    };
    btnDel.onclick = () => {
      const i = st.boards.findIndex(b => b.id === st.sel); if (i < 0) return;
      st.boards.splice(i, 1); st.sel = st.boards[0]?.id || ''; save(); renderSelect(); shownKey = ''; show();
    };

    const ov = q('.pn-overlay'), form = q('.pn-form'), err = q('.pn-err'), urlIn = q('.pn-url'), saveBtn = q('.pn-save');
    const close = () => { ov.classList.remove('on'); form.reset(); err.textContent = ''; };
    btnAdd.onclick = () => { err.textContent = ''; ov.classList.add('on'); setTimeout(() => urlIn.focus(), 50); };
    q('.pn-cancel').onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    form.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = '';
      let b; try { b = parseBoard(urlIn.value); } catch (x) { err.textContent = x.message; return; }
      saveBtn.disabled = true; saveBtn.textContent = 'Checking…';
      try {
        if (!st.boards.some(x => x.id === b.id)) { await fetchItems(b); st.boards.push(b); }
        st.sel = b.id; save(); renderSelect(); shownKey = ''; close(); show();
      } catch (x) { err.textContent = 'Couldn’t read that board. It needs to be public.'; }
      saveBtn.disabled = false; saveBtn.textContent = 'Add board';
    });

    renderSelect(); show();
    setInterval(() => { if (hourSlot() !== slotShown) show(); }, 30000);
  }
  document.querySelectorAll('.pin-slot').forEach(mount);
})();
