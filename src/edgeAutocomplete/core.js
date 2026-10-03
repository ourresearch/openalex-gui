// Front-page core: query plan, chain resolution, ranking of the mixed front-page tree (from #1504 edge-proto).
import { norm, parse } from "./norm.js";
import { rankTree, KW } from "./rank.js";
export { norm, parse };

// ---- shared logic: query plan, chain resolution, filter + rank (edge-index v2 ranking) ----
export const N_LEAF = 500;
export function chainKeys(prefix, s, cap) {
  const out = [];
  for (let L = 1; L <= Math.min(s.length, cap); L++) out.push(prefix + s.slice(0, L));
  return out;
}

// The plan: every chain is the list of keys along one path of the tree (shortest first). The Worker reads every
// key of every chain in one KV bulk get; the deepest present key of a chain is its node.
//  authors 'a:'  kind 1: each token of 2+ chars (token + ' ' when complete), cap 24
//                kind 2: pair anchor|q, anchor = a complete token (or the token being typed, 3+ chars), q = the longest
//                        other token; the key exists only when the anchor is a heavy exact token; cap 16
//  others  's:'  kind 3: word-start phrase from each token to the end of the string, cap 32
export function plan(q, aPrefix = "a:", withS = true) {
  const qa = parse(q, false).slice(0, 12), qs = parse(q, true).slice(0, 12);
  const chains = [];
  const noAuthors = qa.length > 6;  // no indexed author name has 7+ tokens
  if (!noAuthors && qa.length) {
    const shortOnly = qa.every(([t]) => t.length < 2);
    qa.forEach(([t, c], i) => {
      if (t.length < 2 && !(shortOnly && i === 0)) return;
      const s = c ? t + " " : t;
      chains.push({ trie: "a", kind: 1, s, ftl: t.length, keys: chainKeys(aPrefix, s, 24) });
    });
    if (qa.length >= 2) {
      const anchors = [];
      qa.forEach(([t, c], i) => {
        if (t.length >= 2 && (c || (i === qa.length - 1 && t.length >= 3)) && !anchors.includes(t)) anchors.push(t);
      });
      for (const a of anchors.slice(0, 3)) {
        let best = null;
        qa.forEach(([u, cu], i) => { if (u !== a && (!best || u.length >= best[0].length)) best = [u, cu]; });
        if (!best) continue;
        const s = best[1] ? best[0] + " " : best[0];
        chains.push({ trie: "a", kind: 2, s, ftl: 0, keys: chainKeys(aPrefix + a + "|", s, 16) });
      }
    }
  }
  const starts = withS ? Math.min(qs.length, 10) : 0;
  for (let i = 0; i < starts; i++) {
    const rest = qs.slice(i);
    const s = rest.map(([t]) => t).join(" ") + (rest[rest.length - 1][1] ? " " : "");
    chains.push({ trie: "s", kind: 3, s, ftl: qs[i][0].length, keys: chainKeys("s:", s, 32) });
  }
  const keys = [...new Set(chains.flatMap((c) => c.keys))];
  return { q, qa, qs, chains, keys, noAuthors };
}

