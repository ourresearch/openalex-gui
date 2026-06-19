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

import { cmdLabel } from "./platformKeys";

// ---- shortcut hint presets --------------------------------------------------
const DBLCLICK = [{ text: "double-click" }];
const CMD_ENTER = [cmdLabel, "Enter"];
const CMD_CLICK = [cmdLabel, { text: "click" }];
const DEL = ["⌫"];

const SELECT_ANOTHER = {
  key: "select-another",
  icon: "mdi-cursor-default-click-outline",
  label: "select another",
  shortcut: CMD_CLICK,
  action: "arm-select-another",
};

// ---- filter property name chip ---------------------------------------------
// e.g. `title has`. Primary (double-click) = add a value. A BOOLEAN filter's name chip also
// carries its value, so its `add value` row is replaced by a `Not` negation toggle.
// A SEARCH filter (title / title-abstract / full text — the three curated surfaces, passed in as
// `searchScopes` = searchFieldSiblings output) leads with a scope re-point: radios that switch
// WHICH text the filter searches, keeping the typed value (Jason 2026-06-19, the operator-change
// ask). Non-search fields pass no `searchScopes` and get no scope section.
export function filterPropMenu({ boolean = false, negated = false, searchScopes = [] } = {}) {
  const head = boolean
    ? { key: "not", kind: "toggle", on: !!negated, label: "Not", action: "toggle-neg", primary: true }
    : { key: "add-value", icon: "mdi-plus", label: "add value", shortcut: DBLCLICK, action: "add-value", primary: true };
  const scope = searchScopes.length
    ? [
        ...searchScopes.map((s) => ({
          key: `scope-${s.column_id}`, kind: "radio", on: !!s.current, label: s.label,
          action: "repoint-search", columnId: s.column_id,
        })),
        { divider: true },
      ]
    : [];
  return [
    ...scope,
    head,
    { ...SELECT_ANOTHER },
    { divider: true },
    { key: "delete", icon: "mdi-trash-can-outline", label: "Delete filter", shortcut: DEL, action: "delete-filter", danger: true },
  ];
}

// ---- join method chip (`any(` / `all(`) ------------------------------------
// Block includes the open paren; double-click toggles any⇄all, so the double-click hint sits
// on whichever radio you're NOT currently on. Three variants:
//   • 'value'  — leads a value group (`title has any( … )`); add value inserts at the FRONT.
//   • 'clause' — leads a subclause of whole filters; "add value" reads "add filter".
//   • 'root'   — the top-level `works where all(`; reduced menu: toggle + Add filter + Clear
//                filters (no select-another / delete — you don't delete the query body). [Q2]
export function joinMenu({ join = "all", variant = "value" } = {}) {
  const isAny = join === "any";
  const items = [
    { key: "any", kind: "radio", on: isAny, label: "any", subtitle: "<b>OR</b> joins list items",
      action: "set-join-any", shortcut: isAny ? null : DBLCLICK },
    { key: "all", kind: "radio", on: !isAny, label: "All", subtitle: "<b>AND</b> joins list items",
      action: "set-join-all", shortcut: !isAny ? null : DBLCLICK },
    { divider: true },
  ];
  if (variant === "root") {
    items.push(
      { key: "add-filter", icon: "mdi-plus", label: "Add filter", action: "root-add-filter" },
      { key: "clear-filters", icon: "mdi-trash-can-outline", label: "Clear filters", action: "clear-query", danger: true },
    );
    return items;
  }
  const addsFilters = variant === "clause";
  items.push(
    { key: "add", icon: "mdi-plus", label: addsFilters ? "add filter" : "add value",
      action: addsFilters ? "add-filter-front" : "add-value-front" },
    { ...SELECT_ANOTHER },
    { divider: true },
    { key: "delete-clause", icon: "mdi-trash-can-outline", label: "Delete this clause", action: "delete-clause", danger: true },
  );
  return items;
}

// ---- close paren chip (`)`) -------------------------------------------------
// The `+` is gone (Jason: "the close paren is plenty"). Primary (double-click) = insert a
// sibling clause BEFORE this one; insert after = Cmd/Ctrl+Enter.
export function closeParenMenu() {
  return [
    { key: "insert-before", icon: "mdi-arrow-up-bold-box-outline", label: "Insert before",
      shortcut: DBLCLICK, action: "insert-before", primary: true },
    { key: "insert-after", icon: "mdi-arrow-down-bold-box-outline", label: "insert after",
      shortcut: CMD_ENTER, action: "insert-after" },
    { divider: true },
    { key: "delete-clause", icon: "mdi-trash-can-outline", label: "delete clause", action: "delete-clause", danger: true },
  ];
}

// ---- value chip -------------------------------------------------------------
// Primary (double-click) = Edit. `Not` is an inline negation toggle (kept for the kinds that
// can negate — text/entity/date; a boolean's negation lives on its name chip instead).
export function valueMenu({ negated = false, canNegate = true } = {}) {
  const items = [
    { key: "edit", icon: "mdi-pencil-outline", label: "Edit", shortcut: DBLCLICK, action: "edit", primary: true },
  ];
  if (canNegate) items.push({ key: "not", kind: "toggle", on: !!negated, label: "Not", action: "toggle-neg" });
  items.push(
    { divider: true },
    { ...SELECT_ANOTHER },
    { key: "insert-after", icon: "mdi-arrow-collapse-right", label: "insert after", shortcut: CMD_ENTER, action: "insert-after-value" },
    { divider: true },
    { key: "delete", icon: "mdi-trash-can-outline", label: "Delete value", action: "delete-value", danger: true },
  );
  return items;
}

// ---- multi-selection menu (cmd-click set; opens on cmd release) -------------
// Controls the whole homogeneous selection. `kind` ∈ values | filters | clauses drives the
// Delete label. Wrap-into-subclause is disabled when the set can't legally group.
export function multiSelectMenu({ kind = "values", canWrap = false } = {}) {
  return [
    { key: "wrap", icon: "mdi-code-parentheses", label: "Wrap into subclause", action: "wrap-subclause", disabled: !canWrap },
    { ...SELECT_ANOTHER },
    { key: "unselect-all", icon: "mdi-close", label: "Unselect all", action: "unselect-all" },
    { divider: true },
    { key: "delete-selected", icon: "mdi-trash-can-outline", label: `Delete selected ${kind}`, action: "delete-selected", danger: true },
  ];
}
