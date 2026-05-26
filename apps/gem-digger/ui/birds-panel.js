import {
  birdSimConfig,
  BIRD_SIM_PRESETS,
  BIRD_PRESET_LABELS,
  applyBirdSimPreset,
  resetBirdSimConfig,
} from '../lib/birds/config.js';
import { spawnDemoFlocks } from '../lib/birds/birds.js';
import { resetWindParticles } from '../lib/birds/wind-viz.js';
import {
  getBirdMetricsSnapshot,
  getBirdMetricsHistory,
  sparklineAscii,
} from '../lib/birds/metrics.js';

/**
 * @param {string} label
 * @param {string} key dot path e.g. "flock.weightCoh"
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @param {(v: number) => string} [format]
 */
function sliderRow(label, key, min, max, step, format = (v) => String(Number(v.toFixed(2)))) {
  const row = document.createElement('label');
  row.className = 'birds-slider-row';

  const parts = key.split('.');
  const section = parts[0];
  const field = parts[1];

  const name = document.createElement('span');
  name.className = 'birds-slider-label';
  name.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(birdSimConfig[section][field]);

  const val = document.createElement('span');
  val.className = 'birds-slider-val';
  val.textContent = format(Number(input.value));

  input.addEventListener('input', () => {
    const n = Number(input.value);
    birdSimConfig[section][field] = n;
    val.textContent = format(n);
  });

  row.append(name, input, val);
  return row;
}

/**
 * @param {import('../../../js/world.js').World} world
 * @param {{ onRespawn?: () => void }} [opts]
 */
