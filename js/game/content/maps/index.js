import { sandboxMap } from './sandbox.js';
import { shaftMap } from './shaft.js';
import { workshopMap } from './workshop.js';

/** Demo game maps — not part of the core library SDK. */
export const BUILTIN_MAPS = [sandboxMap, shaftMap, workshopMap];

export { sandboxMap, bootstrapSandbox } from './sandbox.js';
export { shaftMap, bootstrapShaft } from './shaft.js';
export { workshopMap, bootstrapWorkshop } from './workshop.js';
