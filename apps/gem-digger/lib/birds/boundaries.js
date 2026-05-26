/**
 * Toroidal arena — sky wraps on all edges (Pac-Man style).
 */

/**
 * @param {number} value
 * @param {number} size
 */
export function wrapCoord(value, size) {
  if (size <= 0) return value;
  return ((value % size) + size) % size;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} worldW
 * @param {number} worldH
 * @returns {[number, number]}
 */
export function toroidalSampleCoords(x, y, worldW, worldH) {
  return [wrapCoord(x, worldW), wrapCoord(y, worldH)];
}

/**
 * Shortest displacement from (fromX, fromY) to (toX, toY) on a wrapping grid.
 */
export function toroidalVectorTo(fromX, fromY, toX, toY, worldW, worldH) {
  let dx = toX - fromX;
  let dy = toY - fromY;

  if (worldW > 0) {
    if (dx > worldW * 0.5) dx -= worldW;
    else if (dx < -worldW * 0.5) dx += worldW;
  }
  if (worldH > 0) {
    if (dy > worldH * 0.5) dy -= worldH;
    else if (dy < -worldH * 0.5) dy += worldH;
  }

  return [dx, dy];
}

export function toroidalDelta(ax, ay, bx, by, worldW, worldH) {
  return toroidalVectorTo(bx, by, ax, ay, worldW, worldH);
}

/**
 * Wrap position into [0, worldW) × [0, worldH). Velocity is unchanged.
 * @param {{ x: number, y: number }} body
 * @param {number} worldW
 * @param {number} worldH
 */
export function wrapWorldPosition(body, worldW, worldH) {
  body.x = wrapCoord(body.x, worldW);
  body.y = wrapCoord(body.y, worldH);
}

export function wrapWindParticle(p, worldW, worldH) {
  wrapWorldPosition(p, worldW, worldH);
}

/**
 * Grid offsets to draw a body seamlessly across toroidal seams.
 * @param {number} x
 * @param {number} y
 * @param {number} worldW
 * @param {number} worldH
 * @param {number} margin grid cells
 * @returns {[number, number][]}
 */
export function toroidalRenderOffsets(x, y, worldW, worldH, margin) {
  const offsets = [[0, 0]];
  const nearLeft = x < margin;
  const nearRight = x > worldW - margin;
  const nearTop = y < margin;
  const nearBottom = y > worldH - margin;

  if (nearLeft) offsets.push([worldW, 0]);
  if (nearRight) offsets.push([-worldW, 0]);
  if (nearTop) offsets.push([0, worldH]);
  if (nearBottom) offsets.push([0, -worldH]);
  if (nearLeft && nearTop) offsets.push([worldW, worldH]);
  if (nearRight && nearTop) offsets.push([-worldW, worldH]);
  if (nearLeft && nearBottom) offsets.push([worldW, -worldH]);
  if (nearRight && nearBottom) offsets.push([-worldW, -worldH]);

  return offsets;
}
