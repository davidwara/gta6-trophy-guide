// Leonida Trophy Guide — offline tracker for the 55 GTA VI PS5 trophies.
// State lives in localStorage only; the app fetches nothing but its own
// data/trophies.json file. No network, no cookies, no service worker.
const STORAGE_KEY = 'leonida-trophy-guide-v1';
const DEMO_EARNED_IDS = [2, 3, 8, 15, 16, 17, 21, 28, 35, 42, 52, 53];

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');
const searchEl = $('search');
const kindEl = $('filter-kind');
const gradeEl = $('filter-grade');
const spoilerEl = $('spoiler-toggle');
const importMsg = $('import-msg');

let DATA = null;
let earned = new Set();
let spoilersOn = true;
let openId = null;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned.filter((n) => typeof n === 'string'));
    if (typeof parsed.spoilers === 'boolean') spoilersOn = parsed.spoilers;
  } catch {
    earned = new Set();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ guide: 'Leonida Trophy Guide', version: 1, earned: [...earned], spoilers: spoilersOn }));
}

function trophyById(id) {
  return DATA.trophies.find((t) => t.id === id);
}

function isHiddenFromSpoilers(t) {
  return spoilersOn && t.kind === 'story' && !earned.has(t.name);
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function updateProgress() {
  const total = DATA.trophies.length;
  const count = earned.size;
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  $('progress-count').textContent = count + ' / ' + total + ' earned';
  $('progress-pct').textContent = pct + '%';
  $('progress-fill').style.width = pct + '%';
  const toward = Math.max(0, total - 1 - (count - (earned.has('Vice Got a Price!') ? 1 : 0)));
  $('progress-sub').textContent = earned.has('Vice Got a Price!')
    ? 'Platinum earned: Vice Got a Price! — Leonida Legend.'
    : 'Platinum progress: ' + (total - 1 - toward) + ' of 54 trophies toward Vice Got a Price!';
}

function renderRoadmap() {
  const ol = $('roadmap-list');
  ol.replaceChildren();
  for (const stage of DATA.roadmap) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + stage.stage + ' — ';
    h.append(num, document.createTextNode(stage.title));
    const order = document.createElement('p');
    order.textContent = stage.order;
    const names = document.createElement('p');
    names.className = 'names';
    names.textContent = 'Trophies: ' + stage.trophies.map((id) => trophyById(id).name).join(' · ');
    const advice = document.createElement('p');
    advice.textContent = stage.advice;
    li.append(h, order, names, advice);
    ol.append(li);
  }
}

function renderMissables() {
  const ul = $('missable-list');
  ul.replaceChildren();
  for (const t of DATA.trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = (earned.has(t.name) ? '✓ ' : '⚠ ') + t.name;
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = t.missableNote || 'Treat as missable until confirmed.';
    li.append(strong, when);
    ul.append(li);
  }
}

function matchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kindEl.value === 'missable') {
    if (!t.missable) return false;
  } else if (kindEl.value === 'online') {
    return false;
  } else if (kindEl.value !== 'all' && t.kind !== kindEl.value) {
    return false;
  }
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  return true;
}

function renderList() {
  listEl.replaceChildren();
  const shown = DATA.trophies.filter(matchesFilters);
  $('list-count').textContent = '(' + shown.length + ' of ' + DATA.trophies.length + ' shown)';
  $('empty-msg').hidden = shown.length !== 0;
  if (kindEl.value === 'online' && shown.length === 0) {
    $('empty-msg').textContent = 'There are no online trophies: every GTA VI trophy is single-player. Sources: planetgta6.com/en/gta-6-trophies/ and outputlag.com/guides/gta-6-trophy-list/.';
    $('empty-msg').hidden = false;
  } else {
    $('empty-msg').textContent = 'No trophies match these filters. Try clearing the search or a filter.';
  }
  for (const t of shown) {
    listEl.append(buildCard(t));
  }
  updateProgress();
}

function buildCard(t) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
  card.dataset.trophyId = String(t.id);
  const hidden = isHiddenFromSpoilers(t);

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    save();
    renderList();
    renderMissables();
  });
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';
  const h = document.createElement('h3');
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.textContent = hidden ? 'Hidden story trophy — earn it to reveal' : t.name;
  openBtn.addEventListener('click', () => {
    openId = openId === t.id ? null : t.id;
    renderList();
  });
  h.append(openBtn);
  const desc = document.createElement('p');
  desc.className = hidden ? 'card-desc spoiler' : 'card-desc';
  desc.textContent = hidden ? 'Hidden story trophy — earn it to reveal.' : t.description;
  titleWrap.append(h, desc);
  head.append(box, titleWrap);
  card.append(head);

  const tags = document.createElement('div');
  tags.className = 'tags';
  const gradeTag = document.createElement('span');
  gradeTag.className = 'tag ' + t.grade;
  gradeTag.textContent = gradeLabel(t);
  tags.append(gradeTag);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = t.kind;
  tags.append(kindTag);
  if (t.hidden) {
    const ht = document.createElement('span');
    ht.className = 'tag hidden-tag';
    ht.textContent = 'Hidden';
    tags.append(ht);
  }
  if (t.missable) {
    const mt = document.createElement('span');
    mt.className = 'tag missable';
    mt.textContent = 'Missable';
    tags.append(mt);
  }
  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = 'Stage ' + t.stage;
  tags.append(stageTag);
  card.append(tags);

  if (!hidden) {
    const short = document.createElement('p');
    short.className = 'guide-short';
    short.textContent = t.guide;
    card.append(short);
  }

  if (openId === t.id) {
    const detail = document.createElement('div');
    detail.className = 'detail';
    const h4 = document.createElement('h4');
    h4.textContent = 'Full guide';
    const guide = document.createElement('p');
    guide.textContent = hidden ? 'Hidden story trophy — earn it to reveal its guide.' : t.guide;
    detail.append(h4, guide);
    if (t.missableNote) {
      const miss = document.createElement('p');
      miss.textContent = 'When it can be missed: ' + t.missableNote;
      detail.append(miss);
    }
    if (!hidden) {
      const sh = document.createElement('h4');
      sh.textContent = 'Sources';
      const ul = document.createElement('ul');
      ul.className = 'sources';
      for (const s of t.sources) {
        const li = document.createElement('li');
        li.textContent = s;
        ul.append(li);
      }
      detail.append(sh, ul);
    }
    card.append(detail);
  }
  return card;
}

