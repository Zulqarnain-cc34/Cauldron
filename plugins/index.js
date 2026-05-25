/**
 * External plugins — not part of the core `js/` library.
 * Import and register plugins here; sketch.js loads this file at startup.
 */
import { registerPlugin } from '../js/plugins/host.js';
import { grenadePlugin } from './grenade/index.js';

registerPlugin(grenadePlugin);
