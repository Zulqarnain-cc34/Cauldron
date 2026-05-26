import { Tags } from './catalog/tags.js';
import { getMaterial, MATERIALS } from './catalog/materials.js';
import { Species } from './catalog/species.js';
import { BURN_GLOW } from './catalog/cell-color.js';

const STRIDE = 5;

/** @type {Uint8Array} species id → burnable (1) or not (0) */
const speciesBurnable = new Uint8Array(256);
for (const m of Object.values(MATERIALS)) {
  if (m.tags?.includes(Tags.BURNABLE)) speciesBurnable[m.id] = 1;
}

/**
 * @param {[number, number, number]} rgb
 * @param {number} ra
 * @returns {[number, number, number]}
 */
function baseColor(rgb, ra) {
  const grain = (ra / 255 - 0.5) * 0.15;
  return [
    Math.min(255, Math.max(0, rgb[0] * (1 + grain))),
    Math.min(255, Math.max(0, rgb[1] * (1 + grain))),
    Math.min(255, Math.max(0, rgb[2] * (1 + grain))),
  ];
}

/**
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 * @param {number} t
 */
function blendRgb(a, b, t) {
  const u = Math.min(1, Math.max(0, t));
  return [
    Math.round(a[0] * (1 - u) + b[0] * u),
    Math.round(a[1] * (1 - u) + b[1] * u),
    Math.round(a[2] * (1 - u) + b[2] * u),
  ];
}

/**
 * Hot-path color resolve — no allocations (used every frame for every cell).
 * @param {number} species
 * @param {number} ra
 * @param {number} rb
 * @param {number} tick
 */
function cellColorFast(species, ra, rb, tick) {
  const material = getMaterial(species);
  const rgb = material.color ?? [255, 0, 255];
  let color = baseColor(rgb, ra);

  if (rb > 0 && speciesBurnable[species]) {
    const heat = Math.min(1, rb / 96);
    const flicker = 0.9 + 0.1 * Math.sin(tick * 0.65 + ra * 0.08);
    color = blendRgb(color, BURN_GLOW, heat * flicker);
  }

  return color;
}

/**
 * Fill RGBA bytes — one texel per grid cell (GPU upscales with NEAREST).
 * @param {import('./world.js').World} world
 * @param {Uint8Array} out length = world.width * world.height * 4
 */
export function fillWorldPixelBuffer(world, out) {
  const cells = world.cells;
  const w = world.width;
  const h = world.height;
  const tick = world.tick;
  let ci = 0;
  let oi = 0;

  for (let n = w * h; n > 0; n--) {
    const species = cells[ci];
    const ra = cells[ci + 2];
    const rb = cells[ci + 3];
    ci += STRIDE;

    const [r, g, b] = cellColorFast(species, ra, rb, tick);
    out[oi++] = r;
    out[oi++] = g;
    out[oi++] = b;
    out[oi++] = species === Species.WATER ? 200 : 255;
  }
}

/** Texture size = grid size (1 pixel per cell; display scale is on the canvas). */
export function simTextureSize(world) {
  return { width: world.width, height: world.height };
}
