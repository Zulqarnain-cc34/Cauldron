import { clearGemPickups, cloneGemPickups, setGemPickups } from '../gems/pickups.js';
import { createBackpackInventory } from '../inventory/backpack-inventory.js';
import { createJarInventory } from '../inventory/jar-inventory.js';

/**
 * Serializable snapshot of one map tab — grid, sim, inventories, settings.
 * @typedef {object} MapSession
 * @property {string} mapId
 * @property {string} label
 * @property {number} tick
 * @property {number} seed
 * @property {Uint8Array} cells
 * @property {object[]} agents
 * @property {boolean} paused
 * @property {{ species: number, radius: number }} brush
 * @property {Record<string, boolean>} ruleEnabled
 * @property {Record<string, unknown>} plugin
 * @property {import('../inventory/slot-inventory.js').SlotInventory} backpack
 * @property {import('../inventory/slot-inventory.js').SlotInventory} jar
 * @property {import('../gems/pickups.js').GemPickup[]} gemPickups
 * @property {Record<string, unknown>} [custom]
 */

/** @param {import('../inventory/slot-inventory.js').SlotInventory} inv */
export function cloneSlotInventory(inv) {
  return {
    cols: inv.cols,
    rows: inv.rows,
    slots: inv.slots.map((s) => (s ? { ...s } : null)),
  };
}

/** @param {import('../../world.js').World} world @param {{ mapId: string, label: string, custom?: Record<string, unknown> }} meta */
export function captureMapSession(world, meta) {
  return {
    mapId: meta.mapId,
    label: meta.label,
    tick: world.tick,
    seed: world.seed,
    cells: new Uint8Array(world.cells),
    agents: structuredClone(world.agents),
    paused: world.paused,
    brush: {
      species: world.brush.species,
      radius: world.brush.radius,
    },
    ruleEnabled: { ...world.ruleEnabled },
    plugin: structuredClone(world.plugin ?? {}),
    backpack: world.backpack
      ? cloneSlotInventory(world.backpack)
      : cloneSlotInventory({ cols: 9, rows: 3, slots: [] }),
    jar: world.jar
      ? cloneSlotInventory(world.jar)
      : cloneSlotInventory({ cols: 4, rows: 2, slots: [] }),
    gemPickups: cloneGemPickups(world),
    custom: meta.custom ? structuredClone(meta.custom) : {},
  };
}

/**
 * @param {import('../../world.js').World} world
 * @param {MapSession} session
 */
export function applyMapSession(world, session) {
  if (world.cells.length !== session.cells.length) {
    throw new Error(
      `Map session grid size mismatch (${session.cells.length} vs ${world.cells.length})`
    );
  }

  world.cells.set(session.cells);
  world.tick = session.tick;
  world.seed = session.seed;
  world.agents = structuredClone(session.agents);
  world.paused = session.paused;
  world.brush.species = session.brush.species;
  world.brush.radius = session.brush.radius;
  world.brush.queue.length = 0;
  world.ruleEnabled = { ...session.ruleEnabled };
  world.plugin = structuredClone(session.plugin ?? {});
  world.backpack = cloneSlotInventory(session.backpack);
  world.jar = cloneSlotInventory(session.jar);
  setGemPickups(world, session.gemPickups ?? []);
}

/**
 * @param {import('../../world.js').World} world
 * @param {import('./registry.js').MapDefinition} def
 */
export function createFreshMapSession(world, def) {
  world.reset();
  world.seed = def.seed ?? world.seed;
  world.paused = def.defaultPaused ?? false;

  if (def.defaultBrush) {
    if (def.defaultBrush.species != null) world.brush.species = def.defaultBrush.species;
    if (def.defaultBrush.radius != null) world.brush.radius = def.defaultBrush.radius;
  }

  if (def.defaultRules) {
    for (const [key, enabled] of Object.entries(def.defaultRules)) {
      world.ruleEnabled[key] = enabled;
    }
  }

  world.backpack = createBackpackInventory();
  world.jar = createJarInventory();
  clearGemPickups(world);

  def.bootstrap(world);

  if (def.hooks?.afterBootstrap) {
    def.hooks.afterBootstrap(world);
  }

  const session = captureMapSession(world, {
    mapId: def.id,
    label: def.label,
    custom: def.hooks?.initialCustom?.(world) ?? {},
  });

  if (def.hooks?.capture) {
    def.hooks.capture(world, session);
  }

  return session;
}

/**
 * @param {import('../../world.js').World} world
 * @param {MapSession} session
 * @param {import('./registry.js').MapDefinition} def
 */
export function applyMapSessionWithHooks(world, session, def) {
  applyMapSession(world, session);
  if (def.hooks?.apply) {
    def.hooks.apply(world, session);
  }
}
