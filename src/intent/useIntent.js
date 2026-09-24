/**
 * Search-box intent (oxjob #1347): a hashed char n-gram classifier that runs in the browser.
 *
 * The weights (~790 KB JSON, ~360 KB gzipped) live in /public and are fetched once, lazily, the first
 * time the search box wants them; until they arrive `classify()` returns null and callers fall back to
 * today's behaviour. Classification itself is synchronous and takes well under a millisecond.
 *
 *   import { ensureIntentModel, classifyQuery, intentEnabled } from '@/intent/useIntent';
 *   ensureIntentModel();                       // kick off the fetch (idempotent)
 *   const intent = classifyQuery('Climate OR change');   // { label, probs, confidence } | null
 *
 * Labels: author, institution, source, topic, title, reference, question, boolean, identifier.
 * `confidence` = top probability minus the runner-up; the consumers gate on it (see searchBox.helpers).
 *
 * Kill switch: localStorage `ox_intent_off` = "1" disables it (and `?intent=0` on any URL sets that).
 */
import { classifyIntent, loadIntentModel } from './intentModel.js';

export const INTENT_WEIGHTS_URL = '/intent-weights.json';

let model = null;
let loading = null;

export function intentEnabled() {
  try {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search).get('intent');
    if (p === '0') window.localStorage.setItem('ox_intent_off', '1');
    if (p === '1') window.localStorage.removeItem('ox_intent_off');
    return window.localStorage.getItem('ox_intent_off') !== '1';
  } catch (e) {
    return false;
  }
}

/** Start loading the weights if not already; resolves to the model (or null on failure). */
export function ensureIntentModel(fetchImpl) {
  if (model) return Promise.resolve(model);
  if (loading) return loading;
  if (!intentEnabled()) return Promise.resolve(null);
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) return Promise.resolve(null);
  loading = f(INTENT_WEIGHTS_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((blob) => {
      model = blob ? loadIntentModel(blob) : null;
      return model;
    })
    .catch((e) => {
      console.warn('intent model unavailable:', e);
      return null;
    })
    .finally(() => { loading = null; });
  return loading;
}

/** Synchronous; null until the weights have loaded (or when disabled). */
export function classifyQuery(q) {
  if (!model || !q) return null;
  const { label, probs, confidence } = classifyIntent(model, q);
  return { label, probs, confidence };
}

/** For tests: inject a decoded model directly. */
export function _setIntentModel(m) {
  model = m;
}