// look(key) -> undefined (unknown) | 0 absent | 1 leaf (node held) | 2 heavy (node not held) | 3 heavy (node held)
// -> {state: 'unknown' | 'zero' | 'none' | 'leaf' | 'heavy', key, heavy: [keys walked through], absent}
export function resolveChain(c, look) {
  const walked = [];
  let last = null, lastTok = null;
  for (let i = 0; i < c.keys.length; i++) {
    const k = c.keys[i], st = look(k);
    if (st === undefined) return { state: "unknown" };
    if (st === 0) {
      const L = i + 1;
      if (c.kind === 2) return { state: "none", absent: k, heavy: walked };
      if (L <= c.ftl) return { state: "zero", absent: k, heavy: walked };
      // exact token or the phrase beyond the first token has no match: fall back to the token-level heavy node
      if (lastTok === null) return { state: "zero", absent: k, heavy: walked };
      if (look(lastTok) === 2) return { state: "unknown" };
      return { state: "heavy", key: lastTok, absent: k, heavy: walked };
    }
    // a leaf holds every match only when its key is a prefix of the typed token itself (not the exact-token key
    // "t ", since complete tokens still match longer ones by prefix, nor a phrase further in); a pair leaf is
    // accepted as complete (edge-index § 5: exact for names holding the anchor token); a phrase leaf further in is not
    if (st === 1) return { state: "leaf", key: k, heavy: walked, superset: c.kind === 2 || i + 1 <= c.ftl };
    walked.push(k); last = k;
    if (i + 1 <= c.ftl + 1) lastTok = k;
  }
  if (last === null) return { state: "none", heavy: walked };
  if (look(last) === 2) return { state: "unknown" };
  return { state: "heavy", key: last, heavy: walked };
}

const TYPES = { k: "keyword", i: "institution", s: "source", f: "funder", p: "publisher", t: "topic" };
const R1000 = { source: 7.80, topic: 8.44, author: 6.71, keyword: 9.06, publisher: 6.36, funder: 7.32, institution: 8.78 };
const PRIOR = { keyword: 0, author: 0, institution: 0, source: -0.5, topic: -0.5, funder: -1.0, publisher: -1.0 };
export const STOP = new Set(["with", "from", "into", "over", "under", "between", "among", "using", "based", "role", "effect", "effects",
  "study", "analysis", "impact", "case", "review", "their", "that", "this", "what", "which", "about", "como", "para", "pour",
  "dans", "and", "the", "for", "des", "les", "una", "con", "por", "dan", "yang", "der", "die", "und"]);

function scoreV2(pop, etype, exact, phrase, start, exactToks, isName, prefixOnly, single) {
  const r = etype === "author" || etype === "keyword" ? R1000[etype] : Math.max(R1000[etype], 8.0);
  return Math.min(pop - r, 1.0) + PRIOR[etype] + 0.01 * pop + 2 * exact + 0.5 * phrase + 1.0 * start
    + 1.0 * exactToks - 0.5 * prefixOnly + 1.0 * isName + (etype === "author" && single ? -1 : 0);
}

// entry tokens, memoised on the entry array (index 9)
function etoks(e, trie) {
  if (e[9] === undefined) e[9] = trie === "a" ? norm(e[1], false).split(" ") : norm(e[2], true).split(" ");
  return e[9];
}

const allMatch = (qt, et) => qt.every((x) => et.some((y) => y.startsWith(x)));

export function rankTrie(trie, toks, entries, cands) {
  if (!toks.length) return;
  const qt0 = toks.map(([t]) => t);
  // also try each adjacent pair of typed tokens glued together ("yann le cu" -> "yann lecu" finds Yann LeCun)
  const glued = [];
  for (let i = 1; i < toks.length; i++) {
    glued.push(toks.slice(0, i - 1).concat([[toks[i - 1][0] + toks[i][0], toks[i][1]]], toks.slice(i + 1)));
  }
  for (const e of entries) {
    const et = etoks(e, trie);
    let tk = toks;
    if (!allMatch(qt0, et)) {
      tk = glued.find((g) => allMatch(g.map(([t]) => t), et));
      if (!tk) continue;
    }
    const qt = tk.map(([t]) => t), nq = qt.join(" ");
    const cpl = tk.filter(([t, c]) => c && t.length >= 2).map(([t]) => t);
    const single = tk.length === 1;
    const ls = et.join(" ");
    const etype = trie === "a" ? "author" : TYPES[e[0]];
    const pop = (trie === "a" ? e[3] : e[5]) / 100;
    const exactToks = cpl.length > 0 && cpl.every((x) => et.includes(x));
    const prefixOnly = cpl.some((x) => !et.includes(x));
    const isName = trie === "s" && e[3] === 0;
    const s = scoreV2(pop, etype, ls === nq, (" " + ls).includes(" " + nq), ls.startsWith(nq), exactToks, isName, prefixOnly, single);
    const id = trie === "a" ? String(e[0]) : e[1];
    const key = etype + ":" + id;
    const prev = cands.get(key);
    if (!prev || prev.score < s) {
      cands.set(key, trie === "a"
        ? { t: etype, id, name: e[1], works: e[2], hint: e[4] || null, cited: e[5] ?? null, orcid: e[6] || null, score: s }
        : { t: etype, id, name: e[3] || e[2], label: e[3] ? e[2] : null, works: e[4], hint: e[6] || null, score: s });
    }
  }
}

