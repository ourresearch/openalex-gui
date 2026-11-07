// API calls for the OQL editor (oxjob #357).
//
// The editor endpoints (/parse-context, /oql-phrases, /validate) and the OQL execution
// surface, called directly with the shared axios auth/base config; name lookups go through
// the site's own api.getAutocomplete (edge, small lists, awards) so they rank like the
// rest of the site.
//
// Every round-trip is timed (performance.now) and pushed to a rolling latency
// buffer — the charter decision-3 "measure keystroke latency before any JS port"
// gate. Read the stats via latencyStats().

import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig";
import { api } from "@/api";
import { idTail } from "./oqlLinks";

const MAILTO = "mailto=ui@openalex.org";

// --- rolling latency instrumentation -----------------------------------------
const _samples = { "parse-context": [], phrases: [], validate: [] };
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

// Every phrase of a statement with its help where it stands, for hover help and click-to-change
// (GET /oql-phrases, oxjob #1597): [{start, end, value, kind, detail, doc, choice}], code-point
// offsets. One call per text, cached; a failure answers [] and is asked again next time.
const _phrases = new Map();
export function getPhrases(q) {
  if (!_phrases.has(q)) {
    if (_phrases.size > 20) _phrases.delete(_phrases.keys().next().value);
    _phrases.set(q, _timed("phrases", async () => {
      const url = `${urlBase.api}/oql-phrases?${MAILTO}&q=${encodeURIComponent(q)}`;
      const resp = await axios.get(url, axiosConfig());
      return Array.isArray(resp.data?.phrases) ? resp.data.phrases : [];
    }).catch(() => {
      _phrases.delete(q);
      return [];
    }));
  }
  return _phrases.get(q);
}

// Full OQL -> { valid, oql, oqo, oxurl, diagnostics:[{code,message,fixit,severity,start,end}] }
// `plainWords` (the IDE editor, oxjob #1597): a statement that doesn't read also says whether
// it holds plain words for the assistant (`plain_words: {start, end, text, rest}`, with an
// OQL_PLAIN_WORDS info diagnostic) or a typo (one OQL_TYPO error with its `replacement`).
export async function validateOql(q, { plainWords = false } = {}) {
  return _timed("validate", async () => {
    const url = `${urlBase.api}/validate?${MAILTO}&q=${encodeURIComponent(q)}` +
      (plainWords ? "&plain_words=1" : "");
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
    const url = `${urlBase.api}/${entityType}?${MAILTO}&per-page=200&page=${page}&select=id,display_name`;
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

// Values of a group_by-picked closed vocabulary (awards provenance / funding_type,
// locations version, …; see groupByVocab.js): the column's own group_by buckets over
// the whole entity, most common first, cached for the session. There is no list
// endpoint to page through, so `truncated` flags a full page — the vocabulary may then
// hold values the list doesn't show, and the picker offers the typed text as-is.
export const GROUP_BY_VOCAB_PAGE = 200;
const _groupByVocabCache = {};
export async function getGroupByValues(entity, key) {
  const ck = `${entity}|${key}`;
  if (_groupByVocabCache[ck]) return _groupByVocabCache[ck];
  const groups = await api.getGroups(entity, key, { hideUnknown: true, perPage: GROUP_BY_VOCAB_PAGE });
  const values = (groups || [])
    .filter((g) => g && g.value != null && g.value !== "")
    .map((g) => ({ value: String(g.value), display_name: String(g.displayValue || g.value), count: g.count }));
  const out = { values, truncated: values.length >= GROUP_BY_VOCAB_PAGE };
  _groupByVocabCache[ck] = out;
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

function _row(kind, r) {
  const tail = idTail(r.id);
  return {
    kind,
    id: tail,
    name: r.display_name || tail,
    hint: r.hint || null,
    works_count: typeof r.works_count === "number" ? r.works_count : null,
  };
}

// The site's own lookup for each kind (edge autocomplete, the small lists, awards), the
// kinds' rows interleaved most likely kind first.
async function _search(kinds, query) {
  const per = await Promise.all(kinds.map((k) =>
    api.getAutocomplete(k, { q: query }).then((rows) => (rows || []).slice(0, 8).map((r) => _row(k, r)))
      .catch(() => [])));
  return per.flatMap((rows) => (kinds.length === 1 ? rows : rows.slice(0, 6))).slice(0, 14);
}

// Entities named like `q`, for an OQL link slot: the kinds the grammar wants there (the
// parser names them), most likely first. Rows: {kind, id, name, hint, works_count}. Cached for
// the session (a click on a name looks its whole name up again).
const _searches = new Map();
export function searchEntities(kinds, q) {
  const query = (q || "").trim();
  if (!query || !kinds || !kinds.length) return Promise.resolve([]);
  const key = `${kinds.join(",")}\u0000${query.toLowerCase()}`;
  if (!_searches.has(key)) {
    if (_searches.size > 300) _searches.clear();
    _searches.set(key, _search(kinds, query).catch((e) => {
      _searches.delete(key);
      throw e;
    }));
  }
  return _searches.get(key);
}

// One entity's API record, for the hover card (cached for the session).
const _records = new Map();
// The ids of the top `n` entities named like `q` ("John Smith" -> authors), most works first:
// a name match, not full-text search (which surfaced unrelated people, #1744).
export async function searchEntityIds(kind, q, n = 4) {
  const name = String(q).replace(/[,:|]/g, " ");
  const url = `${urlBase.api}/${kind}?${MAILTO}&filter=display_name.search:${encodeURIComponent(name)}`
    + `&sort=works_count:desc&per_page=${n}&select=id`;
  const r = await axios.get(url, axiosConfig());
  return (r.data?.results || []).map((x) => String(x.id).split("/").pop());
}

// A 404 (no such entity: a typo, a made-up id) stays cached as null; any other failure (a 429,
// the network) says nothing about whether it exists, so the next call asks again.
export function getEntityRecord(kind, id) {
  const key = `${kind}/${id}`;
  if (!_records.has(key)) {
    const url = `${urlBase.api}/${kind}/${encodeURIComponent(id)}?${MAILTO}`;
    _records.set(key, axios.get(url, axiosConfig()).then((r) => r.data).catch((e) => {
      if (e?.response?.status !== 404) _records.delete(key);
      return null;
    }));
    // The NL page checks every entity in every query (#1758): keep the newest 200.
    if (_records.size > 200) _records.delete(_records.keys().next().value);
  }
  return _records.get(key);
}

/** True only when the API says no such entity exists (404); false when found or unknown. */
export async function entityMissing(kind, id) {
  return (await getEntityRecord(kind, id)) === null && _records.has(`${kind}/${id}`);
}

// The grammar's phrases with plain-English help ({value, kind, detail, doc}), from the same
// tables the parser reads (GET /oql-vocabulary). null when this API doesn't serve it (404);
// any other failure throws, so the caller (oqlIde's loadVocabulary) can ask again. A fresh
// page load can send this before the user's API key arrives, and a keyless call can 429.
export function getVocabulary() {
  const url = `${urlBase.api}/oql-vocabulary?${MAILTO}`;
  return axios.get(url, axiosConfig())
    .then((r) => (Array.isArray(r.data?.phrases) ? r.data.phrases : null))
    .catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });
}
