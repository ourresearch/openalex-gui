// Edge autocomplete (oxjob #1529), on for everyone since 2026-10-04; the feature flag `edge_autocomplete_off` (Admin ->
// Experimental or localStorage localFeatureFlags) turns it off for one account or browser. Suggestions come from the Cloudflare edge (api.openalex.org/edge, Worker
// openalex-autocomplete-edge) in today's /autocomplete/<entity> row shape; most keystrokes are answered in the browser
// from index nodes it already holds. The other files in this folder are copied from
// github.com/ourresearch/openalex-autocomplete-edge src/ (norm, rank, core, entcore, mix, ac-client): change them there.
//
// Never worse than today: edgeRows() returns null on an edge error, a reply slower than 800 ms, or zero rows still zero
// after a 300 ms pause (e.g. an author with one work, who is not in the edge index), and the caller then uses today's
// endpoint.
import store from "@/store";
import { EdgeAutocomplete } from "./ac-client.js";
import { entityOf } from "./entcore.js";

const BASE = "https://api.openalex.org/edge";
const TIMEOUT_MS = 800, ZERO_PAUSE_MS = 300;

let client = null;
const latest = new Map();   // entity -> the newest complete() promise

export function edgeOn() {
  return !store.getters.featureFlags?.edge_autocomplete_off;
}
export function edge() {
  if (!client) client = new EdgeAutocomplete({ base: BASE });
  return client;
}
// "mix" is the front page's mixed list; every other name is an entity type (works are not served from the edge)
export function edgeSupports(entityType) {
  return entityType === "mix" || !!entityOf(entityType);
}
export function edgeWarm(entityType) {
  if (edgeOn() && edgeSupports(entityType)) edge().warm(entityType === "mix" ? "authors" : entityType);
}

// -> rows, or null (use today's endpoint)
export async function edgeRows(entityType, q) {
  const c = edge();
  const p = c.complete(entityType, q);
  latest.set(entityType, p);
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve({ timeout: true }), TIMEOUT_MS); });
  let r = await Promise.race([p, timeout]);
  clearTimeout(timer);
  // superseded by a newer keystroke: answer with the newest one's rows instead of an empty list
  while (r && r.stale && latest.get(entityType) && latest.get(entityType) !== p) r = await latest.get(entityType);
  if (!r || r.timeout || r.mode === "error" || !r.rows) return null;
  if (!r.rows.length) {
    // zero rows: ask today's endpoint only after a 300 ms pause, so a misspelling typed fast doesn't send one request
    // per keystroke there (anonymous clients are capped at 10 req/s); a newer keystroke in the meantime wins
    await new Promise((res) => setTimeout(res, ZERO_PAUSE_MS));
    return latest.get(entityType) === p ? null : [];
  }
  return r.rows;
}

// synchronous rows the browser can already answer (an editor's first paint), or null
export function edgePeek(entityType, q) {
  return edgeOn() && edgeSupports(entityType) ? edge().peek(entityType, q) : null;
}
