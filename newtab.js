(() => {
  const $ = s => document.querySelector(s);
  const LS = (k, d) => { const v = localStorage.getItem('vt.' + k); return v === null ? d : v; };

  /* ---------- IndexedDB: images + tracks live here, on this device ---------- */
  const DB = new Promise((res, rej) => {
    const r = indexedDB.open('vinyltab', 1);
    r.onupgradeneeded = () => ['images', 'tracks'].forEach(n => r.result.createObjectStore(n, { keyPath: 'id', autoIncrement: true }));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const tx = async (store, mode, fn) => {
    const db = await DB;
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode), q = fn(t.objectStore(store));
      t.oncomplete = () => res(q && q.result);
      t.onerror = () => rej(t.error);
    });
  };
  const getAll = s => tx(s, 'readonly', o => o.getAll());
  const add = (s, v) => tx(s, 'readwrite', o => o.add(v));
  const del = (s, id) => tx(s, 'readwrite', o => o.delete(id));
  const clear = s => tx(s, 'readwrite', o => o.clear());

  /* ---------- clock ---------- */
  const h24 = $('#h24'); h24.checked = LS('h24', '0') === '1';
  function tick() {
    const d = new Date();
    $('#time').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !h24.checked }).replace(/\s?[AP]M/i, '');
    $('#date').textContent = d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  }
  tick(); setInterval(tick, 1000);
  h24.onchange = () => { localStorage.setItem('vt.h24', h24.checked ? '1' : '0'); tick(); };

  /* ---------- backgrounds ---------- */
  let images = [], bgIdx = -1, layer = 0, lastUrl = null, rotTimer = null;
  const layers = [$('#bgA'), $('#bgB')];

  function showBg(i) {
    if (!images.length) { layers.forEach((l, n) => { l.style.backgroundImage = ''; l.classList.toggle('on', n === 0); }); document.documentElement.style.setProperty('--art', 'none'); return; }
    bgIdx = (i + images.length) % images.length;
    localStorage.setItem('vt.bg', images[bgIdx].id);
    const url = URL.createObjectURL(images[bgIdx].blob);
    const img = new Image();
    img.onload = () => {
      const next = layers[1 - layer], prev = layers[layer];
      next.style.backgroundImage = `url("${url}")`;
      next.classList.add('on'); prev.classList.remove('on');
      document.documentElement.style.setProperty('--art', `url("${url}")`);
      layer = 1 - layer;
      const old = lastUrl; lastUrl = url;
      if (old) setTimeout(() => URL.revokeObjectURL(old), 1500);
    };
    img.src = url;
  }
  const nextBg = () => { if (images.length > 1) showBg(bgIdx + 1); };
  $('#shuffleBg').onclick = nextBg;

  function setRotation() {
    clearInterval(rotTimer);
    const s = +$('#rot').value;
    if (s) rotTimer = setInterval(nextBg, s * 1000);
  }
  $('#rot').value = LS('rot', '0'); setRotation();
  $('#rot').onchange = () => { localStorage.setItem('vt.rot', $('#rot').value); setRotation(); };

