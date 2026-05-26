/**
 * Persist open map tabs + sessions to localStorage (survives refresh).
 */

const STORAGE_KEY = 'gem-digger-map-state-v1';
const STORAGE_VERSION = 1;

/**
 * @param {import('./session.js').MapSession} session
 */
function serializeSession(session) {
  return {
    ...session,
    cells: Array.from(session.cells),
    custom: session.custom ? structuredClone(session.custom) : {},
  };
}

/**
 * @param {object} raw
 * @returns {import('./session.js').MapSession}
 */
function deserializeSession(raw) {
  return {
    ...raw,
    cells: new Uint8Array(raw.cells),
    custom: raw.custom ? structuredClone(raw.custom) : {},
  };
}

/**
 * @param {import('./manager.js').MapManager} manager
 */
export function saveMapManagerState(manager) {
  if (typeof localStorage === 'undefined') return false;
  try {
    manager.persistActive();
    const sessions = {};
    for (const [id, session] of manager.sessions.entries()) {
      sessions[id] = serializeSession(session);
    }
    const payload = {
      version: STORAGE_VERSION,
      tabs: manager.getOpenTabs().map((t) => ({ ...t })),
      activeTabId: manager.getActiveTabId(),
      sessions,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.warn('Could not save map state', e);
    return false;
  }
}

/**
 * @returns {{ tabs: import('./manager.js').MapTab[], activeTabId: string, sessions: Map<string, import('./session.js').MapSession> } | null}
 */
export function loadMapManagerState() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== STORAGE_VERSION) return null;
    if (!Array.isArray(data.tabs) || !data.activeTabId || !data.sessions) return null;

    /** @type {Map<string, import('./session.js').MapSession>} */
    const sessions = new Map();
    for (const [id, session] of Object.entries(data.sessions)) {
      sessions.set(id, deserializeSession(session));
    }

    return {
      tabs: data.tabs,
      activeTabId: data.activeTabId,
      sessions,
    };
  } catch (e) {
    console.warn('Could not load map state', e);
    return null;
  }
}

export function clearMapManagerState() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