export function mountBirdsPanel(world, opts = {}) {
  const root = document.createElement('aside');
  root.className = 'birds-panel';
  root.id = 'birds-panel';

  root.innerHTML = `
    <header class="birds-panel-head">
      <h2 class="birds-panel-title">Birds & wind</h2>
      <button type="button" class="birds-panel-collapse" title="Collapse panel" aria-expanded="true">▾</button>
    </header>
    <div class="birds-panel-body">
      <label class="birds-preset-row">
        <span>Preset</span>
        <select class="birds-preset-select" aria-label="Bird simulation preset"></select>
      </label>
      <details class="birds-section" open>
        <summary>Simulation</summary>
        <div class="birds-section-inner" data-section="sim"></div>
      </details>
      <details class="birds-section" open>
        <summary>Flocking</summary>
        <div class="birds-section-inner" data-section="flock"></div>
      </details>
      <details class="birds-section" open>
        <summary>Perlin wind</summary>
        <div class="birds-section-inner" data-section="wind"></div>
      </details>
      <details class="birds-section" open>
        <summary>Display</summary>
        <div class="birds-section-inner" data-section="display"></div>
      </details>
      <details class="birds-section birds-diagnostics-section" open>
        <summary>Diagnostics</summary>
        <div class="birds-section-inner birds-diagnostics" data-section="diagnostics"></div>
      </details>
      <button type="button" class="birds-respawn-btn">Respawn demo flocks</button>
    </div>
  `;

  const presetSelect = root.querySelector('.birds-preset-select');
  for (const id of Object.keys(BIRD_SIM_PRESETS)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = BIRD_PRESET_LABELS[id] ?? id;
    presetSelect.appendChild(opt);
  }
  presetSelect.value = 'calmWind';
  applyBirdSimPreset('calmWind');

  presetSelect.addEventListener('change', () => {
    applyBirdSimPreset(presetSelect.value);
    syncSlidersFromConfig();
  });

  const simEl = root.querySelector('[data-section="sim"]');
  const wrapNote = document.createElement('p');
  wrapNote.className = 'birds-wrap-note';
  wrapNote.textContent =
    'Sky is a seamless torus — birds re-enter on the opposite edge (no hard walls in the air).';
  simEl.append(
    wrapNote,
    sliderRow('Sim speed', 'motion.simSpeed', 0.5, 20, 0.5, (v) => `${Number(v.toFixed(1))}×`)
  );

  const flockEl = root.querySelector('[data-section="flock"]');
  const interactionRow = document.createElement('label');
  interactionRow.className = 'birds-preset-row';
  interactionRow.innerHTML = '<span>Interaction</span>';
  const interactionSelect = document.createElement('select');
  interactionSelect.className = 'birds-preset-select';
  interactionSelect.innerHTML = `
    <option value="topological">Topological (k nearest)</option>
    <option value="metric">Metric (radius)</option>
  `;
  interactionSelect.value = birdSimConfig.flock.interactionMode;
  interactionSelect.addEventListener('change', () => {
    birdSimConfig.flock.interactionMode = interactionSelect.value;
    refreshDiagnostics();
  });
  interactionRow.append(interactionSelect);
  flockEl.append(interactionRow);

  flockEl.append(
    sliderRow('K neighbours', 'flock.topologicalNeighbors', 3, 20, 1, (v) =>
      String(Math.round(v))
    ),
    sliderRow('Cohesion', 'flock.weightCoh', 0, 2, 0.05),
    sliderRow('Separation', 'flock.weightSep', 0, 6, 0.05),
    sliderRow('Alignment', 'flock.weightAli', 0, 2, 0.05),
    sliderRow('Personal space', 'flock.personalSpace', 2, 12, 0.25),
    sliderRow('Perception', 'flock.perception', 12, 80, 1, (v) => String(Math.round(v))),
    sliderRow('Sep. radius', 'flock.separationRadius', 8, 40, 1, (v) => String(Math.round(v))),
    sliderRow('Min flock', 'flock.minFlockSize', 2, 8, 1, (v) => String(Math.round(v))),
    sliderRow('Cohesion speed', 'flock.cohesionSpeed', 0.1, 1.2, 0.05)
  );

  const windEl = root.querySelector('[data-section="wind"]');
  const windForceToggle = document.createElement('label');
  windForceToggle.className = 'birds-check-row';
  const windForceCheck = document.createElement('input');
  windForceCheck.type = 'checkbox';
  windForceCheck.checked = birdSimConfig.wind.enabled;
  windForceCheck.addEventListener('change', () => {
    birdSimConfig.wind.enabled = windForceCheck.checked;
  });
  windForceToggle.append(windForceCheck, document.createTextNode(' Apply wind forces'));
  windEl.append(windForceToggle);
  windEl.append(
    sliderRow('Wind strength', 'wind.steerWeight', 0.2, 4, 0.05),
    sliderRow('Flow speed', 'wind.speedFactor', 0.2, 1.2, 0.05),
    sliderRow('Noise scale', 'wind.noiseScale', 0.005, 0.06, 0.001, (v) => v.toFixed(3)),
    sliderRow('Time drift', 'wind.timeScale', 0.002, 0.05, 0.001, (v) => v.toFixed(3)),
    sliderRow('Gust floor', 'wind.gustMin', 0, 0.9, 0.05)
  );

  const displayEl = root.querySelector('[data-section="display"]');
  const windToggle = document.createElement('label');
  windToggle.className = 'birds-check-row';
  const windCheck = document.createElement('input');
  windCheck.type = 'checkbox';
  windCheck.checked = birdSimConfig.display.showWindField;
  windCheck.addEventListener('change', () => {
    birdSimConfig.display.showWindField = windCheck.checked;
  });
  windToggle.append(windCheck, document.createTextNode(' Show wind flow'));
  displayEl.append(windToggle);
  displayEl.append(
    sliderRow('Streak count', 'display.windParticleCount', 40, 280, 10, (v) =>
      String(Math.round(v))
    ),
    sliderRow('Streak length', 'display.windStreakLength', 8, 36, 1, (v) =>
      String(Math.round(v))
    ),
    sliderRow('Visibility', 'display.windOpacity', 8, 70, 1, (v) => String(Math.round(v))),
    sliderRow('Flow speed', 'display.windDriftSpeed', 0.2, 2, 0.05)
  );

  const diagEl = root.querySelector('[data-section="diagnostics"]');
  const diagToggle = document.createElement('label');
  diagToggle.className = 'birds-check-row';
  const diagCheck = document.createElement('input');
  diagCheck.type = 'checkbox';
  diagCheck.checked = birdSimConfig.display.showDiagnostics;
  diagCheck.addEventListener('change', () => {
    birdSimConfig.display.showDiagnostics = diagCheck.checked;
  });
  diagToggle.append(diagCheck, document.createTextNode(' Live flock metrics'));
  const diagBody = document.createElement('div');
  diagBody.className = 'birds-diag-body';
  diagEl.append(diagToggle, diagBody);

  function metricBar(label, value, goodLo, goodHi) {
    const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
    let tone = 'mid';
    if (value >= goodLo && value <= goodHi) tone = 'good';
    else if (value < goodLo * 0.5 || value > Math.min(1, goodHi * 1.4)) tone = 'bad';
    return `<div class="birds-metric-row">
      <span class="birds-metric-label">${label}</span>
      <div class="birds-metric-bar birds-metric-${tone}"><i style="width:${pct}%"></i></div>
      <span class="birds-metric-val">${pct}%</span>
    </div>`;
  }

  function signedBar(label, value) {
    const pct = Math.round((value + 1) * 50);
    const tone = value > 0.55 ? 'good' : value < 0.2 ? 'bad' : 'mid';
    return `<div class="birds-metric-row">
      <span class="birds-metric-label">${label}</span>
      <div class="birds-metric-bar birds-metric-${tone}"><i style="width:${pct}%"></i></div>
      <span class="birds-metric-val">${value >= 0 ? '+' : ''}${value.toFixed(2)}</span>
    </div>`;
  }

  function refreshDiagnostics() {
    if (!birdSimConfig.display.showDiagnostics) {
      diagBody.innerHTML =
        '<p class="birds-wrap-note">Enable live metrics to judge wind vs flocking while you tune sliders.</p>';
      return;
    }

    const m = getBirdMetricsSnapshot();
    if (!m) {
      diagBody.innerHTML = '<p class="birds-wrap-note">Waiting for birds…</p>';
      return;
    }

    const hist = getBirdMetricsHistory();
    const kindLines = ['sparrow', 'eagle', 'finch']
      .filter((k) => m.byKind[k]?.count > 0)
      .map(
        (k) =>
          `${k}: n=${m.byKind[k].count} pol=${(m.byKind[k].polarization * 100).toFixed(0)}% wind=${m.byKind[k].windAlignment.toFixed(2)}`
      )
      .join('<br>');

    const modeLabel =
      m.interactionMode === 'topological'
        ? `Topological (k≈${birdSimConfig.flock.topologicalNeighbors})`
        : `Metric (R=${Math.round(birdSimConfig.flock.perception)})`;

    diagBody.innerHTML = `
      <p class="birds-diag-verdict birds-diag-${m.verdict.replace(/\s+/g, '-').toLowerCase()}">${m.verdict}</p>
      <p class="birds-diag-hint">${m.hint}</p>
      <div class="birds-metric-row">
        <span class="birds-metric-label">Interaction</span>
        <span class="birds-metric-val">${modeLabel}</span>
      </div>
      ${metricBar('Flock emergence', m.flockEmergence, 0.55, 0.95)}
      ${metricBar('Separation', m.separationScore, 0.6, 1)}
      ${metricBar('Alignment', m.alignmentScore, 0.5, 1)}
      ${metricBar('Cohesion', m.cohesionScore, 0.45, 1)}
      ${metricBar('Vicsek order φ', m.polarization, 0.55, 0.95)}
      ${signedBar('Wind alignment', m.windAlignment)}
      <div class="birds-metric-row">
        <span class="birds-metric-label">Mean interact. dist</span>
        <span class="birds-metric-val">${m.meanInteractionDist.toFixed(1)} cells</span>
      </div>
      <div class="birds-metric-row">
        <span class="birds-metric-label">Avg neighbours</span>
        <span class="birds-metric-val">${m.avgInteractionCount.toFixed(1)}</span>
      </div>
      ${metricBar('Flock participation', m.flockParticipation, 0.4, 0.95)}
      <div class="birds-metric-row">
        <span class="birds-metric-label">Cohesion spread</span>
        <span class="birds-metric-val">${m.cohesionSpread.toFixed(1)} cells</span>
      </div>
      <div class="birds-metric-row">
        <span class="birds-metric-label">Mean neighbor dist</span>
        <span class="birds-metric-val">${m.meanNeighborDist.toFixed(1)} cells</span>
      </div>
      ${metricBar('Separation violations', Math.min(1, m.separationViolations), 0, 0.15)}
      ${metricBar('Glitch rate', m.glitchRate, 0, 0.05)}
      <div class="birds-metric-row">
        <span class="birds-metric-label">Mean speed</span>
        <span class="birds-metric-val">${m.meanSpeed.toFixed(2)}</span>
      </div>
      <p class="birds-spark-label">Polarization history</p>
      <code class="birds-spark">${sparklineAscii(hist.polarization)}</code>
      <p class="birds-spark-label">Wind alignment history</p>
      <code class="birds-spark">${sparklineAscii(hist.windAlignment.map((v) => (v + 1) / 2))}</code>
      <p class="birds-spark-label">Glitch history</p>
      <code class="birds-spark">${sparklineAscii(hist.glitchRate)}</code>
      <p class="birds-diag-kinds">${kindLines}</p>
      <p class="birds-wrap-note">High sim speed uses extra physics substeps (stable up to 20×). Use wind presets to compare calm vs turbulent.</p>
    `;
  }

  let diagTimer = 0;
  function startDiagPoll() {
    if (diagTimer) return;
    diagTimer = window.setInterval(refreshDiagnostics, 200);
  }
  function stopDiagPoll() {
    if (diagTimer) {
      clearInterval(diagTimer);
      diagTimer = 0;
    }
  }
  /** Sync all range inputs from birdSimConfig after preset change. */
  function syncSlidersFromConfig() {
    root.querySelectorAll('.birds-slider-row input[type="range"]').forEach((input) => {
      const row = input.closest('.birds-slider-row');
      const label = row?.querySelector('.birds-slider-label')?.textContent;
      const map = {
        'Sim speed': ['motion', 'simSpeed'],
        'K neighbours': ['flock', 'topologicalNeighbors'],
        Cohesion: ['flock', 'weightCoh'],
        Separation: ['flock', 'weightSep'],
        Alignment: ['flock', 'weightAli'],
        'Personal space': ['flock', 'personalSpace'],
        Perception: ['flock', 'perception'],
        'Sep. radius': ['flock', 'separationRadius'],
        'Min flock': ['flock', 'minFlockSize'],
        'Cohesion speed': ['flock', 'cohesionSpeed'],
        'Wind strength': ['wind', 'steerWeight'],
        'Flow speed': ['wind', 'speedFactor'],
        'Noise scale': ['wind', 'noiseScale'],
        'Time drift': ['wind', 'timeScale'],
        'Gust floor': ['wind', 'gustMin'],
        'Streak count': ['display', 'windParticleCount'],
        'Streak length': ['display', 'windStreakLength'],
        Visibility: ['display', 'windOpacity'],
        'Flow speed': ['display', 'windDriftSpeed'],
      };
      const path = map[label ?? ''];
      if (!path) return;
      input.value = String(birdSimConfig[path[0]][path[1]]);
      input.dispatchEvent(new Event('input'));
    });
    windCheck.checked = birdSimConfig.display.showWindField;
    windForceCheck.checked = birdSimConfig.wind.enabled;
    diagCheck.checked = birdSimConfig.display.showDiagnostics;
    interactionSelect.value = birdSimConfig.flock.interactionMode;
    refreshDiagnostics();
  }

  syncSlidersFromConfig();
  startDiagPoll();
  refreshDiagnostics();

  root.querySelector('.birds-respawn-btn')?.addEventListener('click', () => {
    resetWindParticles();
    spawnDemoFlocks(world);
    opts.onRespawn?.();
  });

  const collapseBtn = root.querySelector('.birds-panel-collapse');
  collapseBtn?.addEventListener('click', () => {
    const collapsed = root.classList.toggle('collapsed');
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    collapseBtn.textContent = collapsed ? '▸' : '▾';
  });

  document.body.appendChild(root);

  return {
    el: root,
    syncFromConfig: syncSlidersFromConfig,
    refreshDiagnostics,
    destroy() {
      stopDiagPoll();
    },
    resetConfig() {
      resetBirdSimConfig();
      presetSelect.value = 'calmWind';
      applyBirdSimPreset('calmWind');
      syncSlidersFromConfig();
    },
  };
}
