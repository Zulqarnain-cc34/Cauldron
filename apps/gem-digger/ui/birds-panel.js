import {
  birdSimConfig,
  BIRD_SIM_PRESETS,
  applyBirdSimPreset,
  resetBirdSimConfig,
} from '../lib/birds/config.js';
import { spawnDemoFlocks } from '../lib/birds/birds.js';

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
      <button type="button" class="birds-respawn-btn">Respawn demo flocks</button>
    </div>
  `;

  const presetSelect = root.querySelector('.birds-preset-select');
  for (const id of Object.keys(BIRD_SIM_PRESETS)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    presetSelect.appendChild(opt);
  }
  presetSelect.value = 'default';

  presetSelect.addEventListener('change', () => {
    applyBirdSimPreset(presetSelect.value);
    syncSlidersFromConfig();
  });

  const flockEl = root.querySelector('[data-section="flock"]');
  flockEl.append(
    sliderRow('Cohesion', 'flock.weightCoh', 0, 2, 0.05),
    sliderRow('Separation', 'flock.weightSep', 0, 4, 0.05),
    sliderRow('Alignment', 'flock.weightAli', 0, 2, 0.05),
    sliderRow('Perception', 'flock.perception', 12, 80, 1, (v) => String(Math.round(v))),
    sliderRow('Sep. radius', 'flock.separationRadius', 4, 32, 1, (v) => String(Math.round(v))),
    sliderRow('Min flock', 'flock.minFlockSize', 2, 8, 1, (v) => String(Math.round(v))),
    sliderRow('Cohesion speed', 'flock.cohesionSpeed', 0.1, 1.2, 0.05)
  );

  const windEl = root.querySelector('[data-section="wind"]');
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

  /** Sync all range inputs from birdSimConfig after preset change. */
  function syncSlidersFromConfig() {
    root.querySelectorAll('.birds-slider-row input[type="range"]').forEach((input) => {
      const row = input.closest('.birds-slider-row');
      const label = row?.querySelector('.birds-slider-label')?.textContent;
      const map = {
        Cohesion: ['flock', 'weightCoh'],
        Separation: ['flock', 'weightSep'],
        Alignment: ['flock', 'weightAli'],
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
  }

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
    resetConfig() {
      resetBirdSimConfig();
      presetSelect.value = 'default';
      syncSlidersFromConfig();
    },
  };
}
