import { getMapDefinition, getAllMapDefinitions } from './registry.js';
import {
  captureMapSession,
  createFreshMapSession,
  applyMapSessionWithHooks,
  cloneSlotInventory,
} from './session.js';
import { createBackpackInventory } from '../inventory/backpack-inventory.js';
import { createJarInventory } from '../inventory/jar-inventory.js';
import { clearGemPickups } from '../gems/pickups.js';
import { runMapWorldGenerator } from '../worldgen-bridge.js';

/**
 * @typedef {object} MapTab
 * @property {string} instanceId unique tab id
 * @property {string} defId registered MapDefinition id (template)
 * @property {string} label tab title
 */

/**
 * @typedef {object} MapManagerOptions
 * @property {import('../../world.js').World} world
 * @property {string} [initialMapId] def id for first active tab
 * @property {string[]} [initialTabDefIds] def ids to open on init (default: all except `blank`)
 * @property {(ctx: { mapId: string, defId: string, tab: MapTab, previousMapId: string | null }) => void} [onSwitch]
 */

let nextTabSerial = 0;

function createTabInstance(defId, label) {
  nextTabSerial += 1;
  return {
    instanceId: `tab-${nextTabSerial}`,
    defId,
    label,
  };
}

/**
 * Per-tab session engine — each open tab keeps its own grid, inventories, and settings.
 */
export class MapManager {
  /**
   * @param {MapManagerOptions} opts
   */
  constructor(opts) {
    this.world = opts.world;
    /** @type {MapTab[]} */
    this.tabs = [];
    /** @type {Map<string, import('./session.js').MapSession>} */
    this.sessions = new Map();
    /** @type {string | null} active tab instance id */
    this.activeTabId = null;
    this.onSwitch = opts.onSwitch ?? null;
    this._initialMapId = opts.initialMapId ?? null;
    /** @type {string[] | undefined} */
    this._initialTabDefIds = opts.initialTabDefIds;
  }

  /** Active tab instance id (for sessions). */
  getActiveTabId() {
    return this.activeTabId;
  }

  /** @deprecated use getActiveTabId */
  getActiveMapId() {
    return this.activeTabId;
  }

  /** @returns {MapTab | undefined} */
  getActiveTab() {
    return this.tabs.find((t) => t.instanceId === this.activeTabId);
  }

  /** @returns {import('./registry.js').MapDefinition | undefined} */
  getActiveDefinition() {
    const tab = this.getActiveTab();
    return tab ? getMapDefinition(tab.defId) : undefined;
  }

  /** @returns {readonly MapTab[]} */
  getOpenTabs() {
    return this.tabs;
  }

  /** @param {string} [mapDefId] first active tab uses this definition id */
  init(mapDefId) {
    const defs = getAllMapDefinitions();
    const defIds =
      this._initialTabDefIds ??
      defs.filter((d) => d.id !== 'blank').map((d) => d.id);

    if (defIds.length === 0) {
      throw new Error('MapManager.init: no maps registered');
    }

    this.tabs = defIds.map((id) => {
      const def = getMapDefinition(id);
      if (!def) throw new Error(`Unknown map "${id}"`);
      return createTabInstance(id, def.label);
    });

    const preferred =
      (mapDefId && this.tabs.find((t) => t.defId === mapDefId)?.instanceId) ??
      this._initialMapId ??
      this.tabs[0]?.instanceId;

    if (!preferred) {
      throw new Error('MapManager.init: no tabs to open');
    }
    this.switchTo(preferred);
  }

  /**
   * Open a new tab from a map template (default: blank).
   * @param {{ defId?: string, label?: string }} [opts]
   * @returns {MapTab}
   */
  openTab(opts = {}) {
    const defId = opts.defId ?? 'blank';
    const def = getMapDefinition(defId);
    if (!def) {
      throw new Error(`Unknown map template "${defId}"`);
    }

    const sameTemplate = this.tabs.filter((t) => t.defId === defId).length;
    const label =
      opts.label ??
      (defId === 'blank'
        ? `Map ${this.tabs.length + 1}`
        : sameTemplate > 0
          ? `${def.label} ${sameTemplate + 1}`
          : def.label);

    const tab = createTabInstance(defId, label);
    this.tabs.push(tab);
    this.switchTo(tab.instanceId);
    return tab;
  }

