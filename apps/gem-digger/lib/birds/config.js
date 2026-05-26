/**
 * Live-tweakable bird / flock / wind settings (game UI reads & writes this).
 */

/** @typedef {typeof DEFAULT_BIRD_SIM_CONFIG} BirdSimConfig */

export const DEFAULT_BIRD_SIM_CONFIG = {
  flock: {
    /** Metric neighbours — tuned for Vicsek φ ≥ ~85% (single flock, headless sweep). */
    interactionMode: 'topological',
    topologicalNeighbors: 7,
    perception: 50,
    separationRadius: 28,
    minFlockSize: 2,
    weightSep: 3.2,
    /** Heading match with birds in front — not position pull. */
    weightAli: 0.32,
    /** Off by default (position pull causes ring/orbit). Raise in UI if needed. */
    weightCoh: 0,
    cohesionSpeed: 0.15,
    cohesionNeighbors: 4,
    visionFovDeg: 100,
    /** Organic motion — breaks robot lock-step. */
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
    /** One flock keeps global φ high; multiple flocks move in different directions. */
    flockCount: 1,
    birdsPerFlock: 22,
  },
  motion: {
    simSpeed: 1,
    minSpeedRatio: 0.15,
  },
  display: {
    showWindField: false,
    showDiagnostics: false,
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
  default: 'Natural flock (vision)',
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
