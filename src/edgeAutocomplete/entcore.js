// #1504 edge-entities: per-entity autocomplete logic shared by the Worker (ESM import), the client module
// (src/ac-client.js) and the demo page (inlined by gen_ent.mjs). One adaptive prefix tree per entity type in Workers
// KV (build_entities.py), the closed vocabularies as one static list (make_lists.py), authors from the frontpage
// author tree ('a:' keys, build.py). Rows come out in today's /autocomplete/<entity> response shape.
import { norm, parse } from "./norm.js";
import { chainKeys, resolveChain, rankTrie, plan as planCombo, NEXT_CHARS } from "./core.js";
import { rankTree, gluedVariants, allMatch, ACRONYM, KW } from "./rank.js";
export { KW };

// KV keys are <t>:<build>:<prefix>, one key space per type and build (walden utils/autocomplete_edge.py). builds maps a
// type letter to its live build, from the version pointer ver:<t> (the Worker) or the responses (the client); a type
// with no live build is not read at all, so no key is ever read before its build is flipped live (#1504: KV caches
// "absent" for the whole cacheTtl).
export const prefixOf = (t, builds) => t + ":" + builds[t] + ":";
const O = "https://openalex.org/";

// kind: "tree" (per-type KV tree), "awards" (KV tree with number matching), "authors" (frontpage author tree),
// "list" (static list, filtered in memory). letter: id prefix of native ids; path: entity path in ids and short_ids.
export const ENT = {
  authors: { kind: "authors", t: "a", et: "author", fk: "authorships.author.id", letter: "A" },
  keywords: { kind: "tree", t: "k", et: "keyword", fk: "keywords.id", path: "keywords", greek: true, r1000: 8.71 },
  sources: { kind: "tree", t: "s", et: "source", fk: "primary_location.source.id", letter: "S", r1000: 7.80 },
  institutions: { kind: "tree", t: "i", et: "institution", fk: "authorships.institutions.lineage", letter: "I", r1000: 8.78, ext: "https://ror.org/" },
  funders: { kind: "tree", t: "f", et: "funder", fk: "awards.funder_id", letter: "F", r1000: 7.33, ext: "https://ror.org/" },
  concepts: { kind: "tree", t: "c", et: "concept", fk: "concepts.id", letter: "C", r1000: 9.41, ext: "https://www.wikidata.org/wiki/" },
  publishers: { kind: "tree", t: "p", et: "publisher", fk: "primary_location.source.host_organization_lineage", letter: "P", r1000: 6.36, ext: "https://www.wikidata.org/entity/" },
  topics: { kind: "tree", t: "t", et: "topic", fk: "topics.id", letter: "T", greek: true, r1000: 8.44 },
  awards: { kind: "awards", t: "g", et: "award", fk: "awards.id", letter: "G" },
  // the front page's mixed tree (mix.js); not an endpoint of its own
  _front: { kind: "tree", t: "m", et: "mix", greek: true },
  subfields: { kind: "list", et: "subfield", fk: "primary_topic.subfield.id", path: "subfields" },
  fields: { kind: "list", et: "field", fk: "primary_topic.field.id", path: "fields" },
  domains: { kind: "list", et: "domain", fk: "primary_topic.domain.id", path: "domains" },
  countries: { kind: "list", et: "country", fk: "authorships.countries", path: "countries" },
  continents: { kind: "list", et: "continent", fk: "authorships.institutions.continent", path: "continents" },
  languages: { kind: "list", et: "language", fk: "language", path: "languages" },
  sdgs: { kind: "list", et: "sdg", fk: "sustainable_development_goals.id", path: "sdgs" },
  licenses: { kind: "list", et: "license", fk: "locations.license", path: "licenses" },
  "work-types": { kind: "list", et: "type", fk: "type", path: "work-types" },
  "source-types": { kind: "list", et: "source-type", fk: "primary_location.source.type", path: "source-types" },
  "institution-types": { kind: "list", et: "institution-type", fk: "authorships.institutions.type", path: "institution-types" },
};
// the GUI also calls some of these by other names
export const ALIAS = { types: "work-types", "work-type": "work-types" };
export const entityOf = (name) => ENT[ALIAS[name] || name] ? (ALIAS[name] || name) : null;

