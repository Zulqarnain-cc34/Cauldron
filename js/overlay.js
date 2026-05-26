/** @typedef {[number, number, number, number]} Rgba */

/**
 * @typedef {ReturnType<createOverlay>} OverlayContext
 */

/** @type {Map<string, HTMLImageElement | null>} */
const imageCache = new Map();
/** @type {Set<string>} */
const imageFailed = new Set();
/** @type {Set<string>} */
const imageLoading = new Set();

/**
 * @param {string} url
 * @param {(img: HTMLImageElement) => void} [onLoad]
 */
export function loadOverlayImage(url, onLoad) {
  if (typeof Image === 'undefined') return;
  if (imageCache.has(url)) {
    const cached = imageCache.get(url);
    if (cached && onLoad) onLoad(cached);
    return;
  }
  if (imageFailed.has(url) || imageLoading.has(url)) return;

  imageLoading.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    imageCache.set(url, img);
    imageLoading.delete(url);
    onLoad?.(img);
  };
  img.onerror = () => {
    imageFailed.add(url);
    imageLoading.delete(url);
  };
  img.src = url;
}

/** @param {string} url @returns {HTMLImageElement | null} */
export function getOverlayImage(url) {
  return imageCache.get(url) ?? null;
}

/**
 * Canvas2D overlay for sprites and plugin effects (drawn above WebGL grid).
 * @param {HTMLCanvasElement} canvas
 */
export function createOverlay(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D overlay context unavailable');

  return {
  /** @param {number} w @param {number} h */
    resize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    },

    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    save: () => ctx.save(),
    restore: () => ctx.restore(),
    translate: (x, y) => ctx.translate(x, y),
    rotate: (a) => ctx.rotate(a),

    /**
     * @param {CanvasImageSource} img
     * @param {number} cx center x
     * @param {number} cy center y
     * @param {number} w
     * @param {number} h
     */
    drawImageCenter(img, cx, cy, w, h) {
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    },

    /** @param {number} x @param {number} y @param {number} w @param {number} h @param {Rgba} rgba */
    fillRect(x, y, w, h, rgba) {
      ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`;
      ctx.fillRect(x, y, w, h);
    },

    /** @param {number} cx @param {number} cy @param {number} w @param {number} h @param {Rgba} rgba */
    fillEllipse(cx, cy, w, h, rgba) {
      ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    /**
     * Filled triangle pointing along +X, rotated by angle (radians) around center.
     * @param {number} cx
     * @param {number} cy
     * @param {number} size edge length scale
     * @param {number} angle
     * @param {Rgba} rgba
     */
    fillTriangle(cx, cy, size, angle, rgba) {
      ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const h = size * 0.9;
      const w = size * 0.55;
      ctx.beginPath();
      ctx.moveTo(h * 0.5, 0);
      ctx.lineTo(-h * 0.45, w);
      ctx.lineTo(-h * 0.45, -w);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    /**
     * Soft flow streak (tail → head), for wind / current visualization.
     * @param {number} cx head x
     * @param {number} cy head y
     * @param {number} angle radians (direction of flow)
     * @param {number} length streak length in px
     * @param {Rgba} rgba head color
     * @param {number} [lineWidth]
     */
    strokeFlowStreak(cx, cy, angle, length, rgba, lineWidth = 1.25) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tx = cx - cos * length;
      const ty = cy - sin * length;
      const [r, g, b, a] = rgba;
      const aNorm = a / 255;

      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth;

      const grad = ctx.createLinearGradient(tx, ty, cx, cy);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},${aNorm * 0.35})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},${aNorm})`);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, aNorm * 1.1)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, lineWidth * 0.65, 0, Math.PI * 2);
      ctx.fill();
    },

    /**
     * Filled forward vision wedge (angle = forward direction).
     * @param {number} cx
     * @param {number} cy
     * @param {number} angle radians
     * @param {number} radius px
     * @param {number} halfAngleRad half of FOV in radians
     * @param {Rgba} rgba
     */
    fillVisionCone(cx, cy, angle, radius, halfAngleRad, rgba) {
      if (radius <= 0 || halfAngleRad <= 0) return;
      ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - halfAngleRad, angle + halfAngleRad);
      ctx.closePath();
      ctx.fill();
    },

    /**
     * @param {number} cx
     * @param {number} cy
     * @param {number} radius px
     * @param {Rgba} rgba
     * @param {number} [lineWidth]
     * @param {number[]} [dash]
     */
    strokeCircle(cx, cy, radius, rgba, lineWidth = 1, dash = []) {
      if (radius <= 0) return;
      ctx.save();
      ctx.strokeStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] / 255})`;
      ctx.lineWidth = lineWidth;
      if (dash.length) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  };
}
