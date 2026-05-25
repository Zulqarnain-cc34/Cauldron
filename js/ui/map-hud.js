import { getMapDefinition, computeMapGoalProgress } from '../cauldron/game.js';

/**
 * Map context HUD — active level name, objective, gem progress.
 * @param {{ world: import('../world.js').World, mapManager: import('../game/maps/manager.js').MapManager, hostEl: HTMLElement | null }} opts
 */
export function mountMapHud({ world, mapManager, hostEl }) {
  if (!hostEl) return null;

  hostEl.classList.add('map-hud');
  hostEl.setAttribute('aria-label', 'Active map');

  function render() {
    const mapId = mapManager.getActiveMapId();
    const def = mapId ? getMapDefinition(mapId) : null;

    if (!def) {
      hostEl.innerHTML = '';
      hostEl.hidden = true;
      return;
    }

    hostEl.hidden = false;
    const progress = computeMapGoalProgress(world, def);

    hostEl.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'map-hud-inner';

    const name = document.createElement('span');
    name.className = 'map-hud-name';
    name.textContent = progress.mapLabel;

    const desc = document.createElement('span');
    desc.className = 'map-hud-desc';
    desc.textContent = progress.mapDescription;

    inner.append(name);
    if (progress.mapDescription) inner.append(desc);

    if (progress.gems?.length) {
      for (const gem of progress.gems) {
        const goal = document.createElement('span');
        goal.className = 'map-hud-goal';
        goal.classList.toggle('map-hud-goal--complete', gem.complete);

        if (gem.icon) {
          const icon = document.createElement('img');
          icon.className = 'map-hud-gem-icon';
          icon.src = gem.icon;
          icon.alt = '';
          icon.width = 16;
          icon.height = 16;
          goal.append(icon);
        }

        const text = document.createElement('span');
        text.className = 'map-hud-gem-text';
        if (gem.complete) {
          text.textContent = `${gem.label} — complete`;
        } else {
          text.textContent = `${gem.label} `;
          const strong = document.createElement('strong');
          strong.textContent = String(gem.collected);
          text.append(strong, document.createTextNode(` / ${gem.target}`));
        }
        goal.append(text);
        inner.append(goal);
      }
    }

    if (progress.allComplete) {
      const badge = document.createElement('span');
      badge.className = 'map-hud-complete';
      badge.textContent = 'Level complete';
      inner.append(badge);
    }

    hostEl.append(inner);
  }

  render();

  const priorOnSwitch = mapManager.onSwitch;
  mapManager.onSwitch = (ctx) => {
    render();
    priorOnSwitch?.(ctx);
  };

  return { refresh: render };
}
