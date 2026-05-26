/**
 * Live-tweakable bird / flock / wind settings (game UI reads & writes this).
 *
 * Tuning goal: turbulent wind drives motion; flocking groups birds without overlap.
 * Rule of thumb — separation strongest, alignment medium, cohesion weakest.
 */

/** @typedef {typeof DEFAULT_BIRD_SIM_CONFIG} BirdSimConfig */

export const DEFAULT_BIRD_SIM_CONFIG = {
  flock: {
    perception: 42,
    separationRadius: 22,
    personalSpace: 5,
    minFlockSize: 3,
    weightSep: 2.4,
    weightAli: 0.55,
    weightCoh: 0.28,
    cohesionSpeed: 0.42,
  },
  wind: {
    noiseScale: 0.012,
    timeScale: 0.012,
    speedFactor: 0.72,
    steerWeight: 1.35,
    gustMin: 0.42,
  },
  motion: {
    simSpeed: 1,
    minSpeedRatio: 0.28,
  },
  display: {
    showWindField: true,
    windParticleCount: 140,
    windStreakLength: 18,
    windOpacity: 28,
    windDriftSpeed: 0.85,
  },
};

/** @type {BirdSimConfig} */
export const birdSimConfig = structuredClone(DEFAULT_BIRD_SIM_CONFIG);

/** @type {Record<string, Partial<BirdSimConfig>>} */
export const BIRD_SIM_PRESETS = {
  default: {},
  tightFlocks: {
    flock: {
      weightCoh: 0.38,
      weightSep: 2.8,
      weightAli: 0.65,
      perception: 36,
      separationRadius: 20,
      personalSpace: 4.5,
      cohesionSpeed: 0.32,
    },
    wind: { speedFactor: 0.68, steerWeight: 1.35 },
  },
  looseScatter: {
    flock: {
      weightCoh: 0.12,
      weightSep: 3.8,
      weightAli: 0.35,
      perception: 52,
      separationRadius: 30,
      personalSpace: 7,
    },
    wind: { speedFactor: 0.88, steerWeight: 1.75, noiseScale: 0.015 },
  },
  strongWind: {
    wind: {
      noiseScale: 0.018,
      timeScale: 0.018,
      speedFactor: 0.92,
      steerWeight: 2.0,
      gustMin: 0.55,
    },
    flock: { weightCoh: 0.15, weightAli: 0.42, weightSep: 3.2 },
    display: { windDriftSpeed: 1.1, windOpacity: 34 },
  },
  calm: {
    wind: {
      noiseScale: 0.008,
      timeScale: 0.007,
      speedFactor: 0.55,
      steerWeight: 1.1,
      gustMin: 0.38,
    },
    flock: { weightCoh: 0.35, weightSep: 2.6, weightAli: 0.55, personalSpace: 6 },
    display: { windParticleCount: 90, windOpacity: 20, windDriftSpeed: 0.5 },
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
