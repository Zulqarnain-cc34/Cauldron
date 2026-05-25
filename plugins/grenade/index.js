import {
  applyGrenadeBlast,
  drainGrenadeBlastQueue,
  queueGrenadeBlast,
  tickGrenadeAgents,
  throwGrenade,
} from './blast.js';
import { renderFragments, renderGrenades } from './render.js';
import { Species, CELL_PX } from '../../js/cauldron/plugin.js';

const PLUGIN_ID = 'grenade';
const RULE_ID = 'grenade-blast';

/** @type {import('../../js/cauldron/plugin.js').Plugin} */
export const grenadePlugin = {
  id: PLUGIN_ID,
  suiteLabel: 'Grenade',

  doc: {
    summary:
      'Throwable fragmentation grenade — arcs with gravity, detonates on impact, spawns fire core + radial shrapnel.',
    controls: ['G — throw', 'Middle-click — throw at cursor'],
  },

  setup(ctx) {
    const { world, canvas, registerRule, registerToggle, registerRender, onReset } = ctx;

    registerToggle({
      key: 'grenade',
      id: RULE_ID,
      label: 'Grenade blast',
      group: 'plugin',
      defaultEnabled: true,
    });

    registerRule('agents', {
      id: 'grenade-agents',
      enabled: (w) => w.ruleEnabled.grenade ?? true,
      run: tickGrenadeAgents,
    });

    registerRule('forces', {
      id: RULE_ID,
      enabled: (w) => w.ruleEnabled.grenade ?? true,
      run: drainGrenadeBlastQueue,
    });

    registerRender((p, w) => {
      renderGrenades(p, w);
      renderFragments(p, w);
    });

    let mouseGx = Math.floor(world.width / 2);
    let mouseGy = Math.floor(world.height / 3);

    const syncMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const gx = Math.floor(mx / CELL_PX);
      const gy = Math.floor(my / CELL_PX);
      if (world.inBounds(gx, gy)) {
        mouseGx = gx;
        mouseGy = gy;
      }
    };

    canvas.addEventListener('mousemove', syncMouse);

    const throwFromHand = () => {
      if (!(world.ruleEnabled.grenade ?? true)) return;
      const handX = mouseGx;
      const handY = Math.max(0, mouseGy - 8);
      throwGrenade(world, handX, handY, mouseGx, mouseGy);
    };

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        throwFromHand();
      }
    });

    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.code === 'KeyG' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          throwFromHand();
        }
      });
    }

    onReset((w) => {
      if (w.plugin?.grenade?.blastQueue) w.plugin.grenade.blastQueue.length = 0;
      if (w.plugin?.grenade?.fragments) w.plugin.grenade.fragments.length = 0;
      for (let i = w.agents.length - 1; i >= 0; i--) {
        if (w.agents[i].type === 'grenade') w.agents.splice(i, 1);
      }
    });
  },

  behaviors: [
    {
      id: 'grenade-ignites-organic',
      name: 'Blast ignites organic at center',
      description: 'Radial blast converts plant matter to fire.',
      slice: { rows: ['.....', '.....', '..O..', '.....', '.....'] },
      expect: ['.....', '.....', '..F..', '.....', '.....'],
      scope: { rules: [RULE_ID] },
      steps: 1,
      setup(w) {
        w.seed = 42;
        queueGrenadeBlast(w, 2, 2, { radius: 1, power: 1 });
      },
    },
    {
      id: 'grenade-spares-stone',
      name: 'Blast does not destroy stone',
      description: 'Stone cells survive the detonation.',
      slice: { rows: ['.....', '.....', '..T..', '.....', '.....'] },
      expect: ['.....', '.....', '..T..', '.....', '.....'],
      scope: { rules: [RULE_ID] },
      steps: 1,
      setup(w) {
        w.seed = 42;
        queueGrenadeBlast(w, 2, 2, { radius: 1, power: 1, fragments: false });
      },
    },
    {
      id: 'grenade-direct-apply',
      name: 'Direct blast clears center to fire',
      description: 'applyGrenadeBlast on sand spawns fire at the impact cell.',
      slice: { rows: ['...', '.S.', '...'] },
      expect: ['...', '.F.', '...'],
      scope: { rules: [] },
      steps: 0,
      setup(w) {
        w.seed = 99;
        applyGrenadeBlast(w, 1, 1, { radius: 0.45, power: 1.2, fragments: false });
      },
    },
  ],
};