async function loadImages(first) {
  images = await getAll('images');
  $('#imgCount').textContent = images.length + (images.length === 1 ? ' image' : ' images');
  if (!images.length) { showBg(0); return; }

  if (first) {
    // Pick a random index on every new tab
    const randomIndex = Math.floor(Math.random() * images.length);
    showBg(randomIndex);
  } else if (bgIdx < 0 || bgIdx >= images.length) {
    showBg(0);
  }
}

  /* ---------- dim ---------- */
  const dim = $('#dim'); dim.value = LS('dim', '45');
  const applyDim = () => document.documentElement.style.setProperty('--dim', dim.value / 100);
  applyDim();
  dim.oninput = () => { applyDim(); localStorage.setItem('vt.dim', dim.value); };

  /* ---------- player ---------- */
  const audio = new Audio();
  let tracks = [], cur = -1, audioUrl = null;
  const player = $('#player'), seek = $('#seek'), vol = $('#vol');
  vol.value = LS('vol', '70'); audio.volume = vol.value / 100;
  vol.oninput = () => { audio.volume = vol.value / 100; localStorage.setItem('vt.vol', vol.value); };

  const PLAY = 'M8 5v14l11-7z', PAUSE = 'M6 5h4v14H6zm8 0h4v14h-4z';
  const parse = name => {
    const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
    const m = base.split(/\s+-\s+/);
    return m.length > 1 ? { artist: m[0], title: m.slice(1).join(' - ') } : { artist: 'Local file', title: base };
  };

  function setPlaying(on) {
    player.classList.toggle('playing', on);
    $('#playIcon').setAttribute('d', on ? PAUSE : PLAY);
    $('#play').setAttribute('aria-label', on ? 'Pause' : 'Play');
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = on ? 'playing' : 'paused';
  }

  function load(i, autoplay) {
    if (!tracks.length) { 
      cur = -1; 
      audio.removeAttribute('src'); 
      audio.load(); 
      $('#artist').textContent = 'Nothing yet'; 
      $('#title').textContent = 'Add some music'; 
      setPlaying(false); 
      renderList(); 
      return; 
    }
    cur = (i + tracks.length) % tracks.length;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    
    // Convert IndexedDB blob toObjectURL safely
    const trackBlob = tracks[cur].blob;
    audioUrl = URL.createObjectURL(trackBlob);
    audio.src = audioUrl;

    const t = parse(tracks[cur].name);
    $('#artist').textContent = t.artist; 
    $('#title').textContent = t.title;
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist });
    }
    
    renderList();
    if (autoplay) {
      audio.play().then(() => setPlaying(true)).catch(err => {
        console.warn('Autoplay blocked by browser policy:', err);
        setPlaying(false);
      });
    }
  }

  const toggle = () => {
    if (!tracks.length) { openSettings(); return; }
    if (cur < 0) load(0, true); else if (audio.paused) audio.play().then(() => setPlaying(true)); else audio.pause();
  };

  $('#play').onclick = toggle;
  $('#next').onclick = () => tracks.length && load(cur + 1, true);
  $('#prev').onclick = () => { if (!tracks.length) return; audio.currentTime > 3 ? (audio.currentTime = 0) : load(cur - 1, true); };
  audio.onplay = () => setPlaying(true);
  audio.onpause = () => setPlaying(false);
  audio.onended = () => load(cur + 1, true);
  audio.ontimeupdate = () => { if (audio.duration) seek.value = audio.currentTime / audio.duration * 1000; };
  seek.oninput = () => { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; };
  
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', toggle);
    navigator.mediaSession.setActionHandler('pause', toggle);
    navigator.mediaSession.setActionHandler('nexttrack', () => $('#next').click());
    navigator.mediaSession.setActionHandler('previoustrack', () => $('#prev').click());
  }

  const list = $('#list');
  $('#listBtn').onclick = () => { list.hidden = !list.hidden; $('#listBtn').classList.toggle('active', !list.hidden); };
  
  function renderList() {
    list.innerHTML = '';
    $('#trkCount').textContent = tracks.length + (tracks.length === 1 ? ' track' : ' tracks');
    if (!tracks.length) { list.innerHTML = '<li class="empty">Add songs in Settings to build a playlist.</li>'; return; }
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      if (i === cur) li.className = 'cur';
      const s = document.createElement('span'); s.textContent = t.name.replace(/\.[^.]+$/, '');
      const x = document.createElement('button'); x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + s.textContent);
      x.onclick = async e => { 
        e.stopPropagation(); 
        const wasCur = i === cur; 
        await del('tracks', t.id); 
        tracks = await getAll('tracks'); 
        if (wasCur) { 
          audio.pause(); 
          load(Math.min(i, tracks.length - 1), false); 
        } else { 
          cur = tracks.findIndex(k => k.id === (tracks[cur] || {}).id); 
          renderList(); 
        } 
      };
      li.onclick = () => load(i, true);
      li.append(s, x); 
      list.append(li);
    });
  }

  async function loadTracks() { 
    tracks = await getAll('tracks'); 
    renderList(); 
    if (tracks.length && cur < 0) { 
      const t = parse(tracks[0].name); 
      $('#artist').textContent = t.artist; 
      $('#title').textContent = t.title; 
    } 
  }

  /* ---------- settings ---------- */
  const dlg = $('#settings');
  function openSettings() { dlg.showModal(); }
  $('#gear').onclick = openSettings;
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  $('#imgInput').onchange = async e => {
    for (const f of e.target.files) await add('images', { name: f.name, blob: f });
    e.target.value = ''; await loadImages(false); if (images.length) showBg(images.length - 1);
  };
  $('#trkInput').onchange = async e => {
    for (const f of e.target.files) await add('tracks', { name: f.name, blob: f });
    e.target.value = ''; const wasEmpty = !tracks.length; await loadTracks(); if (wasEmpty && tracks.length) load(0, false);
  };
  $('#imgClear').onclick = async () => { await clear('images'); bgIdx = -1; await loadImages(false); showBg(0); };
  $('#trkClear').onclick = async () => { audio.pause(); await clear('tracks'); tracks = []; load(0, false); };

  loadImages(true); 
  loadTracks();
})();