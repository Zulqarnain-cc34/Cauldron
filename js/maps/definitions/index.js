import { sandboxMap } from './sandbox.js';
import { workshopMap } from './workshop.js';

/** Built-in map units shipped with Cauldron. */
export const BUILTIN_MAPS = [sandboxMap, workshopMap];

export { sandboxMap, bootstrapSandbox } from './sandbox.js';
export { workshopMap, bootstrapWorkshop } from './workshop.js';
