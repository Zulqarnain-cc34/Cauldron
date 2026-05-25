import {
  World,
  GRID_W,
  GRID_H,
  runRules,
  renderPlugins,
  renderWorld,
  canvasSize,
} from './js/cauldron/app.js';
import { bootstrapSandbox } from './js/cauldron/bootstrap.js';
import { setupInput } from './js/input.js';
import { mountPanel, bindKeyboard } from './js/ui/panel.js';
import { mountBackpack } from './js/ui/backpack.js';
import { mountJar } from './js/ui/jar.js';
import { mountMapTabs } from './js/ui/map-tabs.js';
import {
  registerMapDefinitions,
  createMapManager,
  BUILTIN_MAPS,
  installGemSystem,
} from './js/cauldron/game.js';

let world;
let ui;
let mapManager;
let backpackUi;
let jarUi;
let gems;

function syncSessionUi() {
  backpackUi?.refresh();
  jarUi?.refresh();
  ui?.setTick(world.tick);
  ui?.setPaused(world.paused);
  ui?.syncRules?.();
  ui?.syncBrush?.();
  ui?.syncBrushRadius?.();
}

new window.p5((p) => {
  p.setup = async () => {
    registerMapDefinitions(BUILTIN_MAPS);

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

    bindKeyboard(world, {
      onPauseChange(paused) {
        ui?.setPaused(paused);
      },
      onReset() {
        mapManager.resetActiveMap();
        syncSessionUi();
      },
    });

    mapManager.init('sandbox');
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
