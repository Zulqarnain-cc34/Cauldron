import { getMapDefinition } from '../lib/index.js';

/**
 * Map tab bar — open tabs with + (new) and × (close).
 * @param {import('../lib/maps/manager.js').MapManager} manager
 * @param {HTMLElement | null} hostEl
 * @param {{ onRenamed?: () => void }} [opts]
 */
export function mountMapTabs(manager, hostEl, opts = {}) {
  if (!hostEl) return null;

  hostEl.classList.add('map-tabs');
  hostEl.setAttribute('role', 'tablist');
  hostEl.setAttribute('aria-label', 'Maps');

  function startRename(wrap, tab) {
    const btn = wrap.querySelector('.map-tab');
    if (!btn || btn.hidden) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'map-tab-rename';
    input.value = tab.label;
    input.setAttribute('aria-label', 'Rename map');
    input.maxLength = 48;

    btn.hidden = true;
    wrap.insertBefore(input, btn);

    input.focus();
    input.select();

    let done = false;
    function finish(save) {
      if (done) return;
      done = true;
      const next = save ? input.value.trim() : tab.label;
      if (save && next && next !== tab.label) {
        manager.renameTab(tab.instanceId, next);
        opts.onRenamed?.();
      }
      renderTabs();
    }

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
      e.stopPropagation();
    });
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());
  }

  function renderTabs() {
    hostEl.innerHTML = '';
    const tabs = manager.getOpenTabs();
    const activeId = manager.getActiveTabId();

    tabs.forEach((tab, index) => {
      const def = getMapDefinition(tab.defId);
      const wrap = document.createElement('div');
      wrap.className = 'map-tab-wrap';
      wrap.setAttribute('role', 'presentation');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-tab';
      btn.dataset.tabId = tab.instanceId;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(tab.instanceId === activeId));
      btn.title = `${def?.description ?? tab.label} — double-click to rename`;
      btn.textContent = tab.label;

      btn.addEventListener('click', (e) => {
        if (e.target.closest('.map-tab-close')) return;
        if (manager.getActiveTabId() === tab.instanceId) return;
        manager.switchTo(tab.instanceId);
      });

      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startRename(wrap, tab);
      });

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'map-tab-close';
      close.setAttribute('aria-label', `Close ${tab.label}`);
      close.title = 'Close map';
      close.textContent = '×';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        if (manager.getOpenTabs().length <= 1) return;
        manager.closeTab(tab.instanceId);
        renderTabs();
        opts.onRenamed?.();
      });

      wrap.append(btn, close);
      if (tab.instanceId === activeId) {
        btn.classList.add('active');
      }
      hostEl.appendChild(wrap);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'map-tab-add';
    add.setAttribute('aria-label', 'New map');
    add.title = 'New map';
    add.textContent = '+';
    add.addEventListener('click', () => {
      manager.openTab();
      renderTabs();
    });
    hostEl.appendChild(add);
  }

  function bindTabKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      const tabs = manager.getOpenTabs();
      const idx = Number(e.key) - 1;
      if (idx < 0 || idx >= tabs.length) return;
      const tab = tabs[idx];
      if (manager.getActiveTabId() === tab.instanceId) return;
      e.preventDefault();
      manager.switchTo(tab.instanceId);
    });
  }

  renderTabs();
  bindTabKeyboard();

  const priorOnSwitch = manager.onSwitch;
  manager.onSwitch = (ctx) => {
    renderTabs();
    priorOnSwitch?.(ctx);
  };

  return {
    refresh: renderTabs,
  };
}