const CAP = { tree: 32, awards: 24 };
const STOP = new Set(["of", "the", "and", "in", "for", "a", "an", "to", "on", "with", "by", "at", "from", "de", "la", "et", "des", "der",
  "und", "du", "le", "les", "el", "y", "en", "von", "zu", "da", "do", "e", "o", "di", "del", "della", "its", "as", "or"]);

// award numbers: normalised (case-folded, accents folded, every non-alphanumeric run dropped), then the suffixes that
// start at each later letter/digit group, 4+ chars, at most 5 (as build_entities.py)
export function numGroups(raw) {
  const n = norm(raw || "", false);
  if (!n) return [];
  return n.replace(/(\p{L})(\p{N})/gu, "$1 $2").replace(/(\p{N})(\p{L})/gu, "$1 $2").split(" ").filter(Boolean);
}
export function numVariants(raw) {
  const g = numGroups(raw);
  if (!g.length) return [];
  const full = g.join(""), out = [];
  for (let i = 0; i < g.length && out.length < 5; i++) {
    const v = g.slice(i).join("");
    if (v.length >= 4 || v === full) out.push(v);
  }
  return out;
}

// ---------------- plans ----------------
// Every chain is the list of keys along one path of a tree (shortest first); the reader fetches every key of every
// chain at once and takes the deepest present key of each chain as its node. grp: chains whose answers are pooled
// and checked for completeness together (awards: word chains 0, glued-number chains 1).
export function planEntity(entity, q, builds) {
  const cfg = ENT[entity];
  if (cfg.t && !(builds && builds[cfg.t])) return { entity, q, qs: [], chains: [], keys: [], notReady: true };
  if (cfg.kind === "authors") {
    const p = planCombo(q, prefixOf("a", builds), false);
    const chains = p.chains.filter((c) => c.trie === "a").map((c) => ({ ...c, grp: 0, cap: c.kind === 2 ? 16 : 24 }));
    return { entity, q, qa: p.qa, qs: [], chains, keys: [...new Set(chains.flatMap((c) => c.keys))], noAuthors: p.noAuthors };
  }
  if (cfg.kind === "list") return { entity, q, qs: parse(q, false), chains: [], keys: [] };
  const P = prefixOf(cfg.t, builds), cap = CAP[cfg.kind];
  const qs = parse(q, !!cfg.greek).slice(0, 12);
  const chains = [];
  const starts = Math.min(qs.length, 10);
  for (let i = 0; i < starts; i++) {
    // awards index no word start at a stop word: never start a chain there (unless it is all there is)
    if (cfg.kind === "awards" && STOP.has(qs[i][0]) && qs.length > 1) continue;
    const rest = qs.slice(i);
    const s = rest.map(([t]) => t).join(" ") + (rest[rest.length - 1][1] ? " " : "");
    chains.push({ trie: cfg.t, kind: 3, grp: 0, s, ftl: qs[i][0].length, cap, keys: chainKeys(P, s, cap) });
  }
  if (cfg.kind === "awards" && qs.length >= 2) {
    // award numbers typed with separators ("R01 CA-123", "EP/K035") meet the glued number variants
    const last = qs[qs.length - 1][1];
    const glue = (a) => a.map(([t]) => t).join("");
    const seen = new Set(chains.map((c) => c.s));
    const add = (s, ftl) => {
      if (seen.has(s)) return;
      seen.add(s);
      chains.push({ trie: cfg.t, kind: 4, grp: 1, s, ftl, cap, keys: chainKeys(P, s, cap) });
    };
    const g0 = glue(qs), g1 = glue(qs.slice(1));
    add(g0 + (last ? " " : ""), g0.length);
    if (qs.length >= 3) add(g1 + (last ? " " : ""), g1.length);
    // funder acronym + number: "nih r01 ca" -> "nih r01ca"
    if (qs.length >= 3) add(qs[0][0] + " " + g1 + (last ? " " : ""), qs[0][0].length);
  }
  return { entity, q, qs, chains, keys: [...new Set(chains.flatMap((c) => c.keys))] };
}

