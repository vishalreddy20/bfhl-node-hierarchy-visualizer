// ═══════════════════════════════════════════════════════════════════
// BFHL Node Hierarchy Visualizer — Frontend Logic
// ═══════════════════════════════════════════════════════════════════

// UPDATE THIS to your deployed backend URL before deploying frontend
const API_URL = 'https://bfhl-node-hierarchy-visualizer.onrender.com/bfhl';

// ─── DOM refs ───────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const inputEl    = $('data-input');
const submitBtn  = $('submit-btn');
const loaderEl   = $('loader');
const errorEl    = $('error');
const errorText  = $('error-text');
const resultsEl  = $('results');
const uinfoEl    = $('uinfo');
const summaryBar = $('summary-bar');
const hierGrid   = $('hier-grid');
const hierCount  = $('hier-count');
const invSec     = $('inv-sec');
const invCount   = $('inv-count');
const invList    = $('inv-list');
const dupSec     = $('dup-sec');
const dupCount   = $('dup-count');
const dupList    = $('dup-list');

// ─── Example loader ─────────────────────────────────────────────────
function loadExample() {
  inputEl.value = '["A->B", "A->C", "B->D", "C->E", "E->F", "hello", "G->H", "G->H", "G->I", "X->Y", "Y->Z", "Z->X"]';
  inputEl.focus();
}

// ─── Submit handler ─────────────────────────────────────────────────
async function handleSubmit() {
  // Reset UI
  errorEl.classList.remove('on');
  resultsEl.classList.remove('on');

  // Parse input
  let data;
  try {
    data = JSON.parse(inputEl.value.trim());
    if (!Array.isArray(data)) throw new Error('Input must be a JSON array');
  } catch (e) {
    showError('Invalid JSON. Please enter a valid JSON array like ["A->B", "C->D"]');
    return;
  }

  // Show loading
  submitBtn.disabled = true;
  loaderEl.classList.add('on');

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    renderResults(json);
  } catch (err) {
    console.error('API Error:', err);
    showError('API call failed. Check console.');
  } finally {
    submitBtn.disabled = false;
    loaderEl.classList.remove('on');
  }
}

function showError(msg) {
  errorText.textContent = msg;
  errorEl.classList.add('on');
}

// ─── Render full response ───────────────────────────────────────────
function renderResults(data) {
  // User info
  uinfoEl.innerHTML = `
    <div class="uinfo__item"><strong>User:</strong>&nbsp;<span>${esc(data.user_id)}</span></div>
    <div class="uinfo__item"><strong>Email:</strong>&nbsp;<span>${esc(data.email_id)}</span></div>
    <div class="uinfo__item"><strong>Roll:</strong>&nbsp;<span>${esc(data.college_roll_number)}</span></div>
  `;
  uinfoEl.classList.add('on');

  // Summary bar
  const s = data.summary || {};
  summaryBar.innerHTML = `
    <div class="sc"><div class="v v-t">${s.total_trees ?? 0}</div><div class="l">Trees</div></div>
    <div class="sc"><div class="v v-r">${s.total_cycles ?? 0}</div><div class="l">Cycles</div></div>
    <div class="sc"><div class="v v-p">${s.largest_tree_root ?? '—'}</div><div class="l">Largest Root</div></div>
  `;

  // Hierarchies
  const hiers = data.hierarchies || [];
  hierCount.textContent = hiers.length;
  hierGrid.innerHTML = '';

  for (const h of hiers) {
    const isCycle = !!h.has_cycle;
    const card = document.createElement('div');
    card.className = 'tc' + (isCycle ? ' cy' : '');

    let badgeHTML = '';
    if (isCycle) {
      badgeHTML = '<span class="bdg bdg-cy">⚠ Cycle</span>';
    } else if (h.depth !== undefined) {
      badgeHTML = `<span class="bdg bdg-d">Depth ${h.depth}</span>`;
    }

    let treeHTML = '';
    if (isCycle) {
      treeHTML = '<div class="tv"><div class="tv-e">Circular dependency detected — no tree structure</div></div>';
    } else {
      treeHTML = '<div class="tv">' + renderTree(h.tree, '', true) + '</div>';
    }

    card.innerHTML = `
      <div class="tc-hdr">
        <div class="tc-root">
          <div class="tc-rl">${esc(h.root)}</div>
          <div class="tc-rt">Root Node</div>
        </div>
        ${badgeHTML}
      </div>
      ${treeHTML}
    `;
    hierGrid.appendChild(card);
  }

  // Invalid entries
  const inv = data.invalid_entries || [];
  if (inv.length > 0) {
    invSec.style.display = '';
    invCount.textContent = inv.length;
    invList.innerHTML = inv.map(e => `<span class="pill pill-r">✕ ${esc(e || '(empty)')}</span>`).join('');
  } else {
    invSec.style.display = 'none';
  }

  // Duplicate edges
  const dup = data.duplicate_edges || [];
  if (dup.length > 0) {
    dupSec.style.display = '';
    dupCount.textContent = dup.length;
    dupList.innerHTML = dup.map(e => `<span class="pill pill-y">♻ ${esc(e)}</span>`).join('');
  } else {
    dupSec.style.display = 'none';
  }

  resultsEl.classList.add('on');

  // Smooth scroll to results
  setTimeout(() => {
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ─── Recursive tree renderer ────────────────────────────────────────
function renderTree(obj, prefix, isLast) {
  if (!obj || typeof obj !== 'object') return '';

  const keys = Object.keys(obj);
  if (keys.length === 0) return '';

  let html = '';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const children = obj[key];
    const childKeys = Object.keys(children);
    const last = i === keys.length - 1;

    // Connector glyphs
    const connector = prefix === '' ? '' : (last ? '└── ' : '├── ');
    const nextPrefix = prefix === '' ? '' : (prefix + (last ? '    ' : '│   '));

    html += `<div class="tv-n"><span class="tv-c">${esc(prefix + connector)}</span><span class="tv-l">${esc(key)}</span></div>`;

    if (childKeys.length > 0) {
      // Render children of this node
      for (let j = 0; j < childKeys.length; j++) {
        const ck = childKeys[j];
        const cLast = j === childKeys.length - 1;
        const cConn = cLast ? '└── ' : '├── ';
        const cNext = nextPrefix + (cLast ? '    ' : '│   ');
        html += `<div class="tv-n"><span class="tv-c">${esc(nextPrefix + cConn)}</span><span class="tv-l">${esc(ck)}</span></div>`;

        // Grandchildren and deeper
        const grandchildren = children[ck];
        if (grandchildren && Object.keys(grandchildren).length > 0) {
          html += renderSubtree(grandchildren, cNext);
        }
      }
    }
  }
  return html;
}

function renderSubtree(obj, prefix) {
  if (!obj || typeof obj !== 'object') return '';
  const keys = Object.keys(obj);
  let html = '';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const last = i === keys.length - 1;
    const conn = last ? '└── ' : '├── ';
    const next = prefix + (last ? '    ' : '│   ');
    html += `<div class="tv-n"><span class="tv-c">${esc(prefix + conn)}</span><span class="tv-l">${esc(key)}</span></div>`;
    const children = obj[key];
    if (children && Object.keys(children).length > 0) {
      html += renderSubtree(children, next);
    }
  }
  return html;
}

// ─── HTML escape ────────────────────────────────────────────────────
function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// ─── Keyboard shortcut ─────────────────────────────────────────────
inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    handleSubmit();
  }
});
