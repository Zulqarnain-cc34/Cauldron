import { bootstrapSandbox } from '../../../js/cauldron/bootstrap.js';
import { World } from '../../../js/world.js';
import { getAllBehaviors } from '../../../js/cauldron/tooling.js';
import { prepareScenario, stepScenario } from '../../tests/helpers/harness.js';
import { asciiFromWorld, rowsEqual } from '../../tests/helpers/grid.js';
import { Species } from '../../../js/catalog/species.js';

let booted = false;

export async function ensureTestBootstrap() {
  if (booted) return;
  await bootstrapSandbox({
    world: new World(8, 8),
    canvas: { addEventListener() {} },
  });
  booted = true;
}

/** @param {import('../../../js/world.js').World} world */
export function worldDigest(world) {
  const rows = asciiFromWorld(world);
  const rb = [];
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const cell = world.get(x, y);
      if (cell.species === Species.EMPTY) continue;
      rb.push(`${x},${y}:${cell.rb}`);
    }
  }
  rb.sort();
  return { rows, rb: rb.join('|') };
}

/** Run every registered behavior and capture deterministic outcomes. */
export async function collectBehaviorSnapshots() {
  await ensureTestBootstrap();
  /** @type {Record<string, object>} */
  const snapshots = {};

  for (const behavior of getAllBehaviors()) {
    const id = behavior.id ?? `${behavior.suite}-${behavior.name}`;
    const rows = behavior.slice?.rows ?? behavior.rows ?? [];
    const expect = behavior.expect ?? [];
    const scope = behavior.scope ?? { rules: [behavior.suite] };

    try {
      const prep = prepareScenario(behavior);
      const steps = behavior.steps ?? 1;
      for (let i = 0; i < steps; i++) {
        stepScenario(prep.slice, prep.scope);
      }

      let inspectError = null;
      if (typeof behavior.inspect === 'function') {
        try {
          const after = asciiFromWorld(prep.slice.world);
          behavior.inspect(prep.slice.world, {
            before: prep.before,
            actual: after,
            steps,
          });
        } catch (err) {
          inspectError = err?.message ?? String(err);
        }
      }

      const after = asciiFromWorld(prep.slice.world);
      const gridPass = rowsEqual(after, expect);
      const pass = gridPass && !inspectError;
      const digest = worldDigest(prep.slice.world);

      snapshots[id] = {
        id,
        suite: behavior.suite,
        name: behavior.name,
        description: behavior.description ?? null,
        rulesEnabled: scope.rules ?? [],
        steps,
        startGrid: rows,
        expectedGrid: expect,
        actualGrid: after,
        gridChanged: rows.join('|') !== after.join('|'),
        gridMatchesExpected: gridPass,
        hasInspect: typeof behavior.inspect === 'function',
        inspectPassed: pass && typeof behavior.inspect === 'function',
        rbState: digest.rb || null,
        verdict: pass ? 'PASS' : 'FAIL',
        failure: pass ? null : (inspectError ?? 'grid mismatch'),
      };
    } catch (err) {
      snapshots[id] = {
        id,
        suite: behavior.suite,
        name: behavior.name,
        description: behavior.description ?? null,
        verdict: 'FAIL',
        failure: err.message,
      };
    }
  }

  return snapshots;
}

export function behaviorCount() {
  return getAllBehaviors().length;
}
