import { getAllTestSuites } from '../../js/cauldron/index.js';
import { World, initPlugins } from '../../js/cauldron/index.js';
import { runSuite } from '../../tooling/tests/helpers/harness.js';
import { drawAsciiGrid, rowsToPre } from '../../tooling/tests/helpers/visual.js';
import { LiveDemoPlayer } from '../../tooling/tests/helpers/live-demo.js';
import '../plugins/index.js';

initPlugins({
  world: new World(4, 4),
  canvas: { addEventListener() {} },
});

let demo = null;
let selectedId = null;
const resultById = new Map();

function renderSummary(container, summary) {
  const el = document.createElement('div');
  el.className = 'summary';
  el.innerHTML = `
    <strong>${summary.passed} / ${summary.total} passed</strong>
    ${summary.failed ? `<span class="fail-count">${summary.failed} failed</span>` : ''}
  `;
  container.appendChild(el);
}

function appendPanels(card, result) {
  const panels = document.createElement('div');
  panels.className = 'panels';
  for (const def of [
    { label: 'Before', rows: result.before },
    { label: 'After', rows: result.actual, highlight: result.diffs },
    { label: 'Expected', rows: result.expected },
  ]) {
    const panel = document.createElement('div');
    panel.className = 'panel';
    const canvas = document.createElement('canvas');
    drawAsciiGrid(canvas, def.rows, { label: def.label, highlight: def.highlight ?? [] });
    panel.appendChild(canvas);
    const pre = document.createElement('pre');
    pre.textContent = rowsToPre(def.rows);
    panel.appendChild(pre);
    panels.appendChild(panel);
  }
  card.appendChild(panels);
}

function renderTestCard(result, onSelect) {
  const card = document.createElement('article');
  card.className = `test-card ${result.pass ? 'pass' : 'fail'}`;
  if (result.id === selectedId) card.classList.add('selected');

  card.addEventListener('click', () => onSelect(result.test));

  const header = document.createElement('header');
  header.innerHTML = `
    <span class="badge">${result.pass ? 'PASS' : 'FAIL'}</span>
    <h2>${result.name}</h2>
    <code class="test-id">${result.id}</code>
  `;
  card.appendChild(header);

  if (result.description) {
    const p = document.createElement('p');
    p.className = 'desc';
    p.textContent = result.description;
    card.appendChild(p);
  }

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `${result.steps} step(s) · rules: ${result.only?.join(', ') ?? 'all'}`;
  card.appendChild(meta);

  if (result.id === selectedId) appendPanels(card, result);
  return card;
}

function selectTest(test) {
  selectedId = test.id;
  demo?.load(test);
  demo?.play();
  document.querySelectorAll('.test-card').forEach((card) => {
    const id = card.querySelector('.test-id')?.textContent;
    const selected = id === selectedId;
    card.classList.toggle('selected', selected);
    const panels = card.querySelector('.panels');
    if (selected && !panels) appendPanels(card, resultById.get(id));
    if (!selected && panels) panels.remove();
  });
}

function runAll() {
  const root = document.getElementById('test-root');
  root.innerHTML = '';
  resultById.clear();

  let totalPassed = 0;
  let totalTests = 0;

  for (const suite of getAllTestSuites()) {
    const section = document.createElement('section');
    section.className = 'suite';

    const heading = document.createElement('h1');
    heading.textContent = suite.label;
    section.appendChild(heading);

    const summary = runSuite(suite.tests);
    totalPassed += summary.passed;
    totalTests += summary.total;
    renderSummary(section, summary);

    for (const result of summary.results) {
      resultById.set(result.id, result);
      section.appendChild(renderTestCard(result, selectTest));
    }

    root.appendChild(section);
  }

  const global = document.getElementById('global-summary');
  global.textContent = `${totalPassed} / ${totalTests} tests passing`;
  global.className = totalPassed === totalTests ? 'ok' : 'bad';
}

function initDemo() {
  demo = new LiveDemoPlayer(document.getElementById('demo-canvas'), {
    statusEl: document.getElementById('demo-status'),
    resultEl: document.getElementById('demo-result'),
    verifyEl: document.getElementById('demo-verify'),
    engineEl: document.getElementById('demo-engine'),
    rulesEl: document.getElementById('demo-rules'),
    sliceEl: document.getElementById('demo-slice'),
    sizeEl: document.getElementById('demo-size'),
    ticksEl: document.getElementById('demo-ticks'),
  });

  document.getElementById('btn-play')?.addEventListener('click', () => demo?.play());
  document.getElementById('btn-pause')?.addEventListener('click', () => demo?.pause());
  document.getElementById('btn-step')?.addEventListener('click', () => demo?.step());
  document.getElementById('btn-replay')?.addEventListener('click', () => demo?.replay());
}

document.getElementById('btn-rerun')?.addEventListener('click', runAll);
initDemo();
runAll();
