import { getMapDefinition, getAllMapDefinitions } from './registry.js';
import {
  captureMapSession,
  createFreshMapSession,
  applyMapSessionWithHooks,
  cloneSlotInventory,
} from './session.js';
import { createBackpackInventory } from '../sim/backpack-inventory.js';
import { createJarInventory } from '../sim/jar-inventory.js';

/**
 * @typedef {object} MapManagerOptions
 * @property {import('../world.js').World} world
 * @property {string} [initialMapId]
 * @property {(ctx: { mapId: string, previousMapId: string | null }) => void} [onSwitch]
 */

/**
 * Per-tab session engine — each map keeps its own grid, inventories, and settings.
 */
export class MapManager {
  /**
   * @param {MapManagerOptions} opts
   */
  constructor(opts) {
    this.world = opts.world;
    /** @type {Map<string, import('./session.js').MapSession>} */
    this.sessions = new Map();
    /** @type {string | null} */
    this.activeMapId = null;
    this.onSwitch = opts.onSwitch ?? null;
    this._initialMapId = opts.initialMapId ?? null;
  }

  /** @returns {string | null} */
  getActiveMapId() {
    return this.activeMapId;
  }

  /** @returns {import('./registry.js').MapDefinition | undefined} */
  getActiveDefinition() {
    return this.activeMapId ? getMapDefinition(this.activeMapId) : undefined;
  }

  /** @param {string} [mapId] */
  init(mapId) {
    const defs = getAllMapDefinitions();
    const id = mapId ?? this._initialMapId ?? defs[0]?.id;
    if (!id) {
      throw new Error('MapManager.init: no maps registered');
    }
    this.switchTo(id);
  }

  /**
   * Save current world → switch tab → restore that map's session (or bootstrap fresh).
   * @param {string} mapId
   * @param {{ forceFresh?: boolean }} [opts]
   */
  switchTo(mapId, opts = {}) {
    const def = getMapDefinition(mapId);
    if (!def) {
      throw new Error(`Unknown map "${mapId}"`);
    }

    const previousMapId = this.activeMapId;

    if (this.activeMapId && !opts.forceFresh) {
      this._persistActiveSession();
    }

    if (opts.forceFresh) {
      this.sessions.delete(mapId);
    }

    this.activeMapId = mapId;

    let session = this.sessions.get(mapId);
    if (!session) {
      session = createFreshMapSession(this.world, def);
      this.sessions.set(mapId, session);
    } else {
      applyMapSessionWithHooks(this.world, session, def);
    }

    this.onSwitch?.({ mapId, previousMapId });
  }

  _persistActiveSession() {
    if (!this.activeMapId) return;
    const def = getMapDefinition(this.activeMapId);
    if (!def) return;

    const session = captureMapSession(this.world, {
      mapId: def.id,
      label: def.label,
    });
    if (def.hooks?.capture) {
      def.hooks.capture(this.world, session);
    }
    this.sessions.set(this.activeMapId, session);
  }

  /** Re-run map bootstrap; keeps inventories unless map sets resetClearsInventory. */
  resetActiveMap() {
    const def = this.getActiveDefinition();
    if (!def || !this.activeMapId) return;

    const keepBackpack = !def.resetClearsInventory && this.world.backpack
      ? cloneSlotInventory(this.world.backpack)
      : null;
    const keepJar = !def.resetClearsInventory && this.world.jar
      ? cloneSlotInventory(this.world.jar)
      : null;

    this.world.reset();
    this.world.seed = def.seed ?? this.world.seed;

    if (def.defaultRules) {
      for (const [key, enabled] of Object.entries(def.defaultRules)) {
        this.world.ruleEnabled[key] = enabled;
      }
    }

    this.world.backpack = keepBackpack ?? createBackpackInventory();
    this.world.jar = keepJar ?? createJarInventory();

    def.bootstrap(this.world);
    def.hooks?.afterBootstrap?.(this.world);

    const session = captureMapSession(this.world, {
      mapId: def.id,
      label: def.label,
    });
    def.hooks?.capture?.(this.world, session);
    this.sessions.set(this.activeMapId, session);
  }

  /** Force all maps back to bootstrap state (clears saved tab sessions). */
  resetAllMaps() {
    this.sessions.clear();
    if (this.activeMapId) {
      this.switchTo(this.activeMapId, { forceFresh: true });
    }
  }

  /**
   * @param {string} mapId
   * @returns {import('./session.js').MapSession | undefined}
   */
  getSession(mapId) {
    return this.sessions.get(mapId);
  }
}

/**
 * @param {MapManagerOptions} opts
 * @returns {MapManager}
 */
export function createMapManager(opts) {
  return new MapManager(opts);
}
