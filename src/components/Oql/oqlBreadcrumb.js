// Ancestor-path breadcrumb for the OQL no-code builder (oxjob #487, Part 2).
//
// A slim XML/JSON-editor-style status strip shows the full humanized ancestor
// path of whatever node the user is hovering, e.g.
//
//     works › (2) full text has › (2.1) any › (2.1.2) cat
//
// The hovered token gives ONE dotted address (`2.1.2`). We reconstruct the whole
// path by taking every prefix of that address (`2`, `2.1`, `2.1.2`) plus the
// entity root, and labeling each from an `addr → segment` index built once over
// the committed render tree (`v2.value.where`). (D7.)
//
// ORIENTATION, not serialization (Jason 2026-06-19). The breadcrumb tells you where
// you are in the tree. The address is parenthesised as a coordinate — `(2.1)` — so a
// group's own join needs no `()` of its own (just `any`). A clause shows its field +
// predicate (`full text has`, matching the chip); the value-root/root join words are
// dropped (the nested value/clause GROUPS still show their join — that IS orientation).
//
// Segment label rules, keyed on the v2 node kind:
//   root (entity)                        `works`                 (no address shown)
//   clause (field + predicate)           `(‹addr›) ‹field pred›`  `(2) full text has`
//   group (value group or clause group)  `(‹addr›) ‹join›`         `(2.1) any`
//   value (entity→name; else literal)     `(‹addr›) ‹display›`      `(2.1.2) cat`
//   boolean (atomic, one fused phrase)    `(‹addr›) ‹phrase›`       `(4) it's open access`

export function joinWord(join) {
  return join === "or" ? "any" : "all";
}

// The display string of a value node (vleaf): a resolved entity name when present,
// else its bare literal — mirroring how the value chip renders (`_entityName`
// falls back to `display`). A negated value reads `not X`.
function valueDisplay(v) {
  const name = (v.entity && v.entity.display_name)
    || (v.display != null ? String(v.display) : String(v.value));
  return (v.negated ? "not " : "") + name;
}

// Build the `addr → { kind, label }` index over the committed render tree's
// `where` node. Pure: all view-specific resolution is injected via `opts`.
//   opts.entityLabel   the entity display name (`works`) for the root segment.
//   opts.fieldLabelFor (column_id, column) => friendly field label; mirror the
//                      builder's chip label (properties[col].display_name || col).
// Walks in lockstep with the server's `address_index` (oql_render_v2.py) so the
// addresses line up exactly with the `tok.addr` the hover delegation reports.
export function buildAddrIndex(where, opts = {}) {
  const entityLabel = opts.entityLabel || "results";
  const fieldLabelFor = opts.fieldLabelFor
    || ((id, col) => col || id || "field");
  const index = new Map(); // "2.1.2" -> { kind, label }
  const put = (addr, kind, label) => index.set(addr.join("."), { kind, label });
  // A clause segment shows the field PLUS its predicate, matching the field chip
  // ("title has", "type is", "full text has"). Booleans handle themselves below.
  const clauseLabel = (n) => `${fieldLabelFor(n.column_id, n.column)} ${n.operator || ""}`.trim();

  // A value subtree: a vleaf is a value; a vgroup is a nested group (own join).
  // Group segments show just the join word (`any`/`all`) — no `()`, since the
  // address is now parenthesised in the path (`(2.1) any`) and a second pair of
  // parens would read as confusing noise.
  function walkValue(n, base) {
    if (n.node === "vleaf") {
      put(base, "value", valueDisplay(n));
      return;
    }
    put(base, "group", joinWord(n.join));
    n.children.forEach((c, i) => walkValue(c, base.concat(i + 1)));
  }

  // An expression subtree: a clause (simple / grouped-value / boolean) or a
  // cross-field clause group.
  function walkExpr(n, base) {
    if (n.node === "clause") {
      if (n.clause_kind === "boolean") {
        // atomic — one fused human phrase ("it's open access"), no field/value split
        put(base, "boolean", (n.segments || []).map((s) => s.text).join("").trim());
        return;
      }
      const v = n.value;
      if (v && v.node === "vgroup") {
        // value is a group → the clause shows its field+predicate; the value-root join
        // is dropped (the nested value groups below still show their own `any`/`all`).
        put(base, "clause", clauseLabel(n));
        v.children.forEach((c, i) => walkValue(c, base.concat(i + 1)));
      } else if (v && v.node === "vleaf") {
        put(base, "clause", clauseLabel(n));
        put(base.concat(1), "value", valueDisplay(v));
      } else {
        // simple clause: the scalar value rides `.1`, read from the display segments
        put(base, "clause", clauseLabel(n));
        const sv = (n.segments || []).find((s) => s.kind === "value");
        if (sv) put(base.concat(1), "value", sv.text);
      }
      return;
    }
    put(base, "group", joinWord(n.join));
    n.children.forEach((c, i) => walkExpr(c, base.concat(i + 1)));
  }

  if (where && where.node === "group" && where.implicit) {
    // The root segment is just the entity — orientation, not serialization (the
    // root conjunction's `all`/`any` is dropped).
    index.set("0", { kind: "root", label: entityLabel });
    where.children.forEach((c, i) => walkExpr(c, [i + 1]));
  } else {
    // a single top-level clause (no root group / no `0`) or an empty query: the
    // resting root segment is still just the entity. (D5.)
    index.set("0", { kind: "root", label: entityLabel });
    if (where) walkExpr(where, [1]);
  }
  return index;
}

// Build the breadcrumb segment array for a hovered dotted address. The root
// segment (`works`) leads with no address; each successive prefix of the address
// contributes one `(‹prefix›) ‹label›` segment — the address parenthesised so it
// reads as a coordinate, not part of the label. An address with no index entry
// (chrome / nothing hovered) yields just the root segment. (D5/D7.)
export function pathForAddr(addr, index) {
  const segs = [];
  const root = index && index.get("0");
  if (root) segs.push(root.label);
  if (!index || addr == null || addr === "" || addr === "0") return segs;
  const parts = String(addr).split(".");
  for (let i = 1; i <= parts.length; i += 1) {
    const prefix = parts.slice(0, i).join(".");
    const e = index.get(prefix);
    if (e) segs.push(`(${prefix}) ${e.label}`);
  }
  return segs;
}
