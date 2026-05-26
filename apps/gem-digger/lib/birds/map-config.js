import {
  DEFAULT_BIRD_SIM_CONFIG,
  applyBirdSimConfig,
  cloneBirdSimConfig,
} from './config.js';

const BIRD_CONFIG_KEY = 'birdSimConfig';

/**
 * @param {import('../maps/session.js').MapSession | undefined} session
 * @param {string} [defId] map template id
 */
export function restoreBirdSimConfigForSession(session, defId) {
  const stored = session?.custom?.[BIRD_CONFIG_KEY];
  if (stored && typeof stored === 'object') {
    applyBirdSimConfig(/** @type {import('./config.js').BirdSimConfig} */ (stored));
    return;
  }
  if (defId === 'sandbox') {
    applyBirdSimConfig(structuredClone(DEFAULT_BIRD_SIM_CONFIG));
    return;
  }
  applyBirdSimConfig(structuredClone(DEFAULT_BIRD_SIM_CONFIG));
}

/**
 * @param {import('../maps/session.js').MapSession} session
 */
export function stashBirdSimConfigOnSession(session) {
  if (!session.custom || typeof session.custom !== 'object') {
    session.custom = {};
  }
  session.custom[BIRD_CONFIG_KEY] = cloneBirdSimConfig();
}
