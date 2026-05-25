import { World, GRID_W, GRID_H, Species, runRules, renderPlugins } from './js/cauldron/app.js';
import { bootstrapSandbox } from './js/cauldron/bootstrap.js';
import { renderWorld, canvasSize } from './js/render.js';
import { setupInput } from './js/input.js';
import { mountPanel, bindKeyboard } from './js/ui/panel.js';
import { mountBackpack } from './js/ui/backpack.js';
import { mountJar } from './js/ui/jar.js';

let world;
let ui;

function seedDemo(w) {
  for (let x = 40; x < 240; x++) {
    w.set(x, w.height - 1, {
      species: Species.WALL,
      flags: 0,
      ra: 0,
      rb: 0,
    });
  }
  for (let i = 0; i < 400; i++) {
    const x = 80 + w.randInt(120);
    const y = 20 + w.randInt(60);
    w.set(x, y, {
      species: Species.SAND,
      flags: 0,
      ra: w.randInt(255),
      rb: 0,
    });
  }
}

new window.p5((p) => {
  p.setup = async () => {
    world = new World(GRID_W, GRID_H, Date.now() & 0xffffffff);
    const { width, height } = canvasSize(world);
    const canvas = p.createCanvas(width, height);
    canvas.parent('sim-host');

    setupInput(world, canvas.elt);
    await bootstrapSandbox({ world, canvas: canvas.elt });
    mountBackpack(world);
    mountJar(world);
    ui = mountPanel(world, {
      onPauseChange(paused) {
        ui?.setPaused(paused);
      },
      onStep() {
        runRules(world);
        ui?.setTick(world.tick);
      },
      onReset() {
        ui?.setTick(world.tick);
      },
    });
    ui.setPaused(false);

    bindKeyboard(world, {
      onPauseChange(paused) {
        ui?.setPaused(paused);
      },
      onReset() {
        ui?.setTick(world.tick);
      },
    });

    seedDemo(world);
  };

  p.draw = () => {
    if (!world.paused) {
      runRules(world);
    }
    renderWorld(p, world);
    renderPlugins(p, world);
    ui?.setTick(world.tick);
  };
});
