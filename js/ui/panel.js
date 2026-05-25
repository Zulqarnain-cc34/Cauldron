import { Species, getMaterial, getToggleableRules, buildBrushTools } from '../cauldron/app.js';
import { mountRulePicker } from './rule-picker.js';

function materialColor(species) {
  const [r, g, b] = getMaterial(species).color;
  return `rgb(${r}, ${g}, ${b})`;
}

function createSwatch(species) {
  const swatch = document.createElement('span');
  swatch.className = 'material-swatch';
  swatch.style.backgroundColor = materialColor(species);
  if (species === Species.EMPTY) swatch.classList.add('material-swatch-erase');
  swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}

function createBrushRow(tool) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'brush-picker-option';
  row.dataset.species = String(tool.species);
  row.append(createSwatch(tool.species), document.createTextNode(tool.label));
  return row;
}

function mountBrushDropdown(world, brushEl) {
  const picker = document.createElement('div');
  picker.className = 'brush-picker';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'brush-picker-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerSwatch = createSwatch(world.brush.species);
  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'brush-picker-label';
  const triggerCaret = document.createElement('span');
  triggerCaret.className = 'brush-picker-caret';
  triggerCaret.textContent = '▾';
  trigger.append(triggerSwatch, triggerLabel, triggerCaret);

  const menu = document.createElement('div');
  menu.className = 'brush-picker-menu';
  menu.setAttribute('role', 'listbox');

  const brushTools = buildBrushTools();
  let activeTool = brushTools.find((t) => t.species === world.brush.species) ?? brushTools[0];

  function setSelection(tool) {
    activeTool = tool;
    world.brush.species = tool.species;
    triggerSwatch.style.backgroundColor = materialColor(tool.species);
    triggerSwatch.classList.toggle('material-swatch-erase', tool.species === Species.EMPTY);
    triggerLabel.textContent = tool.label;
    menu.querySelectorAll('.brush-picker-option').forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.species) === tool.species);
      btn.setAttribute('aria-selected', String(Number(btn.dataset.species) === tool.species));
    });
  }

  function closeMenu() {
    picker.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    picker.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  for (const tool of brushTools) {
    const option = createBrushRow(tool);
    option.setAttribute('role', 'option');
    option.addEventListener('click', () => {
      setSelection(tool);
      closeMenu();
    });
    menu.appendChild(option);
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (picker.classList.contains('open')) closeMenu();
    else openMenu();
  });

  document.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  picker.append(trigger, menu);
  brushEl.appendChild(picker);
  setSelection(activeTool);

  return {
    syncFromWorld() {
      const tool =
        brushTools.find((t) => t.species === world.brush.species) ?? brushTools[0];
      setSelection(tool);
    },
  };
}

export function mountPanel(world, callbacks) {
  const root = document.getElementById('cauldron-ui');
  if (!root) return;

  root.innerHTML = `
    <header class="bar bar-top">
      <h1>Cauldron</h1>
      <a href="/help/index.html">Help</a>
      <a href="/docs/index.html">Docs</a>
      <span class="tick" id="tick-label">tick 0</span>
      <button type="button" id="btn-pause" title="Space">Pause</button>
      <button type="button" id="btn-step" title="Step one frame">&gt;</button>
      <button type="button" id="btn-reset">Reset</button>
    </header>
    <aside class="bar bar-left" id="brush-tools"></aside>
    <aside class="bar bar-right" id="rule-toggles"></aside>
  `;

  const brushEl = root.querySelector('#brush-tools');
  const brushPicker = mountBrushDropdown(world, brushEl);

  const rulesEl = root.querySelector('#rule-toggles');
  const rulePicker = mountRulePicker(world, rulesEl, { rules: getToggleableRules() });

  const radiusLabel = document.createElement('label');
  radiusLabel.className = 'brush-size';
  const radiusInput = document.createElement('input');
  radiusInput.type = 'range';
  radiusInput.min = '1';
  radiusInput.max = '8';
  radiusInput.value = String(world.brush.radius);
  radiusInput.addEventListener('input', () => {
    world.brush.radius = Number(radiusInput.value);
  });
  radiusLabel.appendChild(document.createTextNode('Brush '));
  radiusLabel.appendChild(radiusInput);
  brushEl.appendChild(radiusLabel);

  root.querySelector('#btn-pause').addEventListener('click', () => {
    world.paused = !world.paused;
    callbacks.onPauseChange?.(world.paused);
  });

  root.querySelector('#btn-step').addEventListener('click', () => {
    callbacks.onStep?.();
  });

  root.querySelector('#btn-reset').addEventListener('click', () => {
    world.reset();
    callbacks.onReset?.();
  });

  return {
    setTick(t) {
      const el = root.querySelector('#tick-label');
      if (el) el.textContent = `tick ${t}`;
    },
    setPaused(paused) {
      const btn = root.querySelector('#btn-pause');
      if (btn) btn.textContent = paused ? 'Play' : 'Pause';
    },
    syncRules: rulePicker?.refresh,
    syncBrush: brushPicker?.syncFromWorld,
    syncBrushRadius() {
      radiusInput.value = String(world.brush.radius);
    },
  };
}

export function bindKeyboard(world, callbacks) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      world.paused = !world.paused;
      callbacks.onPauseChange?.(world.paused);
    }
    if (e.code === 'KeyR' && !e.ctrlKey) {
      world.reset();
      callbacks.onReset?.();
    }
  });
}
