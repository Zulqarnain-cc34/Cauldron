import { getMaterial } from '../catalog/materials.js';
import { ruleMatchesQuery } from '../catalog/rule-toggle-catalog.js';

const MAX_VISIBLE = 80;

/**
 * Searchable rule toggle dropdown — scales to large rule catalogs via filter + capped render.
 * Rules are supplied by the registry; adding a module is enough for it to show up here.
 *
 * @param {object} world
 * @param {HTMLElement} parentEl
 * @param {{ rules: import('../catalog/rule-toggle-catalog.js').ToggleableRule[], onChange?: () => void }} opts
 */
export function mountRulePicker(world, parentEl, { rules, onChange } = {}) {
  const picker = document.createElement('div');
  picker.className = 'rule-picker';

  const heading = document.createElement('div');
  heading.className = 'rule-picker-heading';
  heading.textContent = 'Rules';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'rule-picker-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'rule-picker-trigger-label';

  const triggerCaret = document.createElement('span');
  triggerCaret.className = 'rule-picker-caret';
  triggerCaret.textContent = '▾';
  trigger.append(triggerLabel, triggerCaret);

  const chipRow = document.createElement('div');
  chipRow.className = 'rule-picker-chips';
  chipRow.setAttribute('aria-label', 'Disabled rules');

  const menu = document.createElement('div');
  menu.className = 'rule-picker-menu';
  menu.setAttribute('role', 'listbox');

  const searchWrap = document.createElement('div');
  searchWrap.className = 'rule-picker-search-wrap';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'rule-picker-search';
  search.placeholder = 'Search rules…';
  search.autocomplete = 'off';
  search.setAttribute('aria-label', 'Search rules');
  searchWrap.appendChild(search);

  const list = document.createElement('div');
  list.className = 'rule-picker-list';

  const status = document.createElement('div');
  status.className = 'rule-picker-status';

  const actions = document.createElement('div');
  actions.className = 'rule-picker-actions';

  const btnEnable = document.createElement('button');
  btnEnable.type = 'button';
  btnEnable.textContent = 'Enable visible';
  const btnDisable = document.createElement('button');
  btnDisable.type = 'button';
  btnDisable.textContent = 'Disable visible';

  actions.append(btnEnable, btnDisable);
  menu.append(searchWrap, list, status, actions);

  picker.append(heading, trigger, chipRow, menu);
  parentEl.appendChild(picker);

  let query = '';

  function isEnabled(rule) {
    return world.ruleEnabled[rule.key] ?? true;
  }

  function setEnabled(rule, on) {
    if (rule.disabled) return;
    world.ruleEnabled[rule.key] = on;
    onChange?.();
    refresh();
  }

  function filteredRules() {
    return rules.filter((r) => ruleMatchesQuery(r, query));
  }

  function activeCount() {
    return rules.filter((r) => !r.disabled && isEnabled(r)).length;
  }

  function toggleableCount() {
    return rules.filter((r) => !r.disabled).length;
  }

  function refreshTrigger() {
    triggerLabel.textContent = `${activeCount()} / ${toggleableCount()} active`;
  }

  function refreshChips() {
    chipRow.replaceChildren();
    const off = rules.filter((r) => !r.disabled && !isEnabled(r));
    const maxChips = 4;
    for (const rule of off.slice(0, maxChips)) {
      chipRow.appendChild(createChip(rule));
    }
    if (off.length > maxChips) {
      const more = document.createElement('span');
      more.className = 'rule-picker-chip rule-picker-chip-more';
      more.textContent = `+${off.length - maxChips} off`;
      chipRow.appendChild(more);
    }
  }

  function createChip(rule) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'rule-picker-chip';
    chip.title = `Enable ${rule.label}`;
    chip.textContent = rule.label;
    chip.addEventListener('click', () => setEnabled(rule, true));
    return chip;
  }

  function createRow(rule) {
    const row = document.createElement('label');
    row.className = 'rule-picker-option';
    row.dataset.key = rule.key;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = isEnabled(rule);
    cb.disabled = rule.disabled ?? false;
    cb.addEventListener('change', () => setEnabled(rule, cb.checked));

    const text = document.createElement('span');
    text.className = 'rule-picker-option-label';

    if (rule.species != null) {
      const swatch = document.createElement('span');
      swatch.className = 'material-swatch';
      const [r, g, b] = getMaterial(rule.species).color;
      swatch.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      swatch.setAttribute('aria-hidden', 'true');
      text.append(swatch, document.createTextNode(rule.label));
    } else {
      text.textContent = rule.label;
    }

    if (rule.disabled) {
      const soon = document.createElement('span');
      soon.className = 'rule-picker-soon';
      soon.textContent = 'soon';
      text.appendChild(soon);
    }

    row.append(cb, text);
    return row;
  }

  function refreshList() {
    const matched = filteredRules();
    const visible = matched.slice(0, MAX_VISIBLE);
    list.replaceChildren();

    for (const rule of visible) {
      list.appendChild(createRow(rule));
    }

    if (matched.length === 0) {
      status.textContent = query ? 'No rules match.' : 'No rules registered.';
    } else if (matched.length > MAX_VISIBLE) {
      status.textContent = `Showing ${MAX_VISIBLE} of ${matched.length} — refine search.`;
    } else if (rules.length > MAX_VISIBLE && !query.trim()) {
      status.textContent = `${rules.length} rules — search to narrow.`;
    } else {
      status.textContent = `${matched.length} rule${matched.length === 1 ? '' : 's'}`;
    }
  }

  function refresh() {
    refreshTrigger();
    refreshChips();
    refreshList();
  }

  function closeMenu() {
    picker.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    picker.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    search.focus();
    search.select();
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (picker.classList.contains('open')) closeMenu();
    else openMenu();
  });

  search.addEventListener('input', () => {
    query = search.value;
    refreshList();
  });

  search.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') closeMenu();
  });

  btnEnable.addEventListener('click', () => {
    for (const rule of filteredRules()) {
      if (!rule.disabled) world.ruleEnabled[rule.key] = true;
    }
    onChange?.();
    refresh();
  });

  btnDisable.addEventListener('click', () => {
    for (const rule of filteredRules()) {
      if (!rule.disabled) world.ruleEnabled[rule.key] = false;
    }
    onChange?.();
    refresh();
  });

  document.addEventListener('click', (e) => {
    if (!picker.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  refresh();

  return { refresh, closeMenu };
}
