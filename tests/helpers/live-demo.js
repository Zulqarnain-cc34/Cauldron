import { renderWorldToCanvas } from '../../js/render-canvas.js';
import { prepareScenario, stepScenario, finishScenario, runScenario } from './harness.js';

const DEFAULT_CELL_PX = 20;
const DEFAULT_DELAY_MS = 350;

export class LiveDemoPlayer {
  constructor(canvas, ui = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.cellPx = DEFAULT_CELL_PX;
    this.delayMs = DEFAULT_DELAY_MS;
    this.timer = null;
    this.prep = null;
    this.tick = 0;
    this.playing = false;
  }

  load(test) {
    this.stop();
    this.prep = prepareScenario(test);
    this.tick = 0;
    this.test = test;
    this.cellPx = test.demoCellPx ?? DEFAULT_CELL_PX;
    this.delayMs = test.demoDelayMs ?? DEFAULT_DELAY_MS;

    const { world } = this.prep.slice;
    const rules = this.prep.scope.rules?.join(', ') ?? 'all enabled';
    this.setMeta({
      engine: 'World + runRules() · production registry',
      rules,
      slice: `${world.width}×${world.height} cells`,
      ticks: `0 / ${this.prep.steps}`,
    });
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

    // Cross-check: live path must match headless runScenario (same harness).
    const headless = runScenario(this.test);
    const match = headless.pass === live.pass && headless.pass;
    this.setVerify(
      match
        ? 'Live demo matches headless harness ✓'
        : `Mismatch: live ${live.pass ? 'PASS' : 'FAIL'} vs headless ${headless.pass ? 'PASS' : 'FAIL'}`,
      match
    );
  }

  setMeta({ engine, rules, slice, ticks }) {
    if (engine != null && this.ui.engineEl) this.ui.engineEl.textContent = engine;
    if (rules != null && this.ui.rulesEl) this.ui.rulesEl.textContent = rules;
    if (slice != null && this.ui.sliceEl) this.ui.sliceEl.textContent = slice;
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
