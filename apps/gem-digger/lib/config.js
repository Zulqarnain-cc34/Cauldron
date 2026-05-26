/** Gem Digger app paths — not part of the Cauldron library. */
export const ASSET_BASE = '/apps/gem-digger/assets';

/** @param {string} name filename without extension */
export function assetIcon(name) {
  return `${ASSET_BASE}/${name}.png`;
}
