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

let world;
let ui;
let mapManager;
let backpackUi;
let jarUi;
let mapHud;
let gems;
let birds;
let host;

function syncSessionUi() {
  backpackUi?.refresh();
  jarUi?.refresh();
  mapHud?.refresh();
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
    onSwitch: syncSessionUi,
  });

  mountMapTabs(mapManager, document.getElementById('map-tabs'));
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

  mapManager.init('sandbox');

  gems = installGemSystem(host.overlay, world, host.viewport, {
    onCollected() {
      syncSessionUi();
    },
  });

  birds = installBirdSystem(host.overlay, world, { spawnDemo: false });
  mountBirdsPanel(world);

  mapHud = mountMapHud({
    world,
    mapManager,
    hostEl: document.getElementById('map-hud'),
  });

  bindKeyboard(world, {
    onPauseChange(paused) {
      ui?.setPaused(paused);
    },
    onReset() {
      mapManager.resetActiveMap();
      syncSessionUi();
    },
  });

  host.start(() => {
    if (!world.paused) {
      runRules(world);
      gems?.tick();
      birds?.tick();
    }
    host.renderFrame(() => {
      gems?.render();
      birds?.render();
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
