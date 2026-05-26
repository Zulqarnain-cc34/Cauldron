import {
  BIRD_SIM_CONFIG_VERSION,
  DEFAULT_BIRD_SIM_CONFIG,
  applyBirdSimConfig,
  cloneBirdSimConfig,
} from './config.js';
import { getMapDefinition } from '../maps/registry.js';

const BIRD_CONFIG_KEY = 'birdSimConfig';
const BIRD_CONFIG_VERSION_KEY = 'birdSimConfigVersion';

/** Tutorial template id (has {@link MapDefinition.birds}). */
export const BIRDS_MAP_DEF_ID = 'sandbox';

/** @param {string | undefined} defId */
export function isBirdsMapDefId(defId) {
  return getMapDefinition(defId)?.birds === true;
}

/**
 * @param {import('../maps/session.js').MapSession | undefined} session
 * @param {string} [defId] map template id
 */
export function restoreBirdSimConfigForSession(session, defId) {
  if (!isBirdsMapDefId(defId)) return;

  const stored = session?.custom?.[BIRD_CONFIG_KEY];
  const version = session?.custom?.[BIRD_CONFIG_VERSION_KEY];
  if (
    version === BIRD_SIM_CONFIG_VERSION &&
    stored &&
    typeof stored === 'object'
  ) {
    applyBirdSimConfig(/** @type {import('./config.js').BirdSimConfig} */ (stored));
    return;
  }

  applyBirdSimConfig(structuredClone(DEFAULT_BIRD_SIM_CONFIG));
  if (session) stashBirdSimConfigOnSession(session);
}

/**
 * @param {import('../maps/session.js').MapSession} session
 */
export function stashBirdSimConfigOnSession(session) {
  if (!session.custom || typeof session.custom !== 'object') {
    session.custom = {};
  }
  session.custom[BIRD_CONFIG_VERSION_KEY] = BIRD_SIM_CONFIG_VERSION;
  session.custom[BIRD_CONFIG_KEY] = cloneBirdSimConfig();
}
