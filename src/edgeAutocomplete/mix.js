// The front page's mixed list (authors, keywords, institutions, sources, topics, funders, publishers), assembled from
// the per-entity trees (#1529): one tree per type to build and refresh, and the front page sees the same entries as each
// type's own box. Ranking across types is #1504's front-page ranking (core.js rankTrie, edge-index v2); keywords are
// ordered by the keyword box's own function (core.js orderKeywords), so the two boxes cannot drift.
import { parse, norm } from "./norm.js";
import { rankTrie, orderKeywords, STOP } from "./core.js";
import { ENT, planEntity, resolveEntries, toRow, nextParentsEntity } from "./entcore.js";

export const MIX = ["authors", "keywords", "institutions", "sources", "topics", "funders", "publishers"];
const ENTITY_OF = { author: "authors", keyword: "keywords", institution: "institutions", source: "sources", topic: "topics", funder: "funders", publisher: "publishers" };

export function planMix(q, builds) {
  const parts = MIX.map((e) => planEntity(e, q, builds)).filter((p) => !p.notReady);
  return { entity: "mix", q, qs: parse(q, true).slice(0, 12), qa: parse(q, false).slice(0, 12), parts,
    keys: [...new Set(parts.flatMap((p) => p.keys))] };
}

// tree entry [id, label, display|0, works, pop*100, hint|0, cited, ext|0] -> front-page entry [t, id, label, display|0, works, pop*100, hint|0]
function asFront(t, e) {
  const f = [t, e[0], e[1], e[2], e[3], e[4], e[5]];
  f.tree = e;
  return f;
}

// labels contained whole in a long string, from the complete-word nodes along each type's chains ("ENSO Colombia
// economic impact" -> the keyword ENSO), listed below the real matches
function containedRows(p, look, nodeOf, have) {
  const extra = new Map();
  for (const part of p.parts) {
    const cfg = ENT[part.entity];
    if (cfg.kind !== "tree") continue;
    for (const c of part.chains) {
      const pre = c.keys[0].slice(0, -1);
      for (const k of c.keys) {
        const st = look(k);
        if (!k.endsWith(" ") || !(st === 1 || st === 3)) continue;
        const span = k.slice(pre.length, -1), L = span.split(" ").length;
        if (STOP.has(span) || span.length < 4) continue;
        const node = nodeOf(k);
        if (!node) continue;
        for (const e of node.e) {
          if (norm(e[1], !!cfg.greek) !== span) continue;
          if (L < 2 && (e[2] !== 0 || e[3] < 1000)) continue;
          const key = cfg.et + ":" + e[0];
          if (have.has(key)) continue;
          const s = e[4] / 100 + L - 10, prev = extra.get(key);
          if (!prev || prev.score < s) extra.set(key, { entity: part.entity, c: { id: e[0], e, label: e[2] === 0 ? null : e[1] }, score: s });
        }
      }
    }
  }
  return [...extra.values()].sort((a, b) => b.score - a.score);
}

// -> {rows: [API rows with entity_type], used, heavy, absent, local, needFill} or null when local and not answerable
export function answerMix(p, look, nodeOf, { local = false, k = 8 } = {}) {
  const used = new Set(), heavy = new Set(), absent = new Set();
  const authorE = [], frontE = [];
  for (const part of p.parts) {
    const r = resolveEntries(part, look, nodeOf, local);
    if (!r) return null;
    r.used.forEach((x) => used.add(x)); r.heavy.forEach((x) => heavy.add(x)); r.absent.forEach((x) => absent.add(x));
    if (part.entity === "authors") authorE.push(...r.entries);
    else { const t = ENT[part.entity].t; for (const e of r.entries) frontE.push(asFront(t, e)); }
  }
  const cands = new Map();
  rankTrie("a", p.qa, authorE, cands);
  rankTrie("s", p.qs, frontE, cands);
  orderKeywords(p.qs, frontE, cands, p.q);
  const tree = new Map(frontE.map((f) => [f[0] + ":" + f[1], f.tree]));
  // dedupe per (type, lower name) keeping the most works; one row per organisation name; at most one topic
  const best = new Map();
  for (const c of cands.values()) {
    const kk = c.t + ":" + c.name.toLowerCase(), b = best.get(kk);
    if (!b || c.works > b.works || (c.works === b.works && c.score > b.score)) best.set(kk, c);
  }
  const rankT = { institution: 0, publisher: 1, funder: 2 }, org = new Map();
  for (const c of best.values()) {
    if (!(c.t in rankT)) continue;
    const kk = c.name.toLowerCase(), o = org.get(kk);
    if (!o || rankT[c.t] < rankT[o.t]) org.set(kk, c);
  }
  let out = [], ntopic = 0;
  const have = new Set();
  for (const c of [...best.values()].sort((a, b) => b.score - a.score)) {
    if (c.t in rankT && org.get(c.name.toLowerCase()) !== c) continue;
    if (c.t === "topic" && ++ntopic > 1) continue;
    const entity = ENTITY_OF[c.t];
    have.add(c.t + ":" + c.id);
    out.push(entity === "authors" ? toRow(entity, c) : toRow(entity, { id: c.id, e: tree.get(ENT[entity].t + ":" + c.id), label: c.label }));
  }
  let needFill = false;
  if (out.length < 5 && p.qs.length >= 2) {
    // contained labels sit in complete-word nodes the browser usually does not hold: a local answer shows the real
    // matches at once and asks the edge to fill in the rest (needFill)
    needFill = local;
    out = out.concat(containedRows(p, look, nodeOf, have).map((x) => ({ ...toRow(x.entity, x.c), how: "contained" })));
  }
  return { rows: out.slice(0, k), used: [...used], heavy: [...heavy], absent: [...absent], local, needFill };
}

export function nextParentsMix(p, look) {
  return [...new Set(p.parts.flatMap((part) => nextParentsEntity(part, look)))].slice(0, 8);
}