// ---- export / import -------------------------------------------------------

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportProgress() {
  downloadJson('leonida-trophy-progress.json', { guide: 'Leonida Trophy Guide', version: 1, earned: [...earned].sort() });
  importMsg.classList.remove('error');
  importMsg.textContent = 'Exported ' + earned.size + ' earned trophies to leonida-trophy-progress.json.';
}

function importProgressFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const names = parsed && Array.isArray(parsed.earned) ? parsed.earned : null;
      if (!names) throw new Error('not a progress file');
      const known = new Set(DATA.trophies.map((t) => t.name));
      const good = names.filter((n) => typeof n === 'string' && known.has(n));
      if (good.length === 0 && names.length > 0) throw new Error('no known trophy names in file');
      earned = new Set(good);
      save();
      renderList();
      renderMissables();
      importMsg.classList.remove('error');
      importMsg.textContent = 'Imported ' + good.length + ' earned trophies from ' + file.name + '.';
    } catch {
      importMsg.classList.add('error');
      importMsg.textContent = 'Import failed: that file is not a valid Leonida Trophy Guide progress file (it needs an "earned" list of trophy names).';
    }
  };
  reader.readAsText(file);
}

// ---- demo profile + deep links --------------------------------------------

function loadDemoProfile() {
  earned = new Set(DEMO_EARNED_IDS.map((id) => trophyById(id).name));
  save();
  renderList();
  renderMissables();
  importMsg.classList.remove('error');
  importMsg.textContent = 'Demo profile loaded: ' + earned.size + ' trophies marked earned (sample progress, stored like your own).';
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo') === '1') {
    earned = new Set(DEMO_EARNED_IDS.map((id) => trophyById(id).name));
    save();
  }
  const kind = params.get('kind');
  if (kind && [...kindEl.options].some((o) => o.value === kind)) kindEl.value = kind;
  const grade = params.get('grade');
  if (grade && [...gradeEl.options].some((o) => o.value === grade)) gradeEl.value = grade;
  const spoilers = params.get('spoilers');
  if (spoilers === 'off') spoilersOn = false;
  if (spoilers === 'on') spoilersOn = true;
  const shot = params.get('shot');
  if (shot === 'cover') {
    earned = new Set(DEMO_EARNED_IDS.map((id) => trophyById(id).name));
    save();
  } else if (shot === 'guide') {
    earned = new Set(DEMO_EARNED_IDS.map((id) => trophyById(id).name));
    save();
    openId = 28;
  } else if (shot === 'roadmap') {
    earned = new Set(DEMO_EARNED_IDS.map((id) => trophyById(id).name));
    save();
  } else if (shot === 'spoiler') {
    spoilersOn = true;
    earned = new Set([15, 16, 21]);
    save();
  }
  const trophy = params.get('trophy');
  if (trophy) {
    const byId = DATA.trophies.find((t) => String(t.id) === trophy);
    const byName = DATA.trophies.find((t) => t.name.toLowerCase() === trophy.toLowerCase());
    if (byId || byName) openId = (byId || byName).id;
  }
  spoilerEl.checked = spoilersOn;
}

// ---- wiring + boot ---------------------------------------------------------

searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', renderList);
gradeEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', () => {
  spoilersOn = spoilerEl.checked;
  save();
  renderList();
});
$('export-btn').addEventListener('click', exportProgress);
$('import-btn').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importProgressFile(file);
  e.target.value = '';
});
$('demo-btn').addEventListener('click', loadDemoProfile);

fetch('data/trophies.json')
  .then((r) => {
    if (!r.ok) throw new Error('trophies.json failed to load');
    return r.json();
  })
  .then((doc) => {
    DATA = doc;
    loadSaved();
    applyQueryParams();
    spoilerEl.checked = spoilersOn;
    renderRoadmap();
    renderMissables();
    renderList();
    // Deterministic screenshot framing: put the requested block in view,
    // synchronously right after render so headless capture sees it.
    const shot = new URLSearchParams(window.location.search).get('shot');
    if (shot === 'roadmap') {
      window.scrollTo(0, document.getElementById('roadmap').getBoundingClientRect().top + window.scrollY - 8);
    } else if (shot === 'guide' && openId !== null) {
      const card = document.querySelector('[data-trophy-id="' + openId + '"]');
      if (card) window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 8);
    } else if (shot === 'spoiler') {
      window.scrollTo(0, document.querySelector('.list-section').getBoundingClientRect().top + window.scrollY - 8);
    }
  })
  .catch(() => {
    listEl.replaceChildren();
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'The trophy data (data/trophies.json) could not be loaded. Serve the app folder with a static server and reload.';
    listEl.append(p);
  });
