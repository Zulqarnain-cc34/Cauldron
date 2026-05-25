import { Tags } from './tags.js';
import { getMaterial } from './materials.js';
import { Species } from './species.js';

/** Ember tint applied while burnable cells have rb > 0 (burn countdown active). */
export const BURN_GLOW = [255, 120, 40];

function baseColor(rgb, ra) {
  const grain = (ra / 255 - 0.5) * 0.15;
  return [
    Math.min(255, Math.max(0, rgb[0] * (1 + grain))),
    Math.min(255, Math.max(0, rgb[1] * (1 + grain))),
    Math.min(255, Math.max(0, rgb[2] * (1 + grain))),
  ];
}

function blendRgb(a, b, t) {
  const u = Math.min(1, Math.max(0, t));
  return [
    Math.round(a[0] * (1 - u) + b[0] * u),
    Math.round(a[1] * (1 - u) + b[1] * u),
    Math.round(a[2] * (1 - u) + b[2] * u),
  ];
}

/**
 * Resolve display color for a cell.
 *
 * Simulation signal: burnables use `rb` as a burn timer (>0 = ignited, counting down).
 * Rendering signal: burnables with rb > 0 blend toward BURN_GLOW so ignition is visible
 * without changing species (Sandspiel-style smolder before ash).
 *
 * @param {{ species: number, ra: number, rb: number }} cell
 * @param {{ tick?: number }} [opts] — world tick for subtle ember flicker
 * @returns {[number, number, number]}
 */
export function cellColor(cell, opts = {}) {
  const material = getMaterial(cell.species);
  const rgb = material.color ?? [255, 0, 255];
  let color = baseColor(rgb, cell.ra);

  if (cell.rb > 0 && material.tags?.includes(Tags.BURNABLE)) {
    const heat = Math.min(1, cell.rb / 96);
    let flicker = 1;
    if (opts.tick != null) {
      flicker = 0.9 + 0.1 * Math.sin(opts.tick * 0.65 + cell.ra * 0.08);
    }
    color = blendRgb(color, BURN_GLOW, heat * flicker);
  }

  return color;
}

/** @deprecated Prefer cellColor — kept for callers that only have species + ra. */
export function speciesColor(species, ra) {
  const material = getMaterial(species);
  if (species === Species.EMPTY) return baseColor(material.color, ra);
  return cellColor({ species, ra, rb: 0 });
}
