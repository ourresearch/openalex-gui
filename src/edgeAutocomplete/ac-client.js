// The browser side of edge autocomplete (oxjob #1529; #1504 edge-entities), for any text box, filter-value dialog or
// OQL editor. No debounce: call complete() on every input event. It answers from index nodes it already holds when it
// can (no request), otherwise asks the edge once, and fetches one keystroke ahead in the background.
//
//   import { EdgeAutocomplete } from "./ac-client.js";
//   const ac = new EdgeAutocomplete({ base: "https://api.openalex.org/edge" });
//   input.onfocus = () => ac.warm("institutions");               // opens the connection; loads the closed lists
//   input.oninput = async () => {
//     const r = await ac.complete("institutions", input.value);  // {rows, mode, ms, stale, q, entity}
//     if (!r.stale) render(r.rows);                               // rows: today's /autocomplete/<entity> shape
//   };
//
// entity: any key of ENT (authors, awards, concepts, funders, institutions, keywords, publishers, sources, topics,
// subfields, fields, domains, countries, continents, languages, sdgs, licenses, work-types, source-types,
// institution-types) or "mix" (the front page's mixed list; rows carry entity_type). One complete() in flight per
// entity: a newer call resolves the older one at once with {stale: true}; a late edge response still feeds the cache,
// and may answer the newest pending call early. peek(entity, q) is the synchronous local answer (or null), for an
// editor's first paint. rows is null when the edge failed (mode "error"): the caller falls back to today's endpoint.
//
// Keys carry each type's live build (<t>:<build>:<prefix>); the client learns the builds from every response, so
// after a rebuild it simply stops matching the old build's nodes.
import { ENT, entityOf, planEntity, answerEntity, listAnswer, nextParentsEntity, NEXT_CHARS } from "./entcore.js";
import { planMix, answerMix, nextParentsMix } from "./mix.js";

const GET = { credentials: "omit", mode: "cors" };   // a simple GET: no cookies, no custom headers, no preflight

export class EdgeAutocomplete {
  constructor({ base = "", fetch: f = null, prefetch = true, maxNodes = 6000, onEvent = null } = {}) {
    this.base = base.replace(/\/$/, "");
    this.f = f || ((u, o) => globalThis.fetch(u, o));
    this.prefetch = prefetch;
    this.maxNodes = maxNodes;
    this.onEvent = onEvent || (() => {});
    this.builds = {};
    this.nodes = new Map(); this.heavy = new Set(); this.absent = new Set();
    this.asked = new Set();
    this.pending = new Map();   // entity -> {seq, q, p, resolve, t0}
    this.seq = 0;
    this.lists = null; this.listsP = null;
    this.warmed = false;
    this.look = (k) => { const n = this.nodes.get(k); if (n) return n.l ? 1 : 3; if (this.heavy.has(k)) return 2; if (this.absent.has(k)) return 0; return undefined; };
    this.nodeOf = (k) => this.nodes.get(k) || null;
  }

  // call on focus: warms TLS + HTTP/2 to the edge and loads the closed vocabularies once
  warm(entity) {
    if (!this.warmed) { this.warmed = true; this.f(this.base + "/noop", GET).catch(() => {}); }
    const e = entityOf(entity);
    if (e && ENT[e].kind === "list") this.loadLists().catch(() => {});
  }
  loadLists() {
    if (!this.listsP) {
      const t = performance.now();
      this.listsP = this.f(this.base + "/lists", GET).then((r) => { if (!r.ok) throw new Error("lists " + r.status); return r.json(); })
        .then((d) => { this.lists = d.lists; this.learn(d.builds); this.onEvent({ type: "lists", net: performance.now() - t }); return d.lists; })
        .catch((e) => { this.listsP = null; throw e; });
    }
    return this.listsP;
  }

  learn(builds) { if (builds) Object.assign(this.builds, builds); }
  ingest(d) {
    if (this.nodes.size > this.maxNodes) { this.nodes.clear(); this.heavy.clear(); this.absent.clear(); this.asked.clear(); }
    for (const k in d.nodes) this.nodes.set(k, d.nodes[k]);
    for (const k of d.heavy || []) this.heavy.add(k);
    for (const k of d.absent || []) this.absent.add(k);
  }

  plan(entity, q) { return entity === "mix" ? planMix(q, this.builds) : planEntity(entity, q, this.builds); }
  // null when the browser cannot answer by itself (including a type whose build it has not learned yet). The front-page
  // mix is always asked of the edge, rows only: its nodes span ~6 types (~120 KB gzipped per keystroke, 2026-10-03),
  // too much to ship for local answers; one small request is faster.
  local(entity, p) {
    if (entity === "mix") return null;
    if (p.notReady) return null;
    return answerEntity(p, this.look, this.nodeOf, { local: true, k: 10 });
  }

  peek(entity, q) {
    entity = entity === "mix" ? "mix" : entityOf(entity);
    if (!q.trim()) return [];
    if (entity !== "mix" && ENT[entity].kind === "list") return this.lists ? listAnswer(entity, q, this.lists[entity] || []) : null;
    const r = this.local(entity, this.plan(entity, q));
    return r ? r.rows : null;
  }

