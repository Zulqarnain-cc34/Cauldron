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
  };
}
