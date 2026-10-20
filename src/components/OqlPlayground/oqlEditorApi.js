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
import { edgeOn, edgeSupports, edgeRows } from "@/edgeAutocomplete";

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
  // edge autocomplete (oxjob #1529): from the edge, falling back to today's endpoint on an error or no rows
  if (edgeOn() && edgeSupports(entity)) {
    const rows = await edgeRows(entity, q || "");
    if (rows) return rows;
  }
  return _timed("autocomplete", async () => {
    const url = `${urlBase.api}/autocomplete/${entity}?${MAILTO}` +
      `&q=${encodeURIComponent(q || "")}`;
    const resp = await axios.get(url, axiosConfig());
    return resp.data?.results || [];
  });
}

// Fixed-vocabulary values for an enum-kind property (#428 iter 11): properties
// whose registry entry carries an `entity_type` that is a small config entity
// (work-types, institution-types, countries, licenses, …) but whose OQO value is
// a bare slug, not an openalex_id. The vocab comes from the entity's own list
// endpoint (e.g. GET /work-types) and is cached for the session; `value` is the
// id tail (types/article -> "article", countries/JP -> "JP"), which is exactly
// what the OQL parser produces for these columns.
const _enumCache = {};
export async function getEnumValues(entityType) {
  if (_enumCache[entityType]) return _enumCache[entityType];
  const out = [];
  let page = 1;
  for (;;) {
    const url = `${urlBase.api}/${entityType}?${MAILTO}&per-page=200&page=${page}`;
    const resp = await axios.get(url, axiosConfig());
    const results = resp.data?.results || [];
    for (const r of results) {
      const tail = String(r.id || "").split("/").pop();
      out.push({ value: tail, display_name: r.display_name || tail });
    }
    const count = resp.data?.meta?.count ?? out.length;
    if (out.length >= count || !results.length) break;
    page += 1;
  }
  out.sort((a, b) => a.display_name.localeCompare(b.display_name));
  _enumCache[entityType] = out;
  return out;
}

// Run an OQL query. Mirrors api.executeOql: POST /?oql=... ; the response carries
// meta.x_query = {oql, oqo, url} + results.
export async function runOql(oql) {
  const url = `${urlBase.api}/?${MAILTO}`;
  const resp = await axios.post(url, { oql }, axiosConfig());
  return resp.data;
}

// --- IDE editor (oxjob #1597) ----------------------------------------------------

// Kinds /autocomplete/<kind> serves; the rest are small lists read whole (getEnumValues).
const _AC_KINDS = new Set(["authors", "institutions", "sources", "funders", "publishers", "topics",
  "subfields", "licenses", "keywords", "works"]);
const _LIST_KINDS = new Set(["countries", "continents", "sdgs", "fields", "domains", "languages"]);
// the mixed list names its rows' kind in the singular
const _PLURAL = { work: "works", author: "authors", source: "sources", institution: "institutions",
  funder: "funders", publisher: "publishers", topic: "topics", concept: "concepts", keyword: "keywords",
  country: "countries", subfield: "subfields", field: "fields", domain: "domains", license: "licenses" };

function _row(kind, r) {
  const tail = String(r.id || r.value || "").split("/").pop();
  return {
    kind: kind || _PLURAL[r.entity_type] || r.entity_type || null,
    id: tail,
    name: r.display_name || tail,
    hint: r.hint || null,
    works_count: typeof r.works_count === "number" ? r.works_count : null,
    cited_by_count: typeof r.cited_by_count === "number" ? r.cited_by_count : null,
  };
}

function _matchList(rows, q) {
  const s = (q || "").trim().toLowerCase();
  if (!s) return rows.slice(0, 8);
  const starts = [], words = [], inside = [];
  for (const r of rows) {
    const n = r.display_name.toLowerCase();
    if (n.startsWith(s) || r.value.toLowerCase() === s) starts.push(r);
    else if (n.split(/[\s-]+/).some((w) => w.startsWith(s))) words.push(r);
    else if (n.includes(s)) inside.push(r);
  }
  return [...starts, ...words, ...inside].slice(0, 8);
}

async function _searchKind(kind, q) {
  if (_LIST_KINDS.has(kind)) {
    const rows = await getEnumValues(kind);
    return _matchList(rows, q).map((r) => _row(kind, r));
  }
  if (_AC_KINDS.has(kind)) {
    const rows = await autocompleteEntity(kind, q);
    return rows.slice(0, 8).map((r) => _row(kind, r));
  }
  return [];
}

// Entities named like `q`, for an OQL link slot: the kinds the grammar wants there, most
// likely first; no kinds = every kind (the mixed list, plus countries). Rows:
// {kind, id, name, hint, works_count, cited_by_count}.
export async function searchEntities(kinds, q) {
  const query = (q || "").trim();
  if (!kinds || !kinds.length) {
    if (!query) return [];
    let mixed = null;
    if (edgeOn() && edgeSupports("mix")) mixed = await edgeRows("mix", query);
    if (!mixed) {
      const url = `${urlBase.api}/autocomplete?${MAILTO}&q=${encodeURIComponent(query)}`;
      mixed = (await axios.get(url, axiosConfig())).data?.results || [];
    }
    const countries = await _searchKind("countries", query).catch(() => []);
    const rows = mixed.slice(0, 8).map((r) => _row(null, r));
    return [...countries.filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 2), ...rows];
  }
  const per = await Promise.all(kinds.map((k) => _searchKind(k, query).catch(() => [])));
  const cap = kinds.length === 1 ? 10 : 6;
  return per.flatMap((rows) => rows.slice(0, cap)).slice(0, 14);
}

// One entity's API record, for the hover card (cached for the session).
const _records = new Map();
export function getEntityRecord(kind, id) {
  const key = `${kind}/${id}`;
  if (!_records.has(key)) {
    const url = `${urlBase.api}/${kind}/${encodeURIComponent(id)}?${MAILTO}`;
    _records.set(key, axios.get(url, axiosConfig()).then((r) => r.data).catch(() => {
      _records.delete(key);
      return null;
    }));
  }
  return _records.get(key);
}

// The grammar's phrases with plain-English help ({value, kind, detail, doc}), from the same
// tables the parser reads (GET /oql-vocabulary). null when this API doesn't serve it yet.
let _vocab = null;
export function getVocabulary() {
  if (!_vocab) {
    const url = `${urlBase.api}/oql-vocabulary?${MAILTO}`;
    _vocab = axios.get(url, axiosConfig())
      .then((r) => (Array.isArray(r.data?.phrases) ? r.data.phrases : null))
      .catch(() => null);
  }
  return _vocab;
}