  complete(entity, q, { onUpdate = null } = {}) {
    entity = entity === "mix" ? "mix" : entityOf(entity);
    const t0 = performance.now(), my = ++this.seq;
    const prev = this.pending.get(entity);
    if (prev && !prev.done) { prev.done = true; prev.resolve({ q: prev.q, entity, rows: null, stale: true }); }
    return new Promise((resolve) => {
      const cur = { seq: my, q, t0, resolve, done: false };
      this.pending.set(entity, cur);
      const finish = (rows, mode, extra = {}) => {
        if (cur.done) return;
        cur.done = true;
        resolve({ q, entity, rows, mode, ms: performance.now() - t0, stale: false, ...extra });
        if (this.prefetch && mode !== "list" && mode !== "error") setTimeout(() => this.prefetchNext(entity, q), 0);
      };
      if (!q.trim()) return finish([], "local");
      if (entity !== "mix" && ENT[entity].kind === "list") {
        if (this.lists) return finish(listAnswer(entity, q, this.lists[entity] || []), "list");
        // the list is not here yet: ask the edge too and take whichever answers first
        this.loadLists().then((l) => finish(listAnswer(entity, q, l[entity] || []), "list")).catch(() => {});
        this.edge(entity, q, cur, finish);
        return;
      }
      cur.p = this.plan(entity, q);
      const tc = performance.now();
      const r = this.local(entity, cur.p);
      if (r) {
        finish(r.rows, "local", { calc: performance.now() - tc });
        if (r.needFill) this.fill(q, my, onUpdate);
        return;
      }
      this.edge(entity, q, cur, finish);
    });
  }

  url(entity, q) {
    return entity === "mix" ? `${this.base}/ac?lite=1&q=${encodeURIComponent(q)}` : `${this.base}/autocomplete/${entity}?q=${encodeURIComponent(q)}`;
  }

  edge(entity, q, cur, finish) {
    const tf = performance.now();
    this.f(this.url(entity, q), GET).then((res) => { if (!res.ok) throw new Error("edge " + res.status); return res.json(); }).then((d) => {
      const net = performance.now() - tf;
      this.learn(d.meta && d.meta.edge && d.meta.edge.builds);
      this.ingest(d);
      const t = d.meta.edge || {};
      const stale = cur.done;
      this.onEvent({ type: "edge", entity, q, net, stale, t0: tf, ...t });
      if (!stale) return finish(d.results, "edge", { net, kv: t.kv, colo: t.colo });
      // superseded: its nodes may answer the newest pending keystroke now
      const now = this.pending.get(entity);
      if (now && !now.done) {
        now.p = this.plan(entity, now.q);
        const r2 = this.local(entity, now.p);
        if (r2) { now.done = true; now.resolve({ q: now.q, entity, rows: r2.rows, mode: "local", early: true, ms: performance.now() - now.t0, stale: false });
          if (this.prefetch) setTimeout(() => this.prefetchNext(entity, now.q), 0); }
      }
    }).catch((err) => { this.onEvent({ type: "error", entity, q, error: String(err) }); if (!cur.done) finish(null, "error"); });
  }

  // second tier for long front-page strings: labels contained whole in the string, added below the real matches
  fill(q, my, onUpdate) {
    const tf = performance.now();
    this.f(this.url("mix", q), GET).then((r) => r.json()).then((d) => {
      this.learn(d.meta && d.meta.edge && d.meta.edge.builds);
      this.ingest(d);
      this.onEvent({ type: "fill", entity: "mix", q, net: performance.now() - tf, stale: my !== this.seq, t0: tf });
      if (onUpdate && this.pending.get("mix")?.seq === my) onUpdate(d.results);
    }).catch(() => {});
  }

  // one keystroke ahead: children of the heavy nodes the next character would extend
  prefetchNext(entity, q) {
    if (!q.trim() || entity === "mix") return;
    const p = this.plan(entity, q);
    const ps = (entity === "mix" ? nextParentsMix(p, this.look) : nextParentsEntity(p, this.look)).filter((k) => !this.asked.has(k));
    if (!ps.length) return;
    ps.forEach((k) => this.asked.add(k));
    const tf = performance.now();
    this.f(`${this.base}/next?${ps.map((k) => "p=" + encodeURIComponent(k)).join("&")}`, GET)
      .then((r) => r.json()).then((d) => {
        this.ingest({ nodes: d.nodes, heavy: [], absent: d.absent });
        this.onEvent({ type: "next", entity, q, net: performance.now() - tf, ps, t0: tf, ...d.t });
        const now = this.pending.get(entity);
        if (now && !now.done && now.p) {
          const r2 = this.local(entity, now.p);
          if (r2) { now.done = true; now.resolve({ q: now.q, entity, rows: r2.rows, mode: "local", early: true, ms: performance.now() - now.t0, stale: false });
            setTimeout(() => this.prefetchNext(entity, now.q), 0); }
        }
      }).catch(() => ps.forEach((k) => this.asked.delete(k)));
  }

  clear() { this.nodes.clear(); this.heavy.clear(); this.absent.clear(); this.asked.clear(); }
}
export { ENT, NEXT_CHARS };
