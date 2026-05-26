/**
 * Gem Digger — demo game host (WebGL + Canvas2D overlay).
 * Library: ../../js/cauldron/  |  Game kit: ./lib/
 */
import {
  World,
  GRID_W,
  GRID_H,
  runRules,
  createSimHost,
} from '../../js/cauldron/app.js';
import { bootstrapSandbox } from '../../js/cauldron/bootstrap.js';
import { setupInput } from '../../js/input.js';
import { mountPanel, bindKeyboard } from './ui/panel.js';
import { mountBackpack } from './ui/backpack.js';
import { mountJar } from './ui/jar.js';
import { mountMapTabs } from './ui/map-tabs.js';
import { mountMapHud } from './ui/map-hud.js';
import {
  registerMapDefinitions,
  registerMapDefinition,
  createMapManager,
  installGemSystem,
  installBirdSystem,
  BUILTIN_MAPS,
  blankMap,
} from './lib/index.js';
import { mountBirdsPanel } from './ui/birds-panel.js';
import {
  loadMapManagerState,
  saveMapManagerState,
} from './lib/maps/persistence.js';
import {
  isBirdsMapDefId,
  restoreBirdSimConfigForSession,
  stashBirdSimConfigOnSession,
} from './lib/birds/map-config.js';

let world;
let ui;
let mapManager;
let backpackUi;
let jarUi;
let mapHud;
let mapTabsUi;
let gems;
let birds;
let birdsPanel;
let host;

/** @type {ReturnType<typeof setTimeout> | null} */
let persistTimer = null;

function schedulePersistMaps() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistMapsNow();
  }, 350);
}

function isActiveBirdsMap() {
  return isBirdsMapDefId(mapManager?.getActiveTab()?.defId);
}

function persistMapsNow() {
  if (!mapManager) return;
  const tab = mapManager.getActiveTab();
  const tabId = mapManager.getActiveTabId();
  if (tabId) {
    mapManager.persistActive();
    if (isBirdsMapDefId(tab?.defId)) {
      const session = mapManager.getSession(tabId);
      if (session) stashBirdSimConfigOnSession(session);
    }
  }
  saveMapManagerState(mapManager);
}

function stashBirdConfigForTab(tabId) {
  const tab = mapManager?.getOpenTabs().find((t) => t.instanceId === tabId);
  if (!isBirdsMapDefId(tab?.defId)) return;
  const session = mapManager?.getSession(tabId);
  if (session) stashBirdSimConfigOnSession(session);
}

function syncBirdsUiForActiveMap() {
  const show = isActiveBirdsMap();
  birdsPanel?.setVisible(show);
  if (show) {
    const tab = mapManager?.getActiveTab();
    const session = tab ? mapManager.getSession(tab.instanceId) : undefined;
    restoreBirdSimConfigForSession(session, tab?.defId);
    birdsPanel?.syncFromConfig();
  }
}

function onMapSwitch(ctx) {
  if (ctx.previousMapId) {
    stashBirdConfigForTab(ctx.previousMapId);
  }
  syncBirdsUiForActiveMap();
  syncSessionUi();
  schedulePersistMaps();
}

function syncSessionUi() {
  backpackUi?.refresh();
  jarUi?.refresh();
  mapHud?.refresh();
  mapTabsUi?.refresh?.();
  ui?.setTick(world.tick);
  ui?.setPaused(world.paused);
  ui?.syncRules?.();
  ui?.syncBrush?.();
  ui?.syncBrushRadius?.();
}

async function init() {
  registerMapDefinitions(BUILTIN_MAPS);
  registerMapDefinition(blankMap);

  world = new World(GRID_W, GRID_H, Date.now() & 0xffffffff);

  const parent = document.getElementById('sim-host');
  if (!parent) throw new Error('#sim-host not found');

  host = createSimHost(parent, world);
  host.syncCanvasSize();

  setupInput(world, host.viewport);
  await bootstrapSandbox({ world, canvas: host.viewport });

  mapManager = createMapManager({
    world,
    initialMapId: 'sandbox',
    onSwitch: onMapSwitch,
  });

  mapTabsUi = mountMapTabs(mapManager, document.getElementById('map-tabs'), {
    onRenamed: () => {
      mapHud?.refresh();
      schedulePersistMaps();
    },
    onActiveTabChange: () => syncBirdsUiForActiveMap(),
  });
  backpackUi = mountBackpack(world);
  jarUi = mountJar(world);

  ui = mountPanel(world, {
    onPauseChange(paused) {
      ui?.setPaused(paused);
    },
    onStep() {
      runRules(world);
      ui?.setTick(world.tick);
    },
    onReset() {
      mapManager.resetActiveMap();
      syncSessionUi();
    },
  });
  ui.setPaused(false);

  const savedMaps = loadMapManagerState();
  if (savedMaps) {
    mapManager.initFromSaved(savedMaps);
  } else {
    mapManager.init('sandbox');
  }

  gems = installGemSystem(host.overlay, world, host.viewport, {
    onCollected() {
      syncSessionUi();
    },
  });

  birds = installBirdSystem(host.overlay, world, { spawnDemo: false });
  birdsPanel = mountBirdsPanel(world, {
    onConfigChange: schedulePersistMaps,
    onRespawn: schedulePersistMaps,
  });
  syncBirdsUiForActiveMap();

  mapHud = mountMapHud({
    world,
    mapManager,
    hostEl: document.getElementById('map-hud'),
  });

  syncBirdsUiForActiveMap();

  bindKeyboard(world, {
    onPauseChange(paused) {
      ui?.setPaused(paused);
    },
    onReset() {
      mapManager.resetActiveMap();
      syncSessionUi();
    },
  });

  window.addEventListener('beforeunload', persistMapsNow);

  host.start(() => {
    if (!world.paused) {
      runRules(world);
      gems?.tick();
      if (isActiveBirdsMap()) birds?.tick();
    }
    host.renderFrame(() => {
      gems?.render();
      if (isActiveBirdsMap()) birds?.render();
    });
    ui?.setTick(world.tick);
  });
}

init().catch((err) => {
  console.error(err);
  const parent = document.getElementById('sim-host');
  if (parent) {
    parent.textContent = `Failed to start: ${err.message}`;
  }
});
