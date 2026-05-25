import { Species } from '../catalog/species.js';
import { isDenser } from '../catalog/materials.js';

export function isEmpty(cell) {
  return cell.species === Species.EMPTY;
}

/** @returns {boolean} moved */
export function tryMoveDown(cell, api) {
  const below = api.get(0, 1);
  if (!isEmpty(below)) return false;
  api.moveSelf(0, 1, cell);
  return true;
}

/** @returns {boolean} moved */
export function tryMoveUp(cell, api) {
  const above = api.get(0, -1);
  if (!isEmpty(above)) return false;
  api.moveSelf(0, -1, cell);
  return true;
}

/** @returns {boolean} moved */
export function tryDiagRandom(cell, api, dy = 1) {
  const dx = api.randDir();
  const diag = api.get(dx, dy);
  if (!isEmpty(diag)) return false;
  api.moveSelf(dx, dy, cell);
  return true;
}

/** @returns {boolean} moved — swap with denser material below */
export function trySwapWithDenserBelow(cell, api) {
  const below = api.get(0, 1);
  if (isEmpty(below)) return false;
  if (!isDenser(cell.species, below.species)) return false;
  api.set(0, 1, cell);
  api.set(0, 0, below);
  return true;
}

/**
 * Horizontal spread with flow memory in rb.
 * @returns {boolean} moved
 */
export function trySpreadHorizontal(cell, api, blockSpecies = null) {
  let dir = cell.rb === 0 ? api.randDir() || 1 : cell.rb === 1 ? -1 : 1;
  if (dir === 0) dir = 1;

  const side = api.get(dir, 0);
  const sideDown = api.get(dir, 1);
  const blocked = blockSpecies != null && sideDown.species === blockSpecies;
  if (isEmpty(side) && !blocked) {
    api.moveSelf(dir, 0, { ...cell, rb: dir === -1 ? 1 : 2 });
    return true;
  }

  const other = api.get(-dir, 0);
  const otherDown = api.get(-dir, 1);
  const otherBlocked = blockSpecies != null && otherDown.species === blockSpecies;
  if (isEmpty(other) && !otherBlocked) {
    api.moveSelf(-dir, 0, { ...cell, rb: -dir === -1 ? 1 : 2 });
    return true;
  }

  return false;
}

/** Compile declarative movement steps into an update function. */
export function compileMovement(movement) {
  return function updateFromMovement(cell, api) {
    for (const step of movement) {
      if (step.op === 'moveDown' && tryMoveDown(cell, api)) return;
      if (step.op === 'moveUp' && tryMoveUp(cell, api)) return;
      if (step.op === 'moveDiagRandom') {
        const dy = step.direction === 'up' ? -1 : 1;
        if (tryDiagRandom(cell, api, dy)) return;
      }
      if (step.op === 'swapDenserBelow' && trySwapWithDenserBelow(cell, api)) return;
      if (step.op === 'spreadHorizontal') {
        if (trySpreadHorizontal(cell, api, step.blockSpecies ?? null)) return;
      }
    }
  };
}
