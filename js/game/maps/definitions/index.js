import { sandboxMap } from './sandbox.js';
import { shaftMap } from './shaft.js';
import { workshopMap } from './workshop.js';

/** Built-in map units shipped with Cauldron. */
export const BUILTIN_MAPS = [sandboxMap, shaftMap, workshopMap];

export { sandboxMap, bootstrapSandbox } from './sandbox.js';
export { shaftMap, bootstrapShaft } from './shaft.js';
export { workshopMap, bootstrapWorkshop } from './workshop.js';
