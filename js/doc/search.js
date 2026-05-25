/**
 * @param {string} haystack
 * @param {string} query
 */
export function matchesQuery(haystack, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

/**
 * @param {import('./build-catalog.js').DocEntry} entry
 * @param {string} query
 */
export function entryMatchesQuery(entry, query) {
  if (!query.trim()) return true;
  const haystack = [
    entry.id,
    entry.label,
    entry.kind,
    entry.summary,
    entry.ascii,
    ...(entry.tags ?? []),
    ...(entry.properties ?? []).map((p) => `${p.label} ${p.value}`),
    ...(entry.tests ?? []).map((t) => `${t.name} ${t.id} ${t.description ?? ''}`),
  ].join(' ');
  return matchesQuery(haystack, query);
}