// keyword/topic (etc.) labels contained whole in a long string, from the token-boundary nodes along phrase chains
export function contained(plan, nodeOf, presentKeys, have) {
  const extra = new Map();
  const qt = plan.qs.map(([t]) => t);
  for (const c of plan.chains) {
    if (c.trie !== "s") continue;
    for (const k of c.keys) {
      if (!k.endsWith(" ") || !presentKeys(k)) continue;
      const span = k.slice(2, -1);
      const L = span.split(" ").length;
      if (STOP.has(span) || span.length < 4) continue;
      const node = nodeOf(k);
      if (!node) continue;
      for (const e of node.e) {
        if (etoks(e, "s").join(" ") !== span) continue;
        if (L < 2 && (e[3] !== 0 || e[4] < 1000)) continue;
        const etype = TYPES[e[0]], key = etype + ":" + e[1];
        if (have.has(key)) continue;
        const s = e[5] / 100 + L - 10;
        const prev = extra.get(key);
        if (!prev || prev.score < s) extra.set(key, { t: etype, id: e[1], name: e[3] || e[2], label: e[3] ? e[2] : null, works: e[4], hint: e[6] || null, score: s, how: "contained" });
      }
    }
  }
  return [...extra.values()].sort((a, b) => b.score - a.score);
}

// -> {rows, used: [node keys], heavy: [keys], absent: [keys], local: bool} or null when local and not answerable
//    look: see resolveChain; nodeOf(key) -> parsed node {l, n, e}; presentKeys(key) -> bool (node available)
export function answer(p, look, nodeOf, opts = {}) {
  const { local = false, k = 8, rank = true } = opts;
  const used = new Set(), heavy = new Set(), absent = new Set(), keysBy = {};
  for (const trie of ["a", "s"]) {
    if (trie === "a" && p.noAuthors) continue;
    const chains = p.chains.filter((c) => c.trie === trie);
    if (!chains.length) continue;
    const res = chains.map((c) => resolveChain(c, look));
    for (const r of res) { for (const h of r.heavy || []) heavy.add(h); if (r.absent) absent.add(r.absent); }
    if (res.some((r) => r.state === "zero")) continue;
    if (local && !(res.some((r) => r.state === "leaf" && r.superset) || res.every((r) => r.state !== "unknown"))) return null;
    const keys = [...new Set(res.filter((r) => r.state === "leaf" || r.state === "heavy").map((r) => r.key))];
    for (const key of keys) used.add(key);
    if (!rank) continue;
    keysBy[trie] = keys;
  }
  if (!rank) return { rows: [], used: [...used], heavy: [...heavy], absent: [...absent], local };
  const { rows, needFill } = mixRows(p, keysBy, look, nodeOf, { local, k });
  return { rows, used: [...used], heavy: [...heavy], absent: [...absent], local, needFill };
}