// ---------------- answers ----------------
// award entry: [id, title|0, number, funder tag, outputs, start year, pop*100]
function awardToks(e) {
  if (e[9] === undefined) {
    const t = [...norm(e[3], false).split(" "), ...(e[1] ? norm(e[1], false).split(" ") : []), ...numVariants(e[2]), ...numGroups(e[2])];
    e[9] = t.filter(Boolean);
    e[10] = numVariants(e[2]);
    e[11] = e[1] ? norm(e[1], false) : "";
    e[12] = norm(e[3], false);
  }
  return e[9];
}
function rankAwards(toks, entries, cands) {
  if (!toks.length) return;
  const qt = toks.map(([t]) => t);
  const g0 = qt.join(""), g1 = qt.slice(1).join(""), nq = qt.join(" ");
  const glued = gluedVariants(toks).map((g) => g.map(([t]) => t));
  for (const e of entries) {
    const et = awardToks(e), nv = e[10], title = e[11], tag = e[12];
    const words = allMatch(qt, et) || glued.some((g) => allMatch(g, et));
    // the number typed in pieces, or after the funder's acronym
    let tier = 0;
    const numHit = (g) => g.length >= 2 && nv.some((v) => v.startsWith(g));
    if (nv.includes(g0) || (qt.length >= 2 && tag && qt[0] === tag && nv.includes(g1))) tier = 3;
    else if (numHit(g0) || (qt.length >= 2 && tag && qt[0] === tag && numHit(g1))) tier = 2;
    if (!words && tier === 0) continue;
    if (tier === 0 && title) {
      if (title.startsWith(nq)) tier = 1.5;
      else if ((" " + title).includes(" " + nq)) tier = 1;
    }
    const s = 10 * tier + Math.log10(1 + e[4]) + ((e[5] || 1900) - 1900) / 1000 - (e[7] === 1 && tier < 3 ? 3 : 0);
    const prev = cands.get(e[0]);
    if (!prev || prev.score < s) cands.set(e[0], { id: e[0], e, score: s });
  }
}

// look(key) -> undefined (unknown) | 0 absent | 1 leaf (node held) | 2 heavy (node not held) | 3 heavy (node held)
// -> {rows: [API rows], used: [node keys], heavy, absent, local} or null when local and not answerable
export function resolveEntries(p, look, nodeOf, local = false) {
  const cfg = ENT[p.entity];
  const used = new Set(), heavy = new Set(), absent = new Set();
  const entries = [];
  if (cfg.kind === "list" || p.notReady || (cfg.kind === "authors" && p.noAuthors)) return { entries, used: [], heavy: [], absent: [] };
  const groups = new Map();
  for (const c of p.chains) { if (!groups.has(c.grp)) groups.set(c.grp, []); groups.get(c.grp).push(c); }
  const keys = new Set();
  for (const chains of groups.values()) {
    const res = chains.map((c) => resolveChain(c, look));
    for (const r of res) { for (const h of r.heavy || []) heavy.add(h); if (r.absent) absent.add(r.absent); }
    if (res.some((r) => r.state === "zero")) continue;
    if (local && !(res.some((r) => r.state === "leaf" && r.superset) || res.every((r) => r.state !== "unknown"))) return null;
    for (const r of res) if ((r.state === "leaf" || r.state === "heavy") && r.key) keys.add(r.key);
  }
  for (const key of keys) { used.add(key); const n = nodeOf(key); if (n) for (const e of n.e) entries.push(e); }
  return { entries, used: [...used], heavy: [...heavy], absent: [...absent] };
}

// look(key) -> undefined (unknown) | 0 absent | 1 leaf (node held) | 2 heavy (node not held) | 3 heavy (node held)
// -> {rows: [API rows], used: [node keys], heavy, absent, local} or null when local and not answerable
export function answerEntity(p, look, nodeOf, opts = {}) {
  const { local = false, k = 10 } = opts;
  const r = resolveEntries(p, look, nodeOf, local);
  if (!r) return null;
  return { rows: rankEntries(p, r.entries, k), used: r.used, heavy: r.heavy, absent: r.absent, local };
}

