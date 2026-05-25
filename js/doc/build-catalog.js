import { getMaterial } from '../catalog/materials.js';
import { Mobility, scanDirectionFor } from '../catalog/physics.js';
import { getMaterialModules, getRuleModules, getTestSuites } from '../sim/test-registry.js';
import { getPluginTestSuites, getRegisteredPlugins } from '../plugins/host.js';
import { entryMatchesQuery } from './search.js';

/** @typedef {'material' | 'system' | 'plugin'} DocKind */

/**
 * @typedef {Object} DocProperty
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} DocTestRef
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} steps
 * @property {object} test
 */

/**
 * @typedef {Object} DocEntry
 * @property {string} id
 * @property {DocKind} kind
 * @property {string} label
 * @property {string} summary
 * @property {number} [species]
 * @property {string} [ascii]
 * @property {number[]} [color]
 * @property {string[]} [tags]
 * @property {DocProperty[]} properties
 * @property {DocTestRef[]} tests
 * @property {string} [searchGroup]
 */

const MOBILITY_LABEL = {
  [Mobility.STATIC]: 'Static',
  [Mobility.GRANULAR]: 'Granular (falls)',
  [Mobility.FLUID]: 'Fluid',
  [Mobility.BUOYANT]: 'Buoyant (rises)',
  [Mobility.PLASMA]: 'Plasma',
  [Mobility.LIFE]: 'Life / organic',
};

function mobilityLabel(mobility) {
  return MOBILITY_LABEL[mobility] ?? mobility;
}

/**
 * @param {object} mod
 * @returns {DocEntry}
 */
function materialToDoc(mod) {
  const mat = getMaterial(mod.species);
  const scan = mod.scanDirection ?? scanDirectionFor(mat.mobility);

  const properties = [
    { label: 'Species ID', value: String(mod.species) },
    { label: 'ASCII', value: mat.ascii ?? '?' },
    { label: 'Phase', value: mat.phase ?? '—' },
    { label: 'Mobility', value: mobilityLabel(mat.mobility) },
    { label: 'Density', value: String(mat.density) },
    { label: 'Scan', value: scan === 'up' ? 'Bottom → top (rises)' : 'Top → bottom (falls)' },
    { label: 'Rule key', value: mod.enabledKey ?? mod.id },
  ];

  if (mat.sinkThroughLighter) {
    properties.push({ label: 'Interaction', value: 'Sinks through lighter fluids' });
  }
  if (mat.spreadBlockSame) {
    properties.push({ label: 'Spread', value: 'Blocks same-species sideways' });
  }

  const tests = (mod.behaviors ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    steps: b.steps ?? 1,
    test: {
      ...b,
      ruleId: mod.id,
      suite: mod.id,
      suiteLabel: mod.label ?? mod.id,
      scope: b.scope ?? { rules: [mod.id] },
      rows: b.slice?.rows ?? b.rows,
    },
  }));

  const summary =
    mod.doc?.summary ??
    `${mobilityLabel(mat.mobility)} · density ${mat.density}` +
      (mat.tags?.length ? ` · ${mat.tags.join(', ')}` : '');

  return {
    id: mod.id,
    kind: 'material',
    label: mod.label ?? mat.name,
    summary,
    species: mod.species,
    ascii: mat.ascii,
    color: mat.color,
    tags: mat.tags ?? [],
    properties,
    tests,
    searchGroup: 'materials',
  };
}

/**
 * @param {import('../plugins/host.js').CauldronPlugin} plugin
 * @returns {DocEntry}
 */
function pluginToDoc(plugin) {
  const tests = (plugin.behaviors ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    steps: b.steps ?? 1,
    test: {
      ...b,
      ruleId: b.ruleId ?? plugin.id,
      suite: plugin.id,
      suiteLabel: plugin.suiteLabel ?? plugin.id,
      scope: b.scope ?? { rules: [b.ruleId ?? `${plugin.id}-blast`] },
      rows: b.slice?.rows ?? b.rows,
    },
  }));

  const properties = [
    { label: 'Type', value: 'External plugin' },
    { label: 'Path', value: `plugins/${plugin.id}/` },
  ];

  if (plugin.doc?.controls?.length) {
    properties.push({ label: 'Controls', value: plugin.doc.controls.join(' · ') });
  }

  return {
    id: plugin.id,
    kind: 'plugin',
    label: plugin.suiteLabel ?? plugin.id,
    summary: plugin.doc?.summary ?? `Plugin · ${tests.length} behavior test(s)`,
    properties,
    tests,
    searchGroup: 'plugins',
  };
}

/**
 * @param {object} mod
 * @returns {DocEntry}
 */
function systemToDoc(mod) {
  const tests = (mod.behaviors ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    steps: b.steps ?? 1,
    test: {
      ...b,
      ruleId: mod.id,
      suite: mod.id,
      suiteLabel: mod.label ?? mod.id,
      scope: b.scope ?? { rules: [mod.id] },
      rows: b.slice?.rows ?? b.rows,
    },
  }));

  return {
    id: mod.id,
    kind: 'system',
    label: mod.label ?? mod.id,
    summary: mod.doc?.summary ?? `System rule · phase ${mod.phase}`,
    properties: [
      { label: 'Phase', value: mod.phase },
      { label: 'Type', value: 'System rule' },
    ],
    tests,
    searchGroup: 'systems',
  };
}

/** Build full documentation catalog from live registry (materials + systems + plugins). */
export function buildDocCatalog() {
  const entries = [];

  for (const mod of getMaterialModules()) {
    entries.push(materialToDoc(mod));
  }

  for (const mod of getRuleModules()) {
    if (mod.phase === 'materials' && mod.update) continue;
    if (!mod.behaviors?.length && !mod.run) continue;
    entries.push(systemToDoc(mod));
  }

  for (const plugin of getRegisteredPlugins()) {
    entries.push(pluginToDoc(plugin));
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * @param {string} query
 * @param {{ kind?: DocKind, limit?: number }} [opts]
 */
export function searchDocEntries(query, opts = {}) {
  const { kind, limit = 80 } = opts;
  let list = buildDocCatalog();
  if (kind) list = list.filter((e) => e.kind === kind);
  list = list.filter((e) => entryMatchesQuery(e, query));
  return {
    total: list.length,
    entries: list.slice(0, limit),
    truncated: list.length > limit,
  };
}

/** @returns {{ id: string, label: string, tests: object[] }[]} */
export function getAllTestSuites() {
  return [...getTestSuites(), ...getPluginTestSuites()];
}

/** @returns {Map<string, object>} */
export function buildTestIndex() {
  const map = new Map();
  for (const suite of getAllTestSuites()) {
    for (const test of suite.tests) {
      map.set(test.id, test);
    }
  }
  return map;
}

/**
 * @param {string} id
 * @returns {DocEntry | undefined}
 */
export function getDocEntry(id) {
  return buildDocCatalog().find((e) => e.id === id);
}

/**
 * @returns {{ materials: number, plugins: number, systems: number, tests: number }}
 */
export function getDocStats() {
  const catalog = buildDocCatalog();
  return {
    materials: catalog.filter((e) => e.kind === 'material').length,
    plugins: catalog.filter((e) => e.kind === 'plugin').length,
    systems: catalog.filter((e) => e.kind === 'system').length,
    tests: catalog.reduce((n, e) => n + e.tests.length, 0),
  };
}