  /**
   * Close a tab. Keeps at least one tab open.
   * @param {string} instanceId
   * @returns {boolean}
   */
  closeTab(instanceId) {
    if (this.tabs.length <= 1) return false;

    const idx = this.tabs.findIndex((t) => t.instanceId === instanceId);
    if (idx < 0) return false;

    const closingActive = this.activeTabId === instanceId;
    this.tabs.splice(idx, 1);
    this.sessions.delete(instanceId);

    if (closingActive) {
      const next = this.tabs[Math.min(idx, this.tabs.length - 1)];
      this.switchTo(next.instanceId);
    }

    return true;
  }

  /**
   * @param {string} tabId tab instance id
   * @param {{ forceFresh?: boolean }} [opts]
   */
  switchTo(tabId, opts = {}) {
    const tab = this.tabs.find((t) => t.instanceId === tabId);
    if (!tab) {
      throw new Error(`Unknown tab "${tabId}"`);
    }
    const def = getMapDefinition(tab.defId);
    if (!def) {
      throw new Error(`Unknown map definition "${tab.defId}"`);
    }

    const previousMapId = this.activeTabId;

    if (this.activeTabId && !opts.forceFresh) {
      this._persistActiveSession();
    }

    if (opts.forceFresh) {
      this.sessions.delete(tabId);
    }

    this.activeTabId = tabId;

    let session = this.sessions.get(tabId);
    if (!session) {
      session = createFreshMapSession(this.world, def);
      this.sessions.set(tabId, session);
    } else {
      applyMapSessionWithHooks(this.world, session, def);
    }

    this.onSwitch?.({ mapId: tabId, defId: tab.defId, tab, previousMapId });
  }

  _persistActiveSession() {
    if (!this.activeTabId) return;
    const tab = this.getActiveTab();
    const def = tab ? getMapDefinition(tab.defId) : undefined;
    if (!tab || !def) return;

    const session = captureMapSession(this.world, {
      mapId: tab.instanceId,
      label: tab.label,
    });
    if (def.hooks?.capture) {
      def.hooks.capture(this.world, session);
    }
    this.sessions.set(this.activeTabId, session);
  }

  /** Re-run map bootstrap for the active tab. */
  resetActiveMap() {
    const tab = this.getActiveTab();
    const def = this.getActiveDefinition();
    if (!tab || !def || !this.activeTabId) return;

    const keepBackpack = !def.resetClearsInventory && this.world.backpack
      ? cloneSlotInventory(this.world.backpack)
      : null;
    const keepJar = !def.resetClearsInventory && this.world.jar
      ? cloneSlotInventory(this.world.jar)
      : null;

    this.world.reset();
    if (def.randomSeedOnReset) {
      this.world.seed = ((Date.now() & 0xffffffff) ^ (def.seed ?? 0)) >>> 0;
    } else {
      this.world.seed = def.seed ?? this.world.seed;
    }
    clearGemPickups(this.world);

    if (def.defaultRules) {
      for (const [key, enabled] of Object.entries(def.defaultRules)) {
        this.world.ruleEnabled[key] = enabled;
      }
    }

    this.world.backpack = keepBackpack ?? createBackpackInventory();
    this.world.jar = keepJar ?? createJarInventory();

    if (def.worldGenerator) {
      runMapWorldGenerator(this.world, def.worldGenerator, def.worldGeneratorOptions ?? {});
    } else if (def.bootstrap) {
      def.bootstrap(this.world);
    }

    def.hooks?.afterBootstrap?.(this.world);

    const session = captureMapSession(this.world, {
      mapId: tab.instanceId,
      label: tab.label,
    });
    def.hooks?.capture?.(this.world, session);
    this.sessions.set(this.activeTabId, session);
  }

  /** Force all open tabs back to bootstrap state. */
  resetAllMaps() {
    const ids = this.tabs.map((t) => t.instanceId);
    this.sessions.clear();
    for (const id of ids) {
      if (this.activeTabId === id) {
        this.switchTo(id, { forceFresh: true });
      }
    }
  }

  /**
   * @param {string} tabId instance id
   * @returns {import('./session.js').MapSession | undefined}
   */
  getSession(tabId) {
    return this.sessions.get(tabId);
  }
}

/**
 * @param {MapManagerOptions} opts
 * @returns {MapManager}
 */
export function createMapManager(opts) {
  return new MapManager(opts);
}