// rank the entries of the nodes a plan resolved to -> today's API rows (also used by eval/ to re-rank cached nodes)
export function rankEntries(p, entries, k = 10) {
  const cfg = ENT[p.entity];
  const cands = new Map();
  if (cfg.kind === "authors") rankTrie("a", p.qa, entries, cands);
  else if (cfg.kind === "awards") rankAwards(p.qs, entries, cands);
  else rankTree(cfg, p.qs, entries, cands, p.q);
  return [...cands.values()].sort((a, b) => b.score - a.score).slice(0, k).map((c) => toRow(p.entity, c));
}

// one row of today's /autocomplete/<entity> response
export function toRow(entity, c) {
  const cfg = ENT[entity];
  const sid = cfg.letter ? cfg.letter + c.id : c.id;
  const base = { id: O + (cfg.letter ? sid : cfg.path + "/" + sid), short_id: `${entity}/${sid}` };
  if (cfg.kind === "authors") {
    return { ...base, display_name: c.name, hint: c.hint || null, cited_by_count: c.cited ?? null, works_count: c.works,
      entity_type: cfg.et, external_id: c.orcid ? "https://orcid.org/" + c.orcid : null, filter_key: cfg.fk };
  }
  if (cfg.kind === "awards") {
    const e = c.e, yr = e[5] ? " · " + e[5] : "";
    return { ...base, display_name: e[1] || e[2], hint: e[1] ? `${e[3]} · ${e[2]}${yr}` : `${e[3]}${yr}`,
      cited_by_count: null, works_count: e[4], entity_type: cfg.et, external_id: null, filter_key: cfg.fk };
  }
  if (cfg.kind === "list") {
    const it = c.item;
    return { ...base, display_name: it[1], hint: it[5] || null, cited_by_count: it[4], works_count: it[3],
      entity_type: cfg.et, external_id: it[6] ? "https://www.wikidata.org/wiki/" + it[6] : null, filter_key: cfg.fk };
  }
  const e = c.e;
  // keywords matched only through a synonym show the synonym (as today, oxjob #1464); other types their hint
  const hint = entity === "keywords" && c.label ? c.label : (e[5] || null);
  const ext = e[7] ? (cfg.ext ? cfg.ext + e[7] : e[7]) : null;
  return { ...base, display_name: e[2] || e[1], hint, cited_by_count: e[6], works_count: e[3], entity_type: cfg.et,
    external_id: ext, filter_key: cfg.fk, ...(c.label ? { matched: c.label } : {}) };
}

// ---------------- static lists ----------------
// item: [short id, display name, [other labels], works, cited, hint|0, ext|0]
export function listAnswer(entity, q, items, k = 10) {
  const toks = parse(q, false);
  if (!toks.length) return items.slice(0, k).map((item) => toRow(entity, { id: item[0], item }));
  const qt = toks.map(([t]) => t), nq = qt.join(" ");
  const out = [];
  for (const it of items) {
    if (it[7] === undefined) it[7] = [it[1], ...it[2]].map((x) => norm(String(x), false));
    let best = -1e9;
    it[7].forEach((ls, li) => {
      const et = ls.split(" ");
      if (!allMatch(qt, et)) return;
      // same rules as the trees (round 3): an alternative name ranks below name matches, codes ("US", "cc-by") count as
      // names, size counts, label start counts a little
      const code = li > 0 && ACRONYM.test(String([it[1], ...it[2]][li]));
      const s = 2 * (ls === nq) + 0.5 * ls.startsWith(nq) + 0.5 * (" " + ls).includes(" " + nq) - (li > 0 && !code ? 2 : 0)
        + 0.6 * Math.log10(1 + it[3]);
      if (s > best) best = s;
    });
    if (best === -1e9 && nq.length >= 3 && it[7][0].includes(nq)) best = -3 + 0.1 * Math.log10(1 + it[3]);   // substring, as the GUI's local filter
    if (best > -1e9) out.push({ id: it[0], item: it, score: best });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, k).map((c) => toRow(entity, c));
}

// ---------------- one keystroke ahead ----------------
// parents whose children the next character would need (heavy deepest node at the very end of a chain)
export function nextParentsEntity(p, look) {
  const out = new Set();
  for (const c of p.chains) {
    const r = resolveChain(c, look);
    const end = c.keys[c.keys.length - 1];
    if (r.state === "heavy" && r.key === end && c.keys.length < c.cap) out.add(end);
  }
  return [...out].slice(0, 8);
}
export { NEXT_CHARS };
