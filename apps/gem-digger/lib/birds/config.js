/**
 * Live-tweakable bird / flock / wind settings (game UI reads & writes this).
 */

/** @typedef {typeof DEFAULT_BIRD_SIM_CONFIG} BirdSimConfig */

export const DEFAULT_BIRD_SIM_CONFIG = {
  flock: {
    interactionMode: 'topological',
    topologicalNeighbors: 7,
    perception: 42,
    separationRadius: 22,
    personalSpace: 5,
    minFlockSize: 3,
    weightSep: 2.4,
    weightAli: 0.65,
    weightCoh: 0.32,
    cohesionSpeed: 0.42,
  },
  wind: {
    /** When false, birds ignore wind forces (flocking only). Viz streaks still optional. */
    enabled: true,
    noiseScale: 0.009,
    timeScale: 0.008,
    speedFactor: 0.52,
    steerWeight: 0.95,
    gustMin: 0.28,
  },
  motion: {
    simSpeed: 1,
    minSpeedRatio: 0.28,
  },
  display: {
    showWindField: true,
    showDiagnostics: true,
    windParticleCount: 120,
    windStreakLength: 18,
    windOpacity: 24,
    windDriftSpeed: 0.65,
  },
};

/** @type {BirdSimConfig} */
export const birdSimConfig = structuredClone(DEFAULT_BIRD_SIM_CONFIG);

/** Human-readable preset names for the UI. */
export const BIRD_PRESET_LABELS = {
  default: 'Balanced',
  noWind: 'No wind (flock only)',
  calmWind: 'Calm wind',
  windyDay: 'Windy day',
  turbulentWind: 'Turbulent wind',
  flockFirst: 'Flock first',
  topologicalFlock: 'Topological flock',
  metricFlock: 'Metric flock',
};

/** @type {Record<string, Partial<BirdSimConfig>>} */
export const BIRD_SIM_PRESETS = {
  default: {},

  /** Light breeze — flocking easy to see. */
  calmWind: {
    wind: {
      noiseScale: 0.007,
      timeScale: 0.006,
      speedFactor: 0.42,
      steerWeight: 0.75,
      gustMin: 0.22,
    },
    flock: {
      weightAli: 0.72,
      weightCoh: 0.38,
      weightSep: 2.2,
    },
    display: { windParticleCount: 80, windOpacity: 18, windDriftSpeed: 0.45 },
  },

  /** Medium gusts — wind and flock share control. */
  windyDay: {
    wind: {
      noiseScale: 0.012,
      timeScale: 0.011,
      speedFactor: 0.62,
      steerWeight: 1.1,
      gustMin: 0.38,
    },
    flock: {
      weightAli: 0.6,
      weightCoh: 0.3,
      weightSep: 2.4,
    },
    display: { windParticleCount: 130, windOpacity: 26, windDriftSpeed: 0.75 },
  },

  /** Strong turbulent flow — motion dominated by wind. */
  turbulentWind: {
    wind: {
      noiseScale: 0.02,
      timeScale: 0.018,
      speedFactor: 0.88,
      steerWeight: 1.75,
      gustMin: 0.55,
    },
    flock: {
      weightAli: 0.45,
      weightCoh: 0.15,
      weightSep: 3.0,
    },
    display: { windParticleCount: 180, windOpacity: 36, windDriftSpeed: 1.05 },
  },

  /** Weak wind, strong flock — best for tuning φ / groups. */
  /** Flocking only — no wind steering (good baseline for φ / sep / coh). */
  noWind: {
    wind: { enabled: false, steerWeight: 0 },
    flock: {
      interactionMode: 'topological',
      topologicalNeighbors: 7,
      weightAli: 0.75,
      weightCoh: 0.4,
      weightSep: 2.3,
    },
    display: { showWindField: false, windParticleCount: 0 },
  },

  flockFirst: {
    wind: {
      noiseScale: 0.008,
      timeScale: 0.007,
      speedFactor: 0.38,
      steerWeight: 0.65,
      gustMin: 0.2,
    },
    flock: {
      interactionMode: 'topological',
      topologicalNeighbors: 8,
      weightAli: 0.78,
      weightCoh: 0.4,
      weightSep: 2.3,
      personalSpace: 5.5,
    },
    display: { windParticleCount: 70, windOpacity: 16, windDriftSpeed: 0.4 },
  },

  topologicalFlock: {
    flock: {
      interactionMode: 'topological',
      topologicalNeighbors: 7,
      weightAli: 0.7,
      weightCoh: 0.35,
    },
  },

  metricFlock: {
    flock: {
      interactionMode: 'metric',
      perception: 40,
      weightAli: 0.62,
      weightCoh: 0.34,
    },
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
