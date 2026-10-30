(() => {
  const el = document.getElementById('todo'), head = el.querySelector('.td-head'), list = el.querySelector('.td-list'), badge = el.querySelector('.td-badge');
  const KEY = 'vt.todo', N = 4;
  let items; try { items = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  items = Array.from({ length: N }, (_, i) => ({ t: String(items?.[i]?.t || '').slice(0, 80), d: !!items?.[i]?.d }));
  const save = () => localStorage.setItem(KEY, JSON.stringify(items));
  const CHECK = '<svg class="dk-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  el.querySelector('.td-chev').innerHTML = '<svg class="dk-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';

  function count() {
    const n = items.filter(i => i.t.trim() && !i.d).length;
    badge.textContent = n; badge.classList.toggle('on', n > 0);
  }
  const inputs = [];
  items.forEach((it, i) => {
    const li = document.createElement('li');
    const box = document.createElement('button'); box.type = 'button'; box.className = 'td-box'; box.innerHTML = CHECK; box.setAttribute('aria-label', 'Mark task ' + (i + 1) + ' done');
    const inp = document.createElement('input'); inp.className = 'td-line'; inp.type = 'text'; inp.maxLength = 80; inp.value = it.t; inp.setAttribute('aria-label', 'Task ' + (i + 1)); inp.autocomplete = 'off'; inp.spellcheck = false;
    const paint = () => { li.classList.toggle('done', it.d); box.setAttribute('aria-pressed', it.d); };
    box.onclick = () => { it.d = !it.d; paint(); save(); count(); };
    inp.oninput = () => { it.t = inp.value; save(); count(); };
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); (inputs[i + 1] || inp).focus(); if (!inputs[i + 1]) inp.blur(); } };
    inputs.push(inp); li.append(box, inp); list.append(li); paint();
  });
  count();

  head.onclick = () => {
    const open = el.classList.toggle('open');
    head.setAttribute('aria-expanded', open);
    if (open) setTimeout(() => (inputs.find(x => !x.value) || inputs[0]).focus({ preventScroll: true }), 320);
  };
})();
