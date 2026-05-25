/**
 * External plugins — register here. Uses public SDK only.
 */
import { registerPlugin } from '../js/cauldron/plugin.js';
import { grenadePlugin } from './grenade/index.js';

registerPlugin(grenadePlugin);
