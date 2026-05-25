import { getAllMapDefinitions } from '../cauldron/game.js';

/**
 * Map tab bar — switch between registered map units (separate sessions).
 * @param {import('../game/maps/manager.js').MapManager} manager
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

    const defs = getAllMapDefinitions();
    defs.forEach((def, index) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'map-tab';
      tab.dataset.mapId = def.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      const shortcut = index < 9 ? ` (${index + 1})` : '';
      tab.title = `${def.description ?? def.label}${shortcut}`;
      tab.textContent = def.label;

      tab.addEventListener('click', () => {
        if (manager.getActiveMapId() === def.id) return;
        manager.switchTo(def.id);
      });

      hostEl.appendChild(tab);
      tabButtons.set(def.id, tab);
    });

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
      const idx = Number(e.key) - 1;
      if (idx < 0 || idx >= getAllMapDefinitions().length) return;
      const def = getAllMapDefinitions()[idx];
      if (manager.getActiveMapId() === def.id) return;
      e.preventDefault();
      manager.switchTo(def.id);
    });
  }

  renderTabs();
  bindTabKeyboard();

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
