import { getAllMapDefinitions } from '../maps/registry.js';

/**
 * Map tab bar — switch between registered map units (separate sessions).
 * @param {import('../maps/manager.js').MapManager} manager
 * @param {HTMLElement | null} hostEl
 */
export function mountMapTabs(manager, hostEl) {
  if (!hostEl) return null;

  hostEl.classList.add('map-tabs');
  hostEl.setAttribute('role', 'tablist');
  hostEl.setAttribute('aria-label', 'Maps');

  /** @type {Map<string, HTMLButtonElement>} */
  const tabButtons = new Map();

  function renderTabs() {
    hostEl.innerHTML = '';
    tabButtons.clear();

    for (const def of getAllMapDefinitions()) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'map-tab';
      tab.dataset.mapId = def.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.title = def.description ?? def.label;
      tab.textContent = def.label;

      tab.addEventListener('click', () => {
        if (manager.getActiveMapId() === def.id) return;
        manager.switchTo(def.id);
      });

      hostEl.appendChild(tab);
      tabButtons.set(def.id, tab);
    }

    syncActiveTab();
  }

  function syncActiveTab() {
    const active = manager.getActiveMapId();
    for (const [id, btn] of tabButtons) {
      const selected = id === active;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-selected', String(selected));
    }
  }

  renderTabs();

  const priorOnSwitch = manager.onSwitch;
  manager.onSwitch = (ctx) => {
    syncActiveTab();
    priorOnSwitch?.(ctx);
  };

  return {
    refresh: renderTabs,
    syncActiveTab,
  };
}
