// Ancestor-path breadcrumb for the OQL no-code builder (oxjob #487, Part 2).
//
// A slim XML/JSON-editor-style status strip shows the full humanized ancestor
// path of whatever node the user is hovering, e.g.
//
//     works all › 2 full text all › 2.1 any() › 2.1.2 cat
//
// The hovered token gives ONE dotted address (`2.1.2`). We reconstruct the whole
// path by taking every prefix of that address (`2`, `2.1`, `2.1.2`) plus the
// entity root, and labeling each from an `addr → segment` index built once over
// the committed render tree (`v2.value.where`). (D7.)
//
// DISPLAY-GLUE, no engine change (D2). #474's shipped addresses are frozen. A
// clause whose value is a group has an UNADDRESSED value-root join (the `all` in
// `full text has all (…)`): rather than re-spec the engine, we treat joins purely
// as a display concern — the value-root join GLUES onto its clause segment
// (`2 full text all`), the root conjunction glues onto the entity (`works all`),
// and every nested value/clause group shows its own join word (`2.1 any()`).
//
// Segment label rules (D4), keyed on the v2 node kind:
//   root (entity + root join)            `works all`            (no address shown)
//   clause, value is a group             `‹addr› ‹field› ‹join›`  `2 full text all`
//   clause, simple / single value        `‹addr› ‹field›`         `3 title`
//   group (value group or clause group)  `‹addr› ‹join›()`        `2.1 any()`
//   value (entity→name; else literal)     `‹addr› ‹display›`       `2.1.2 cat`
//   boolean (atomic, one fused phrase)    `‹addr› ‹phrase›`        `4 it's open access`

export function joinWord(join) {
  return join === "or" ? "any" : "all";
}

// Spelled-out count for the multi-select footer message ("two chips selected").
// Small numbers read better as words; anything past the table falls back to digits.
const _NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];
export function numberWord(n) {
  return _NUMBER_WORDS[n] != null ? _NUMBER_WORDS[n] : String(n);
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
  const clauseField = (n) => fieldLabelFor(n.column_id, n.column);

  // A value subtree: a vleaf is a value; a vgroup is a nested group (own join).
  function walkValue(n, base) {
    if (n.node === "vleaf") {
      put(base, "value", valueDisplay(n));
      return;
    }
    put(base, "group", joinWord(n.join) + "()");
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
        // value is a group → the value-root join glues onto the clause segment, in
        // parens for readability: `full text(all)`, `type(any)` (D2).
        put(base, "clause", `${clauseField(n)}(${joinWord(v.join)})`);
        v.children.forEach((c, i) => walkValue(c, base.concat(i + 1)));
      } else if (v && v.node === "vleaf") {
        put(base, "clause", clauseField(n));
        put(base.concat(1), "value", valueDisplay(v));
      } else {
        // simple clause: the scalar value rides `.1`, read from the display segments
        put(base, "clause", clauseField(n));
        const sv = (n.segments || []).find((s) => s.kind === "value");
        if (sv) put(base.concat(1), "value", sv.text);
      }
      return;
    }
    put(base, "group", joinWord(n.join) + "()");
    n.children.forEach((c, i) => walkExpr(c, base.concat(i + 1)));
  }

  if (where && where.node === "group" && where.implicit) {
    index.set("0", { kind: "root", label: `${entityLabel}(${joinWord(where.join)})` });
    where.children.forEach((c, i) => walkExpr(c, [i + 1]));
  } else {
    // a single top-level clause (no root group / no `0`) or an empty query: the
    // resting root segment is still the entity (default join `all`). (D5.)
    index.set("0", { kind: "root", label: `${entityLabel}(all)` });
    if (where) walkExpr(where, [1]);
  }
  return index;
}

// Build the breadcrumb segment array for a hovered dotted address. The root
// segment (`works all`) leads with no address; each successive prefix of the
// address contributes one `‹prefix› ‹label›` segment. An address with no index
// entry (chrome / nothing hovered) yields just the root segment. (D5/D7.)
export function pathForAddr(addr, index) {
  const segs = [];
  const root = index && index.get("0");
  if (root) segs.push(root.label);
  if (!index || addr == null || addr === "" || addr === "0") return segs;
  const parts = String(addr).split(".");
  for (let i = 1; i <= parts.length; i += 1) {
    const e = index.get(parts.slice(0, i).join("."));
    if (e) segs.push(`${parts.slice(0, i).join(".")} ${e.label}`);
  }
  return segs;
}
