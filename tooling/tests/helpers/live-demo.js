import { renderWorldToCanvas, computeDemoCellPx, canvasPixelSize } from '../../../js/render-canvas.js';
import { prepareScenario, stepScenario, finishScenario, runScenario } from './harness.js';

const DEFAULT_DELAY_MS = 350;

export class LiveDemoPlayer {
  constructor(canvas, ui = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.cellPx = 16;
    this.delayMs = DEFAULT_DELAY_MS;
    this.timer = null;
    this.prep = null;
    this.tick = 0;
    this.playing = false;
    this._resizeObserver = null;

    const wrap = canvas.closest('.demo-canvas-wrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._refit());
      this._resizeObserver.observe(wrap);
    }
  }

  _containerLimits() {
    const wrap = this.canvas.closest('.demo-canvas-wrap');
    const maxCanvasWidth = wrap?.clientWidth ? Math.max(120, wrap.clientWidth - 16) : 320;
    return { maxCanvasWidth, maxCanvasHeight: 280 };
  }

  _refit() {
    if (!this.prep) return;
    const { world } = this.prep.slice;
    if (this.test?.demoCellPx != null) return;
    const next = computeDemoCellPx(world, this._containerLimits());
    if (next !== this.cellPx) {
      this.cellPx = next;
      this._updateSizeMeta(world);
      this.draw();
    }
  }

  _updateSizeMeta(world) {
    const px = canvasPixelSize(world, this.cellPx);
    this.setMeta({
      slice: `${world.width}×${world.height} cells`,
      size: `${px.width}×${px.height} px · ${this.cellPx} px/cell`,
    });
  }

  load(test) {
    this.stop();
    this.prep = prepareScenario(test);
    this.tick = 0;
    this.test = test;
    this.delayMs = test.demoDelayMs ?? DEFAULT_DELAY_MS;

    const { world } = this.prep.slice;
    this.cellPx =
      test.demoCellPx ?? computeDemoCellPx(world, this._containerLimits());

    const rules = this.prep.scope.rules?.join(', ') ?? 'all enabled';
    this.setMeta({
      rules,
      ticks: `0 / ${this.prep.steps}`,
    });
    this._updateSizeMeta(world);
    this.setStatus(`${test.name} — ready`);
    this.clearResult();
    this.clearVerify();
    this.draw([]);
  }

  draw(highlight = []) {
    if (!this.prep) return;
    renderWorldToCanvas(this.ctx, this.prep.slice.world, {
      cellPx: this.cellPx,
      highlight,
      showGrid: true,
    });
  }

  play() {
    if (!this.prep || this.playing) return;
    this.playing = true;
    this.scheduleStep();
  }

  scheduleStep() {
    this.timer = window.setTimeout(() => {
      if (!this.playing) return;
      if (this.tick >= this.prep.steps) {
        this.playing = false;
        this.finish();
        return;
      }
      this.step();
      this.scheduleStep();
    }, this.delayMs);
  }

  pause() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.pause();
    this.prep = null;
    this.tick = 0;
  }

  step() {
    if (!this.prep || this.tick >= this.prep.steps) {
      this.finish();
      return;
    }
    stepScenario(this.prep.slice, this.prep.scope);
    this.tick++;
    this.setMeta({ ticks: `${this.tick} / ${this.prep.steps}` });
    this.setStatus(`${this.test.name} — tick ${this.tick}`);
    this.draw();
    if (this.tick >= this.prep.steps) this.finish();
  }

  replay() {
    if (!this.test) return;
    this.load(this.test);
    this.play();
  }

  finish() {
    this.pause();
    if (!this.prep) return;

    const live = finishScenario(this.prep.slice, this.prep.expect);
    this.draw(live.pass ? [] : live.diffs);
    this.setResult(live.pass ? 'PASS' : 'FAIL', live.pass);

    const headless = runScenario(this.test);
    const match = headless.pass === live.pass && headless.pass;
    this.setVerify(
      match
        ? 'Live demo matches headless harness ✓'
        : `Mismatch: live ${live.pass ? 'PASS' : 'FAIL'} vs headless ${headless.pass ? 'PASS' : 'FAIL'}`,
      match
    );
  }

  setMeta({ engine, rules, slice, size, ticks }) {
    if (engine != null && this.ui.engineEl) this.ui.engineEl.textContent = engine;
    if (rules != null && this.ui.rulesEl) this.ui.rulesEl.textContent = rules;
    if (slice != null && this.ui.sliceEl) this.ui.sliceEl.textContent = slice;
    if (size != null && this.ui.sizeEl) this.ui.sizeEl.textContent = size;
    if (ticks != null && this.ui.ticksEl) this.ui.ticksEl.textContent = ticks;
  }

  setStatus(text) {
    if (this.ui.statusEl) this.ui.statusEl.textContent = text;
  }

  setResult(text, ok) {
    if (!this.ui.resultEl) return;
    this.ui.resultEl.textContent = text;
    this.ui.resultEl.className = ok ? 'demo-result pass' : 'demo-result fail';
  }

  setVerify(text, ok) {
    if (!this.ui.verifyEl) return;
    this.ui.verifyEl.textContent = text;
    this.ui.verifyEl.className = ok ? 'demo-verify ok' : 'demo-verify bad';
  }

  clearResult() {
    if (this.ui.resultEl) {
      this.ui.resultEl.textContent = '';
      this.ui.resultEl.className = 'demo-result';
    }
  }

  clearVerify() {
    if (this.ui.verifyEl) {
      this.ui.verifyEl.textContent = '';
      this.ui.verifyEl.className = 'demo-verify';
    }
  }
}
