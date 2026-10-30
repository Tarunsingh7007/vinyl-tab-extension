(() => {
  const $ = s => document.querySelector(s);
  const I = {
    film: '<rect x="2" y="2" width="20" height="20" rx="2.2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    game: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5z"/>',
    play: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    trend: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'
  };
  const svg = k => `<svg class="dk-ico" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  $('#dkAdd').innerHTML = svg('plus');
  $('#dkEdit').insertAdjacentHTML('afterbegin', svg('edit'));
  $('#dkRemove').insertAdjacentHTML('afterbegin', svg('trash'));

  const DEFAULTS = {
    entertainment: [
      { id: 'e1', icon: 'film', name: 'Movies', url: 'https://netflix.com' },
      { id: 'e2', icon: 'headphones', name: 'Music', url: 'https://music.youtube.com' },
      { id: 'e3', icon: 'game', name: 'Games', url: 'https://twitch.tv' },
      { id: 'e4', icon: 'play', name: 'Videos', url: 'https://youtube.com' },
      { id: 'e5', icon: 'music', name: 'Audio', url: 'https://soundcloud.com' }
    ],
    productivity: [
      { id: 'p1', icon: 'check', name: 'Tasks', url: 'https://todoist.com' },
      { id: 'p2', icon: 'calendar', name: 'Calendar', url: 'https://calendar.google.com' },
      { id: 'p3', icon: 'trend', name: 'Analytics', url: 'https://analytics.google.com' },
      { id: 'p4', icon: 'folder', name: 'Files', url: 'https://drive.google.com' },
      { id: 'p5', icon: 'pen', name: 'Design', url: 'https://figma.com' }
    ]
  };

  let sets;
  try { sets = JSON.parse(localStorage.getItem('vt.dock')); } catch (e) {}
  if (!sets || !Array.isArray(sets.entertainment) || !Array.isArray(sets.productivity)) sets = structuredClone(DEFAULTS);
  let mode = localStorage.getItem('vt.dockMode') === 'productivity' ? 'productivity' : 'entertainment';
  let target = null, editing = false, busy = false;
  const save = () => localStorage.setItem('vt.dock', JSON.stringify(sets));

  const wrap = $('#dkIcons'), modeBtn = $('#dkMode');
  const domain = u => { try { return new URL(u).hostname; } catch (e) { return u.replace(/^https?:\/\//, '').split('/')[0]; } };
  const label = () => modeBtn.setAttribute('aria-label', 'Switch shortcut set (' + mode + ')');

  function node(it) {
    const a = document.createElement('a');
    a.className = 'dk-item'; a.dataset.id = it.id; a.dataset.name = it.name; a.href = it.url; a.rel = 'noopener noreferrer';
    if (it.icon && I[it.icon]) a.innerHTML = svg(it.icon);
    else {
      const img = new Image(); img.alt = '';
      img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain(it.url))}&sz=64`;
      img.onerror = () => { const v = document.createElement('div'); v.className = 'dk-avatar'; v.textContent = (it.name || '?')[0]; a.replaceChildren(v); };
      a.append(img);
    }
    a.addEventListener('animationend', () => { a.classList.remove('in'); a.style.animationDelay = ''; });
    a.addEventListener('contextmenu', e => { e.preventDefault(); hideTip(); showMenu(e.clientX, e.clientY, it.id); });
    return a;
  }
  function render(enter) {
    wrap.replaceChildren();
    const items = sets[mode];
    if (!items.length) { const s = document.createElement('span'); s.className = 'dk-empty'; s.textContent = 'No shortcuts yet'; wrap.append(s); return; }
    items.forEach((it, i) => { const n = node(it); if (enter) { n.classList.add('in'); n.style.animationDelay = i * 40 + 'ms'; } wrap.append(n); });
  }
  render(false); label();

  modeBtn.addEventListener('click', () => {
    if (busy) return; busy = true; hideTip();
    modeBtn.classList.add('swapped');
    mode = mode === 'entertainment' ? 'productivity' : 'entertainment';
    localStorage.setItem('vt.dockMode', mode); label();
    wrap.querySelectorAll('.dk-item').forEach((n, i) => { n.style.animationDelay = i * 35 + 'ms'; n.classList.add('out'); });
    setTimeout(() => render(true), 300);
    setTimeout(() => { modeBtn.classList.remove('swapped'); setTimeout(() => busy = false, 600); }, 450);
  });

  /* tooltip */
  const tip = $('#dkTip');
  function hideTip() { tip.classList.remove('on'); }
  wrap.addEventListener('mouseover', e => {
    const a = e.target.closest('.dk-item'); if (!a) return;
    const r = a.getBoundingClientRect();
    tip.textContent = a.dataset.name; tip.style.left = r.left + r.width / 2 + 'px'; tip.style.top = r.top - 6 + 'px'; tip.classList.add('on');
  });
  wrap.addEventListener('mouseout', e => { if (e.target.closest('.dk-item')) hideTip(); });
  wrap.addEventListener('click', hideTip);

  /* context menu */
  const menu = $('#dkMenu');
  function showMenu(x, y, id) { target = id; menu.classList.add('on'); menu.style.left = Math.min(x, innerWidth - menu.offsetWidth - 8) + 'px'; menu.style.top = Math.min(y, innerHeight - menu.offsetHeight - 8) + 'px'; }
  const hideMenu = () => menu.classList.remove('on');
  document.addEventListener('click', hideMenu);
  addEventListener('blur', hideMenu);

  $('#dkRemove').onclick = () => {
    const id = target, n = wrap.querySelector(`[data-id="${CSS.escape(id)}"]`); if (!n) return;
    n.classList.add('gone');
    setTimeout(() => { sets[mode] = sets[mode].filter(i => i.id !== id); save(); render(false); }, 220);
  };
  $('#dkEdit').onclick = () => {
    const it = sets[mode].find(i => i.id === target); if (!it) return;
    editing = true; $('#dkTitle').textContent = 'Update shortcut'; $('#dkName').value = it.name; $('#dkUrl').value = it.url; openModal();
  };

  /* add / update dialog */
  const ov = $('#dkOverlay'), form = $('#dkForm');
  function openModal() { ov.classList.add('on'); setTimeout(() => $('#dkName').focus(), 50); }
  function closeModal() { ov.classList.remove('on'); form.reset(); }
  $('#dkAdd').onclick = () => { editing = false; target = null; form.reset(); $('#dkTitle').textContent = 'Add shortcut'; openModal(); };
  $('#dkCancel').onclick = closeModal;
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); hideMenu(); } });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#dkName').value.trim(); let url = $('#dkUrl').value.trim();
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (editing && target) {
      const it = sets[mode].find(i => i.id === target);
      if (it) { it.name = name; if (it.url !== url) { it.url = url; delete it.icon; } }
    } else sets[mode].push({ id: 'c' + Date.now(), name, url });
    save(); render(false); closeModal();
  });
})();
