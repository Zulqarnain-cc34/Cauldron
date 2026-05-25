import { World, initPlugins, buildDocCatalog, getDocEntry, getDocStats, searchDocEntries } from '../js/cauldron/index.js';
import { runScenario } from '../tests/helpers/harness.js';
import { LiveDemoPlayer } from '../tests/helpers/live-demo.js';
import '../plugins/index.js';

initPlugins({
  world: new World(4, 4),
  canvas: { addEventListener() {} },
});

const state = {
  query: '',
  kind: '',
  selectedId: null,
  selectedTestId: null,
};

let demo = null;

function kindBadge(kind) {
  return `<span class="kind-badge kind-${kind}">${kind}</span>`;
}

function swatchHtml(entry) {
  if (!entry.color) return '';
  const [r, g, b] = entry.color;
  return `<span class="doc-swatch" style="background:rgb(${r},${g},${b})"></span>`;
}

function renderStats() {
  const s = getDocStats();
  document.getElementById('doc-stats').innerHTML = `
    <span>${s.materials} materials</span>
    <span>${s.plugins} plugins</span>
    <span>${s.systems} systems</span>
    <span>${s.tests} tests</span>
  `;
}

function renderList() {
  const { entries, total, truncated } = searchDocEntries(state.query, {
    kind: state.kind || undefined,
    limit: 80,
  });

  const status = document.getElementById('list-status');
  status.textContent = truncated
    ? `Showing 80 of ${total} — refine search`
    : `${total} entr${total === 1 ? 'y' : 'ies'}`;

  const list = document.getElementById('doc-list');
  list.replaceChildren();

  for (const entry of entries) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `doc-list-item${entry.id === state.selectedId ? ' active' : ''}`;
    btn.innerHTML = `
      ${swatchHtml(entry)}
      <span class="doc-list-text">
        <span class="doc-list-label">${entry.label}</span>
        <span class="doc-list-meta">${kindBadge(entry.kind)} · ${entry.tests.length} test(s)</span>
      </span>
    `;
    btn.addEventListener('click', () => selectEntry(entry.id));
    list.appendChild(btn);
  }
}

function renderEntry(entry) {
  const main = document.getElementById('doc-main');
  const testResults = entry.tests.map((t) => {
    const r = runScenario(t.test);
    return { ...t, pass: r.pass };
  });
  const passed = testResults.filter((t) => t.pass).length;

  main.innerHTML = `
    <article class="doc-entry">
      <header class="doc-entry-header">
        ${swatchHtml(entry)}
        <div>
          <h2>${entry.label} ${kindBadge(entry.kind)}</h2>
          <p class="doc-summary">${entry.summary}</p>
          ${entry.ascii ? `<code class="doc-ascii">${entry.ascii}</code>` : ''}
        </div>
      </header>

      <section class="doc-props">
        <h3>Properties</h3>
        <dl class="prop-grid">
          ${entry.properties
            .map(
              (p) => `
            <dt>${p.label}</dt>
            <dd>${p.value}</dd>
          `
            )
            .join('')}
        </dl>
      </section>

      <section class="doc-tests">
        <h3>Behavior tests <span class="test-count">${passed}/${entry.tests.length} passing</span></h3>
        <p class="doc-tests-hint">Each test is the spec. Click <strong>Run live</strong> to replay on the production engine.</p>
        <div class="test-cards">
          ${testResults
            .map(
              (t) => `
            <article class="test-card ${t.pass ? 'pass' : 'fail'}">
              <header>
                <span class="badge">${t.pass ? 'PASS' : 'FAIL'}</span>
                <h4>${t.name}</h4>
                <code>${t.id}</code>
              </header>
              ${t.description ? `<p>${t.description}</p>` : ''}
              <p class="meta">${t.steps} step(s)</p>
              <button type="button" class="run-live-btn" data-test-id="${t.id}">Run live</button>
            </article>
          `
            )
            .join('')}
        </div>
      </section>
    </article>
  `;

  main.querySelectorAll('.run-live-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const testId = btn.dataset.testId;
      const ref = entry.tests.find((t) => t.id === testId);
      if (ref) runLiveTest(ref);
    });
  });

  if (state.selectedTestId) {
    const ref = entry.tests.find((t) => t.id === state.selectedTestId);
    if (ref) runLiveTest(ref, false);
  } else if (entry.tests[0]) {
    runLiveTest(entry.tests[0], false);
  }
}

function selectEntry(id, testId = null) {
  state.selectedId = id;
  state.selectedTestId = testId;
  location.hash = testId ? `#${id}/${testId}` : `#${id}`;
  renderList();
  const entry = getDocEntry(id);
  if (entry) renderEntry(entry);
}

function runLiveTest(testRef, autoplay = true) {
  state.selectedTestId = testRef.id;
  if (state.selectedId) location.hash = `#${state.selectedId}/${testRef.id}`;

  demo.load(testRef.test);
  document.getElementById('demo-test-id').textContent = testRef.id;
  if (autoplay) demo.play();
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return;
  const [entryId, testId] = raw.split('/');
  if (getDocEntry(entryId)) selectEntry(entryId, testId ?? null);
}

function initDemo() {
  demo = new LiveDemoPlayer(document.getElementById('demo-canvas'), {
    statusEl: document.getElementById('demo-status'),
    resultEl: document.getElementById('demo-result'),
    verifyEl: document.getElementById('demo-verify'),
    rulesEl: document.getElementById('demo-rules'),
    sliceEl: document.getElementById('demo-slice'),
    ticksEl: document.getElementById('demo-ticks'),
  });

  document.getElementById('btn-play')?.addEventListener('click', () => demo?.play());
  document.getElementById('btn-pause')?.addEventListener('click', () => demo?.pause());
  document.getElementById('btn-step')?.addEventListener('click', () => demo?.step());
  document.getElementById('btn-replay')?.addEventListener('click', () => demo?.replay());
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.kind = btn.dataset.kind ?? '';
      renderList();
    });
  });
}

function initSearch() {
  const input = document.getElementById('doc-search');
  input.addEventListener('input', () => {
    state.query = input.value;
    renderList();
  });
}

renderStats();
initDemo();
initFilters();
initSearch();
renderList();
parseHash();
window.addEventListener('hashchange', parseHash);

if (!location.hash && buildDocCatalog().length) {
  selectEntry(buildDocCatalog()[0].id);
}
