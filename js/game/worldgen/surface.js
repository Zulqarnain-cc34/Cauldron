/**
 * @param {number} x
 * @param {number} baseY
 */
export function rollingSurfaceHeight(x, baseY) {
  const n =
    Math.sin(x * 0.045) * 5 +
    Math.sin(x * 0.013 + 2.1) * 8 +
    Math.sin(x * 0.0033) * 4;
  return Math.floor(baseY + n);
}

/**
 * @param {number} width
 * @param {number} baseY
 * @returns {Int16Array}
 */
export function buildSurfaceProfile(width, baseY) {
  const surfaceY = new Int16Array(width);
  for (let x = 0; x < width; x++) {
    surfaceY[x] = rollingSurfaceHeight(x, baseY);
  }
  return surfaceY;
}