// keywords on the front page are ordered by the keyword box's own ranking (rank.js rankTree), so the two cannot drift
// (#1529 step 1.4): the keyword candidates keep their front-page scores as slots in the mix, handed out in the keyword
// box's order.
export function orderKeywords(qs, entries, cands, raw) {
  const kws = [...cands.values()].filter((c) => c.t === "keyword");
  if (kws.length < 2) return;
  // front-page entry [type, id, label, display|0, works, pop*100, hint] -> keyword-tree entry [id, label, display|0, works, pop*100]
  // (kept on the entry, so a node cached across requests keeps its normalised tokens instead of re-normalising every
  // keyword label on every request)
  const conv = entries.filter((e) => e[0] === "k").map((e) => e.kwConv || (e.kwConv = [e[1], e[2], e[3] || 0, e[4], e[5]]));
  const tree = new Map();
  rankTree({ t: "k", greek: true }, qs, conv, tree, raw);
  const slots = kws.map((c) => c.score).sort((a, b) => b - a);
  const byId = new Map(kws.map((c) => [c.id, c]));
  let i = 0;
  for (const t of [...tree.values()].sort((a, b) => b.score - a.score)) {
    const c = byId.get(t.id);
    if (c) c.score = slots[i++];
  }
}

// rank the nodes each tree resolved to (keysBy: {a: [...], s: [...]}) into the front-page mix
export function mixRows(p, keysBy, look, nodeOf, { local = false, k = 8 } = {}) {
  const cands = new Map();
  for (const trie of ["a", "s"]) {
    if (!keysBy[trie]) continue;
    const entries = [];
    for (const key of keysBy[trie]) { const n = nodeOf(key); if (n) for (const e of n.e) entries.push(e); }
    rankTrie(trie, trie === "a" ? p.qa : p.qs, entries, cands);
    if (trie === "s" && KW.front) orderKeywords(p.qs, entries, cands, p.q);
  }
  // dedupe per (type, lower name) keeping the most works; one row per organisation name; at most one topic
  const best = new Map();
  for (const c of cands.values()) {
    const kk = c.t + ":" + c.name.toLowerCase();
    const b = best.get(kk);
    if (!b || c.works > b.works || (c.works === b.works && c.score > b.score)) best.set(kk, c);
  }
  const rankT = { institution: 0, publisher: 1, funder: 2 };
  const org = new Map();
  for (const c of best.values()) {
    if (!(c.t in rankT)) continue;
    const kk = c.name.toLowerCase(), o = org.get(kk);
    if (!o || rankT[c.t] < rankT[o.t]) org.set(kk, c);
  }
  let out = [], ntopic = 0;
  for (const c of [...best.values()].sort((a, b) => b.score - a.score)) {
    if (c.t in rankT && org.get(c.name.toLowerCase()) !== c) continue;
    if (c.t === "topic" && ++ntopic > 1) continue;
    out.push(c);
  }
  let needFill = false;
  if (out.length < 5 && p.qs.length >= 2) {
    // the fallback reads token-boundary nodes the browser usually does not hold: a local answer shows the real
    // matches at once and asks the edge to fill in the contained-keyword rows (needFill)
    needFill = local;
    const have = new Set(out.map((c) => c.t + ":" + c.id));
    out = out.concat(contained(p, nodeOf, (key) => { const s = look(key); return s === 1 || s === 3; }, have));
  }
  return { rows: out.slice(0, k), needFill };
}

export function entityUrl(r) {
  const pre = { author: "A", institution: "I", source: "S", funder: "F", publisher: "P", topic: "T" }[r.t];
  return r.t === "keyword" ? "https://openalex.org/keywords/" + encodeURIComponent(r.id) : "https://openalex.org/" + pre + r.id;
}

// One keystroke ahead: the paths whose deepest node is a heavy node at the very end of the typed string are the
// ones the next character extends. The browser asks the Worker for those nodes' children (/next) in the background,
// so the next keystroke can be answered locally. Returns the parent keys (at most 8).
export const NEXT_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789 ";
export function nextParents(p, look) {
  const out = new Set();
  for (const c of p.chains) {
    const r = resolveChain(c, look);
    const end = c.keys[c.keys.length - 1];
    if (r.state === "heavy" && r.key === end && c.keys.length < (c.trie === "s" ? 32 : c.kind === 2 ? 16 : 24)) out.add(end);
  }
  return [...out].slice(0, 8);
}
