// The last translated database search (oxjob #1659), keyed by the OQL it became, so the OQL tab can show the list of
// changes above that query. sessionStorage keeps it across a reload; a shared link shows the query without the notes.
// Wrapped in try/catch: storage can be missing (private windows, blocked site data).
import { oqlForUrl } from '@/oqlSerialize';

const KEY = 'oxDbSearchTranslation';
let memory = null;

export function rememberTranslation(result, original) {
  const entry = {
    oql: oqlForUrl(result.oql),
    source: result.source,
    sourceLabel: result.sourceLabel,
    changes: result.changes,
    original,
    at: new Date().toISOString(),
  };
  memory = entry;
  try { sessionStorage.setItem(KEY, JSON.stringify(entry)); } catch (e) { /* memory copy still works */ }
  return entry;
}

export function recallTranslation(oql) {
  if (!oql) return null;
  let entry = memory;
  if (!entry) {
    try { entry = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { entry = null; }
  }
  return entry && entry.oql === oqlForUrl(oql) ? entry : null;
}
