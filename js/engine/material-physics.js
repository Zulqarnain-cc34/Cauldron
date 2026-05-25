import { Mobility } from '../catalog/physics.js';
import {
  tryMoveDown,
  tryMoveUp,
  tryDiagRandom,
  trySwapWithDenserBelow,
  trySpreadHorizontal,
} from './primitives.js';

/**
 * Compile one update() from catalog physics profile.
 * Same function body is shared by every material with the same mobility class.
 *
 * @param {import('../catalog/materials.js').MaterialDef} material
 * @returns {(cell: object, api: import('./cell-api.js').CellApi) => void}
 */
export function compilePhysicsUpdate(material) {
  const mobility = material.mobility ?? Mobility.STATIC;

  switch (mobility) {
    case Mobility.STATIC:
      return () => {};

    case Mobility.GRANULAR:
      return function updateGranular(cell, api) {
        if (tryMoveDown(cell, api)) return;
        if (material.sinkThroughLighter && trySwapWithDenserBelow(cell, api)) return;
        tryDiagRandom(cell, api, 1);
      };

    case Mobility.FLUID:
      return function updateFluid(cell, api) {
        if (tryMoveDown(cell, api)) return;
        if (trySwapWithDenserBelow(cell, api)) return;
        const block = material.spreadBlockSame ? cell.species : null;
        trySpreadHorizontal(cell, api, block);
      };

    case Mobility.BUOYANT:
      return function updateBuoyant(cell, api) {
        if (tryMoveUp(cell, api)) return;
        if (tryDiagRandom(cell, api, -1)) return;

        const condenseAt = material.condenseAt ?? 10;
        const decay = material.thermalDecay ?? 1;
        const ra = cell.ra;

        if (ra <= condenseAt && api.randInt(100) > 70) {
          api.clearSelf();
          return;
        }
        if (ra > 0) {
          api.set(0, 0, { ...cell, ra: ra - decay });
        }
      };

    case Mobility.PLASMA:
    case Mobility.LIFE:
      return () => {};

    default:
      return () => {};
  }
}
