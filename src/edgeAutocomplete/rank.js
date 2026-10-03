import { norm } from "./norm.js";

export const allMatch = (qt, et) => qt.every((x) => et.some((y) => y.startsWith(x)));
export function gluedVariants(toks) {
  const out = [];
  for (let i = 1; i < toks.length; i++) out.push(toks.slice(0, i - 1).concat([[toks[i - 1][0] + toks[i][0], toks[i][1]]], toks.slice(i + 1)));
  return out;
}

// small-type entry: [id, label, display|0, works, pop*100, hint|0, cited, ext|0]
function etoksT(e, greek) {
  if (e[9] === undefined) e[9] = norm(e[1], greek).split(" ");
  return e[9];
}
// Single-type ranking (#1504, judged 2026-10-03, round 1 losses: keywords 7-13, topics 4-20): like today's tiers, a
// match on the entity's own name (or an acronym) ranks above a match on an alternative name or synonym, and a topic's
// keyword labels rank below any topic whose name matches; within a box popularity counts in full (no cross-type cap).
//
// Keywords (#1529 step 1.4, "never worse than today"; eval/kw_*.py, must-pass 276 of 278 with the exact-label build
// rule, held-out 19 to 4 against today):
//  - popularity is works only, as today's /autocomplete/keywords ranks (not the build's citation-weighted pop), weight 0.6;
//  - the synonym penalty shrinks with the popularity gap to the best name match, so the everyday name of a big keyword
//    wins ("heart att" -> myocardial infarction via "heart attacks", not "heart attack prediction");
//  - the whole typed text equal to a synonym or acronym counts as the name ("PTSD", "flu", "sports" -> sport), as today;
//  - typed in the label's own capitals ("ACA", "ML", "Intel"): the person means that label (+3);
//  - a trailing space means the next word is coming: no exact bonus ("Climate " -> climate change, as today).
export const ACRONYM = /^[A-Z0-9&.\-]{2,10}$/;
// proto: #1504's v3 ranking for every type (eval only); front: the front page orders its keyword rows by this ranking
export const KW = { proto: false, front: true };
export function rankTree(cfg, toks, entries, cands, raw = "") {
  if (!toks.length) return;
  const qt0 = toks.map(([t]) => t);
  const glued = gluedVariants(toks);
  const kw = cfg.t === "k" && !KW.proto;
  const caps = kw && /\p{Lu}/u.test(raw) ? raw.trim() : null;
  const open = /\s$/.test(raw);
  const scored = [];
  let bestNamePop = null;
  for (const e of entries) {
    const et = etoksT(e, !!cfg.greek);
    let tk = toks;
    if (!allMatch(qt0, et)) {
      tk = glued.find((g) => allMatch(g.map(([t]) => t), et));
      if (!tk) continue;
    }
    const qt = tk.map(([t]) => t), nq = qt.join(" ");
    const cpl = tk.filter(([t, c]) => c && t.length >= 2).map(([t]) => t);
    const ls = et.join(" ");
    const pop = kw ? 1.75 * Math.log10(1 + e[3]) : e[4] / 100;
    const exactToks = cpl.length > 0 && cpl.every((x) => et.includes(x));
    const prefixOnly = cpl.some((x) => !et.includes(x));
    const isName = e[2] === 0;
    const exSyn = kw && !isName && ls === nq;
    const acr = !isName && !exSyn && ACRONYM.test(e[1]);
    const alt = !isName && !acr && !exSyn ? (cfg.t === "t" ? 3 : 2) : 0;
    // organisation names ("University of Barcelona") start with generic words, so for institutions and funders the
    // typed text starting the label counts less and size more (round 2: "barcel", "tren", "aca" losses)
    const org = cfg.t === "i" || cfg.t === "f";
    const wStart = org ? 0.5 : 1.5, wPop = org ? 0.5 : kw ? 0.6 : 0.4;
    // an acronym or ISSN match counts like a word-start match on the name: no exact or label-start bonus
    // ("aca" should not put the Agencia Catalana de l'Aigua above the Chinese Academy of Sciences)
    const near = !acr && ls !== nq && ls.startsWith(nq) && ls.length <= nq.length + 2;
    const exact = !acr && ls === nq && !(kw && open);
    const s0 = wPop * pop + (acr ? 0.5 : 2 * exact + 1.0 * near + 0.5 * (" " + ls).includes(" " + nq) + wStart * ls.startsWith(nq))
      + 1.0 * exactToks - 0.5 * prefixOnly + (caps && e[1] === caps ? 3 : 0);
    if (isName || acr || exSyn) bestNamePop = bestNamePop === null ? pop : Math.max(bestNamePop, pop);
    scored.push({ e, s0, alt, pop, isName });
  }
  for (const x of scored) {
    const alt = kw && x.alt && bestNamePop !== null ? Math.max(0, x.alt - 0.5 * (x.pop - bestNamePop)) : x.alt;
    const s = x.s0 - alt, e = x.e;
    const prev = cands.get(e[0]);
    if (!prev || prev.score < s) cands.set(e[0], { id: e[0], e, score: s, label: x.isName ? null : e[1] });
  }
}
