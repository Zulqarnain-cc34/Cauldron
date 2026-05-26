/**
 * Live-tweakable bird / flock / wind settings (game UI reads & writes this).
 */

/** @typedef {typeof DEFAULT_BIRD_SIM_CONFIG} BirdSimConfig */

/** Bump when DEFAULT_BIRD_SIM_CONFIG changes so saved maps pick up new defaults. */
export const BIRD_SIM_CONFIG_VERSION = 2;

export const DEFAULT_BIRD_SIM_CONFIG = {
  flock: {
    /** User-tuned defaults (topological flock). */
    interactionMode: 'topological',
    topologicalNeighbors: 20,
    perception: 59,
    separationRadius: 15,
    alignmentRadius: 59,
    cohesionRadius: 26,
    minFlockSize: 2,
    weightSep: 3.3,
    weightAli: 0.4,
    weightCoh: 1.2,
    cohesionSpeed: 0.6,
    cohesionNeighbors: 5,
    visionFovDeg: 110,
    wanderWeight: 0.1,
  },
  wind: {
    /** When false, birds ignore wind forces (flocking only). Viz streaks still optional. */
    enabled: false,
    noiseScale: 0.009,
    timeScale: 0.008,
    speedFactor: 0.4,
    steerWeight: 0.45,
    gustMin: 0.2,
  },
  spawn: {
    flockCount: 3,
    birdsPerFlock: 30,
  },
  motion: {
    simSpeed: 20,
    minSpeedRatio: 0.15,
  },
  display: {
    showWindField: false,
    showDiagnostics: false,
    showVisionDebug: false,
    /** When many birds, draw cones for a spaced sample only. */
    visionDebugAll: false,
    windParticleCount: 35,
    windStreakLength: 18,
    windOpacity: 24,
    windDriftSpeed: 0.65,
  },
};

/** @type {BirdSimConfig} */
export const birdSimConfig = structuredClone(DEFAULT_BIRD_SIM_CONFIG);

/** Human-readable preset names for the UI. */
export const BIRD_PRESET_LABELS = {
  default: 'Default flock',
};

/** @type {Record<string, Partial<BirdSimConfig>>} */
export const BIRD_SIM_PRESETS = {
  default: {},
};

/**
 * @param {string} presetId
 */
export function applyBirdSimPreset(presetId) {
  const base = structuredClone(DEFAULT_BIRD_SIM_CONFIG);
  const patch = BIRD_SIM_PRESETS[presetId];
  if (!patch) return birdSimConfig;

  if (patch.flock) Object.assign(base.flock, patch.flock);
  if (patch.wind) Object.assign(base.wind, patch.wind);
  if (patch.spawn) Object.assign(base.spawn, patch.spawn);
  if (patch.motion) Object.assign(base.motion, patch.motion);
  if (patch.display) Object.assign(base.display, patch.display);

  Object.assign(birdSimConfig.flock, base.flock);
  Object.assign(birdSimConfig.wind, base.wind);
  Object.assign(birdSimConfig.spawn, base.spawn);
  Object.assign(birdSimConfig.motion, base.motion);
  Object.assign(birdSimConfig.display, base.display);
  return birdSimConfig;
}

/** Reset all fields to defaults. */
export function resetBirdSimConfig() {
  return applyBirdSimPreset('default');
}

const CONFIG_EXPORT_VERSION = 1;

/**
 * Deep-merge a partial config onto DEFAULT shape and apply to live birdSimConfig.
 * @param {Partial<BirdSimConfig>} partial
 */
export function applyBirdSimConfig(partial) {
  const base = structuredClone(DEFAULT_BIRD_SIM_CONFIG);
  if (partial.flock) Object.assign(base.flock, partial.flock);
  if (partial.wind) Object.assign(base.wind, partial.wind);
  if (partial.spawn) Object.assign(base.spawn, partial.spawn);
  if (partial.motion) Object.assign(base.motion, partial.motion);
  if (partial.display) Object.assign(base.display, partial.display);

  Object.assign(birdSimConfig.flock, base.flock);
  Object.assign(birdSimConfig.wind, base.wind);
  Object.assign(birdSimConfig.spawn, base.spawn);
  Object.assign(birdSimConfig.motion, base.motion);
  Object.assign(birdSimConfig.display, base.display);
  return birdSimConfig;
}

/** @returns {BirdSimConfig} */
export function cloneBirdSimConfig() {
  return structuredClone(birdSimConfig);
}

/**
 * @param {string} [name]
 */
export function exportBirdSimConfigJson(name = 'custom') {
  return JSON.stringify(
    {
      version: CONFIG_EXPORT_VERSION,
      name,
      exportedAt: new Date().toISOString(),
      config: cloneBirdSimConfig(),
    },
    null,
    2
  );
}

/**
 * @param {string} json
 * @returns {{ ok: boolean, name?: string, error?: string }}
 */
export function importBirdSimConfigJson(json) {
  try {
    const data = JSON.parse(json);
    const cfg = data?.config ?? data;
    if (!cfg || typeof cfg !== 'object') {
      return { ok: false, error: 'Missing config object' };
    }
    const required = ['flock', 'wind', 'spawn', 'motion', 'display'];
    for (const key of required) {
      if (!cfg[key] || typeof cfg[key] !== 'object') {
        return { ok: false, error: `Missing section: ${key}` };
      }
    }
    applyBirdSimConfig(cfg);
    const name = typeof data.name === 'string' ? data.name : 'imported';
    return { ok: true, name };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
