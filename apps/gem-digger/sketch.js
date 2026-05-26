/**
 * Gem Digger — demo game host (p5).
 * Library: ../../js/cauldron/  |  Game kit: ./lib/
 */
import {
  World,
  GRID_W,
  GRID_H,
  runRules,
  renderPlugins,
  renderWorld,
  canvasSize,
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
  BUILTIN_MAPS,
  blankMap,
} from './lib/index.js';

let world;
let ui;
let mapManager;
let backpackUi;
let jarUi;
let mapHud;
let gems;

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

new window.p5((p) => {
  p.setup = async () => {
    registerMapDefinitions(BUILTIN_MAPS);
    registerMapDefinition(blankMap);

    world = new World(GRID_W, GRID_H, Date.now() & 0xffffffff);
    const { width, height } = canvasSize(world);
    const canvas = p.createCanvas(width, height);
    canvas.parent('sim-host');

    setupInput(world, canvas.elt);
    await bootstrapSandbox({ world, canvas: canvas.elt });

    gems = installGemSystem(p, world, canvas.elt, {
      onCollected() {
        syncSessionUi();
      },
    });

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
  };

  p.draw = () => {
    if (!world.paused) {
      runRules(world);
      gems?.tick();
    }
    renderWorld(p, world);
    renderPlugins(p, world);
    gems?.render();
    ui?.setTick(world.tick);
  };
});
