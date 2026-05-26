import { getMapDefinition } from '../../../js/cauldron/game.js';

/**
 * Map tab bar — open tabs with + (new) and × (close).
 * @param {import('../../../js/game/maps/manager.js').MapManager} manager
 * @param {HTMLElement | null} hostEl
 */
export function mountMapTabs(manager, hostEl) {
  if (!hostEl) return null;

  hostEl.classList.add('map-tabs');
  hostEl.setAttribute('role', 'tablist');
  hostEl.setAttribute('aria-label', 'Maps');

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
      const shortcut = index < 9 ? ` (${index + 1})` : '';
      btn.title = def?.description ?? tab.label;
      btn.textContent = tab.label;

      btn.addEventListener('click', (e) => {
        if (e.target.closest('.map-tab-close')) return;
        if (manager.getActiveTabId() === tab.instanceId) return;
        manager.switchTo(tab.instanceId);
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
