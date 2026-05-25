/**
 * Plugin starter — copy this folder to plugins/my-name/ and register in plugins/index.js
 */
import { Species } from '../../js/cauldron/plugin.js';

const PLUGIN_ID = 'my-plugin';
const RULE_ID = 'my-plugin-effect';

/** @type {import('../../js/cauldron/plugin.js').Plugin} */
export const myPluginTemplate = {
  id: PLUGIN_ID,
  suiteLabel: 'My Plugin',

  doc: {
    summary: 'Describe what your plugin does — appears in live docs automatically.',
    controls: ['Customize keys in setup()'],
  },

  setup(ctx) {
    const { world, canvas, registerRule, registerToggle, onReset } = ctx;

    registerToggle({
      key: PLUGIN_ID,
      id: RULE_ID,
      label: 'My Plugin',
      group: 'plugin',
      defaultEnabled: true,
    });

    registerRule('forces', {
      id: RULE_ID,
      enabled: (w) => w.ruleEnabled[PLUGIN_ID] ?? true,
      run(w) {
        // Example: run queued effects each tick
        const queue = w.plugin?.[PLUGIN_ID]?.queue;
        if (!queue?.length) return;
        for (const job of queue) {
          if (w.inBounds(job.x, job.y)) {
            w.set(job.x, job.y, {
              species: Species.FIRE,
              flags: 0,
              ra: 120,
              rb: 0,
            });
          }
        }
        queue.length = 0;
      },
    });

    canvas.addEventListener('click', (e) => {
      if (e.button !== 0 || !(world.ruleEnabled[PLUGIN_ID] ?? true)) return;
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor((e.clientX - rect.left) / 2);
      const gy = Math.floor((e.clientY - rect.top) / 2);
      if (!world.inBounds(gx, gy)) return;
      if (!world.plugin) world.plugin = {};
      if (!world.plugin[PLUGIN_ID]) world.plugin[PLUGIN_ID] = { queue: [] };
      world.plugin[PLUGIN_ID].queue.push({ x: gx, y: gy });
    });

    onReset((w) => {
      if (w.plugin?.[PLUGIN_ID]?.queue) w.plugin[PLUGIN_ID].queue.length = 0;
    });
  },

  behaviors: [
    {
      id: 'my-plugin-spawns-fire',
      name: 'Queued click spawns fire',
      description: 'Template test — customize for your plugin.',
      slice: { rows: ['.', 'S'] },
      expect: ['F', 'S'],
      scope: { rules: [RULE_ID] },
      steps: 1,
      setup(w) {
        if (!w.plugin) w.plugin = {};
        w.plugin[PLUGIN_ID] = { queue: [{ x: 0, y: 0 }] };
      },
    },
  ],
};
