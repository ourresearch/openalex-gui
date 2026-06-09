// API calls for the OQL editor (oxjob #357).
//
// Deliberately a standalone module (not src/api.js): it talks directly to the
// elastic-api editor endpoints (/parse-context, /validate) + autocomplete + the
// OQL execution surface, reusing the shared axios auth/base config. Keeping it
// separate avoids touching the broadly-shared api.js.
//
// Every round-trip is timed (performance.now) and pushed to a rolling latency
// buffer — the charter decision-3 "measure keystroke latency before any JS port"
// gate. Read the stats via latencyStats().

import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig";

const MAILTO = "mailto=ui@openalex.org";

// --- rolling latency instrumentation -----------------------------------------
const _samples = { "parse-context": [], validate: [], autocomplete: [] };
const _CAP = 200;

function _record(kind, ms) {
  const buf = _samples[kind];
  if (!buf) return;
  buf.push(ms);
  if (buf.length > _CAP) buf.shift();
}

function _pct(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

export function latencyStats() {
  const out = {};
  for (const k of Object.keys(_samples)) {
    const a = _samples[k];
    out[k] = {
      n: a.length,
      p50: _pct(a, 50),
      p95: _pct(a, 95),
      last: a.length ? a[a.length - 1] : null,
    };
  }
  return out;
}

async function _timed(kind, fn) {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    _record(kind, performance.now() - t0);
  }
}

// --- editor endpoints ---------------------------------------------------------

// Cursor -> grammar context for autocomplete. `pos` is a code-point offset.
export async function getParseContext(q, pos) {
  return _timed("parse-context", async () => {
    const url = `${urlBase.api}/parse-context?${MAILTO}` +
      `&q=${encodeURIComponent(q)}&pos=${pos}`;
    const resp = await axios.get(url, axiosConfig());
    return resp.data;
  });
}

// Full OQL -> { valid, oql, oqo, oxurl, diagnostics:[{code,message,fixit,severity,start,end}] }
export async function validateOql(q) {
  return _timed("validate", async () => {
    const url = `${urlBase.api}/validate?${MAILTO}&q=${encodeURIComponent(q)}`;
    const resp = await axios.get(url, axiosConfig());
    return resp.data;
  });
}

// Property catalog for an entity: { meta, properties: { <entity>: { <col>: Property } } }.
// Property = { name, type, operators, actions, entity_type, display_name, aliases }.
// The no-code builder (#428) uses this as its field/operator/value-kind source.
export async function getProperties(entity) {
  const qs = entity ? `&entity=${encodeURIComponent(entity)}` : "";
  const url = `${urlBase.api}/properties?${MAILTO}${qs}`;
  const resp = await axios.get(url, axiosConfig());
  return resp.data;
}

// Entity-value lookup for id-kind value slots. Returns the raw results array
// ({ id, short_id, display_name, hint, ... }).
export async function autocompleteEntity(entity, q) {
  return _timed("autocomplete", async () => {
    const url = `${urlBase.api}/autocomplete/${entity}?${MAILTO}` +
      `&q=${encodeURIComponent(q || "")}`;
    const resp = await axios.get(url, axiosConfig());
    return resp.data?.results || [];
  });
}

// Run an OQL query. Mirrors api.executeOql: POST /?oql=... ; the response carries
// meta.x_query = {oql, oqo, url} + results.
export async function runOql(oql) {
  const url = `${urlBase.api}/?${MAILTO}`;
  const resp = await axios.post(url, { oql }, axiosConfig());
  return resp.data;
}
