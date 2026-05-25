/**
 * L3 Reaction registry — register adjacency chemistry without editing god-files.
 * @module sim/reaction-store
 */

/** @typedef {{ a: number, b: number, result: number, clearA?: boolean, at?: 'a'|'b', priority?: number, id?: string }} ReactionDef */

/** @type {ReactionDef[]} */
const reactions = [];

/** @type {Set<string>} */
const reactionIds = new Set();

/**
 * Register an adjacency reaction (a + b → result at cell `at`).
 * @param {ReactionDef} rxn
 */
export function registerReaction(rxn) {
  if (rxn.id) {
    if (reactionIds.has(rxn.id)) return;
    reactionIds.add(rxn.id);
  }
  reactions.push({ at: 'b', clearA: false, priority: 0, ...rxn });
  reactions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/** @returns {readonly ReactionDef[]} */
export function getRegisteredReactions() {
  return reactions;
}

/** @param {import('../world.js').World} world */
export function applyRegisteredReactions(world) {
  const { width, height } = world;

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const cell = world.get(x, y);
      if (cell.species === 0) continue;

      for (const rxn of reactions) {
        if (cell.species !== rxn.a) continue;

        for (const [dx, dy] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const n = world.get(x + dx, y + dy);
          if (n.species !== rxn.b) continue;

          const tx = rxn.at === 'b' ? x + dx : x;
          const ty = rxn.at === 'b' ? y + dy : y;
          world.set(tx, ty, {
            species: rxn.result,
            flags: 0,
            ra: world.randInt(255),
            rb: 0,
          });
          if (rxn.clearA) world.set(x, y, world.emptyCell());
          break;
        }
      }
    }
  }
}
