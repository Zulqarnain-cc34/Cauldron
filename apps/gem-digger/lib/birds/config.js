/**
 * Live-tweakable bird / flock / wind settings (game UI reads & writes this).
 */

/** @typedef {typeof DEFAULT_BIRD_SIM_CONFIG} BirdSimConfig */

export const DEFAULT_BIRD_SIM_CONFIG = {
  flock: {
    perception: 38,
    separationRadius: 14,
    minFlockSize: 3,
    weightSep: 1.9,
    weightAli: 0.72,
    weightCoh: 0.42,
    cohesionSpeed: 0.55,
  },
  wind: {
    noiseScale: 0.014,
    timeScale: 0.011,
    speedFactor: 0.72,
    steerWeight: 1.35,
    gustMin: 0.52,
  },
  motion: {
    minSpeedRatio: 0.42,
  },
  display: {
    showWindField: true,
    windParticleCount: 160,
    windStreakLength: 20,
    windOpacity: 32,
    windDriftSpeed: 0.9,
  },
};

/** @type {BirdSimConfig} */
export const birdSimConfig = structuredClone(DEFAULT_BIRD_SIM_CONFIG);

/** @type {Record<string, Partial<BirdSimConfig>>} */
export const BIRD_SIM_PRESETS = {
  default: {},
  tightFlocks: {
    flock: {
      weightCoh: 0.72,
      weightSep: 1.35,
      weightAli: 0.88,
      perception: 32,
      separationRadius: 11,
      cohesionSpeed: 0.48,
    },
    wind: { speedFactor: 0.62, steerWeight: 1.15 },
  },
  looseScatter: {
    flock: {
      weightCoh: 0.22,
      weightSep: 2.4,
      weightAli: 0.45,
      perception: 48,
      separationRadius: 18,
    },
    wind: { speedFactor: 0.85, steerWeight: 1.65, noiseScale: 0.018 },
  },
  strongWind: {
    wind: {
      noiseScale: 0.02,
      timeScale: 0.016,
      speedFactor: 0.88,
      steerWeight: 1.85,
      gustMin: 0.58,
    },
    flock: { weightCoh: 0.3, weightAli: 0.55, weightSep: 2.1 },
    display: { windDriftSpeed: 1.25, windOpacity: 40 },
  },
  calm: {
    wind: {
      noiseScale: 0.01,
      timeScale: 0.006,
      speedFactor: 0.5,
      steerWeight: 0.95,
      gustMin: 0.4,
    },
    flock: { weightCoh: 0.55, weightSep: 1.6, weightAli: 0.6 },
    display: { windParticleCount: 100, windOpacity: 22, windDriftSpeed: 0.55 },
  },
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
  if (patch.motion) Object.assign(base.motion, patch.motion);
  if (patch.display) Object.assign(base.display, patch.display);

  Object.assign(birdSimConfig.flock, base.flock);
  Object.assign(birdSimConfig.wind, base.wind);
  Object.assign(birdSimConfig.motion, base.motion);
  Object.assign(birdSimConfig.display, base.display);
  return birdSimConfig;
}

/** Reset all fields to defaults. */
export function resetBirdSimConfig() {
  return applyBirdSimPreset('default');
}
