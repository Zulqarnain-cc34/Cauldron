import { canvasPixelSize } from './world.js';
import { createWebGLRenderer, renderWorld } from './render-gl.js';
import { createOverlay } from './overlay.js';
import { renderPlugins } from './plugins/host.js';

/**
 * Browser host: WebGL sim canvas + 2D overlay + requestAnimationFrame loop.
 * @param {HTMLElement} parentEl
 * @param {import('./world.js').World} world
 */
export function createSimHost(parentEl, world) {
  const viewport = document.createElement('div');
  viewport.className = 'sim-viewport';

  const glCanvas = document.createElement('canvas');
  glCanvas.className = 'sim-gl';

  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.className = 'sim-overlay';

  viewport.appendChild(glCanvas);
  viewport.appendChild(overlayCanvas);
  parentEl.appendChild(viewport);

  const { width, height } = canvasPixelSize(world);
  glCanvas.width = width;
  glCanvas.height = height;
  overlayCanvas.width = width;
  overlayCanvas.height = height;

  const renderer = createWebGLRenderer(glCanvas);
  const overlay = createOverlay(overlayCanvas);

  let rafId = 0;
  let running = false;
  /** @type {(() => void) | null} */
  let frameFn = null;

  function loop() {
    if (!running) return;
    frameFn?.();
    rafId = requestAnimationFrame(loop);
  }

  return {
    viewport,
    glCanvas,
    overlayCanvas,
    renderer,
    overlay,

    /** Resize display canvases when world dimensions change. */
    syncCanvasSize() {
      const size = canvasPixelSize(world);
      glCanvas.width = size.width;
      glCanvas.height = size.height;
      overlay.resize(size.width, size.height);
      viewport.style.width = `${size.width}px`;
      viewport.style.height = `${size.height}px`;
    },

    /**
     * @param {() => void} fn sim tick + render each frame
     */
    start(fn) {
      frameFn = fn;
      if (running) return;
      running = true;
      loop();
    },

    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },

    /** Draw grid (WebGL) then clear overlay and run plugin/gem passes via callback. */
    renderFrame(drawOverlays) {
      renderWorld(renderer, world);
      overlay.clear();
      renderPlugins(overlay, world);
      drawOverlays?.(overlay, world);
    },
  };
}
