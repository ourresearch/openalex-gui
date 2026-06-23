// chipMenus.js — the per-chip dropdown menu CONTENTS for the OQL builder (oxjob #475
// design pivot, Jason 2026-06-19). Pure functions: given a chip's normalized descriptor
// they return the menu's items array (the shape OqlChipMenu.vue renders). No Vue / tree
// deps so they're trivially unit-tested; the builder maps each item's `action` string onto
// a v2Edit op and owns positioning/dismiss.
//
// Item shape (see OqlChipMenu.vue):
//   { key, icon, label, subtitle?, shortcut?, action, primary?, danger?, disabled?,
//     kind?: 'radio'|'toggle', on?, divider? }
// shortcut segments: a plain STRING is a keycap; a { text } object is a plain word (a click
// gesture — no keycap pill), per Jason's spec (keyboard combos = keycaps, clicks = words).

// ---- shortcut hint presets --------------------------------------------------
// Double-click was removed (Jason 2026-06-22): the only chip gestures are single-click (opens
// this menu) and the keyboard shortcuts below. Edit a value with Enter; delete with ⌫.
const ENTER = ["enter"];
const DEL = ["⌫"];

// ---- filter property name chip ---------------------------------------------
// e.g. `title has`. Primary (double-click) = add a value. A BOOLEAN filter's name chip also
// carries its value, so its `add value` row is replaced by a `Not` negation toggle.
// A SEARCH filter (title / title-abstract / full text — the three curated surfaces, passed in as
// `searchScopes` = searchFieldSiblings output) leads with a scope re-point: radios that switch
// WHICH text the filter searches, keeping the typed value (Jason 2026-06-19, the operator-change
// ask). Non-search fields pass no `searchScopes` and get no scope section.
// A NUMERIC/range filter (year, cited_by_count, …) instead leads with an operator (predicate)
// re-pick: radios for ≥ / = / ≤ passed in as `operators` (each { op, label, on }). To the user
// it's "change this chip"; to us it's swapping the comparison predicate (Jason 2026-06-22, #475).
// We only ever OFFER the three (strict >/< are reachable by ±1), but a strict >/< that arrives
// via OQL still renders + round-trips — it just leaves all three radios unflagged.
export function filterPropMenu({ boolean = false, negated = false, searchScopes = [], operators = [] } = {}) {
  // oxjob #494: the "add value" item is gone — values are added by clicking the gap in the
  // value list (the click-the-gap affordance). A BOOLEAN filter still leads with its Negate
  // toggle (it carries its value); a non-boolean prop chip's menu is just structural ops.
  const head = boolean
    ? { key: "not", kind: "toggle", on: !!negated, label: "Negate (NOT)", action: "toggle-neg", primary: true }
    : null;
  const scope = searchScopes.length
    ? [
        ...searchScopes.map((s) => ({
          key: `scope-${s.column_id}`, kind: "radio", on: !!s.current, label: s.label,
          action: "repoint-search", columnId: s.column_id,
        })),
        { divider: true },
      ]
    : [];
  const ops = operators.length
    ? [
        ...operators.map((o) => ({
          key: `op-${o.op}`, kind: "radio", on: !!o.on, label: o.label,
          action: "set-operator", op: o.op,
        })),
        { divider: true },
      ]
    : [];
  return [
    ...scope,
    ...ops,
    ...(head ? [head] : []),
    { divider: true },
    { key: "delete", icon: "mdi-trash-can-outline", label: "Delete filter", shortcut: DEL, action: "delete-filter", danger: true },
  ];
}

// ---- join method chip (`(` paren) ------------------------------------------
// The group's `(` (and its matching `)`) open this menu, where the OR/AND radios switch the
// join. (Double-click toggle was removed — Jason 2026-06-22.) Three variants:
//   • 'value'  — leads a value group (`title has ( … )`); add value inserts at the FRONT.
//   • 'clause' — leads a subclause of whole filters; "add value" reads "add filter".
//   • 'root'   — the top-level query body; reduced menu: toggle + Clear filters (no delete —
//                you don't delete the query body). [Q2]
export function joinMenu({ join = "all", variant = "value" } = {}) {
  const isAny = join === "any";
  const items = [
    { key: "any", kind: "radio", on: isAny, label: "Match any (OR)", action: "set-join-any" },
    { key: "all", kind: "radio", on: !isAny, label: "Match all (AND)", action: "set-join-all" },
    { divider: true },
  ];
  // oxjob #494: "add filter"/"add value" items are gone — adding is done by clicking the gap
  // (value list or filter list). The join menu keeps only the all/any toggle + structural ops.
  if (variant === "root") {
    items.push(
      { key: "clear-filters", icon: "mdi-trash-can-outline", label: "Clear filters", action: "clear-query", danger: true },
    );
    return items;
  }
  items.push(
    { key: "delete-clause", icon: "mdi-trash-can-outline", label: "Delete this clause", action: "delete-clause", danger: true },
  );
  return items;
}

// ---- close paren chip (`)`) -------------------------------------------------
// oxjob #475 (Jason 2026-06-22): the close `)` is the SAME unit as its `(` opener, so it has NO
// menu of its own — the builder hands a `)` the IDENTICAL `joinMenu` its opener uses (selecting
// either highlights both). There's intentionally no `closeParenMenu` export anymore.

// ---- value chip -------------------------------------------------------------
// Edit (keyboard: Enter) is the primary action. `Not` is an inline negation toggle (kept for
// the kinds that can negate — text/entity/date; a boolean's negation lives on its name chip).
export function valueMenu({ negated = false, canNegate = true } = {}) {
  const items = [
    { key: "edit", icon: "mdi-pencil-outline", label: "Edit", shortcut: ENTER, action: "edit", primary: true },
  ];
  if (canNegate) items.push({ key: "not", kind: "toggle", on: !!negated, label: "Negate (NOT)", action: "toggle-neg" });
  // oxjob #494: "insert after" is gone — add a sibling value by clicking the gap next to this chip.
  items.push(
    { divider: true },
    { key: "delete", icon: "mdi-trash-can-outline", label: "Delete value", action: "delete-value", danger: true },
  );
  return items;
}

// ---- multi-selection menu (cmd-click set) -----------------------------------
// Controls the whole homogeneous selection. The ONLY affordances are wrap-into-subclause or
// delete (Jason 2026-06-22): the selection is BUILT by Cmd-click (the only multi-select gesture
// — oxjob #501), and the old "unselect all" is gone (click off / Esc clears). `kind` ∈
// values | filters drives the Delete label; wrap is disabled when the set can't legally group.
export function multiSelectMenu({ kind = "values", canWrap = false } = {}) {
  return [
    { key: "wrap", icon: "mdi-code-parentheses", label: "Wrap into subclause", action: "wrap-subclause", disabled: !canWrap },
    { divider: true },
    { key: "delete-selected", icon: "mdi-trash-can-outline", label: `Delete selected ${kind}`, action: "delete-selected", danger: true },
  ];
}
