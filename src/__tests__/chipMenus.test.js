import { describe, it, expect } from "vitest";
import {
  filterPropMenu, joinMenu, closeParenMenu, valueMenu, multiSelectMenu,
} from "@/components/Oql/chipMenus";

const actions = (items) => items.filter((i) => !i.divider).map((i) => i.action);
const byKey = (items, key) => items.find((i) => i.key === key);

describe("chipMenus — filter property name", () => {
  it("non-boolean: select another · Delete filter (add-value moved to click-the-gap, #494)", () => {
    const m = filterPropMenu({ boolean: false });
    expect(actions(m)).toEqual(["arm-select-another", "delete-filter"]);
    expect(byKey(m, "delete").danger).toBe(true);
  });
  it("boolean: leads with a Not toggle reflecting negated", () => {
    const on = filterPropMenu({ boolean: true, negated: true });
    expect(actions(on)).toEqual(["toggle-neg", "arm-select-another", "delete-filter"]);
    expect(byKey(on, "not").kind).toBe("toggle");
    expect(byKey(on, "not").on).toBe(true);
    expect(byKey(filterPropMenu({ boolean: true, negated: false }), "not").on).toBe(false);
  });
  it("search field: leads with scope re-point radios (current flagged)", () => {
    const scopes = [
      { column_id: "display_name.search", label: "title", current: false },
      { column_id: "title_and_abstract.search", label: "title/abstract", current: true },
      { column_id: "fulltext.search", label: "full text", current: false },
    ];
    const m = filterPropMenu({ boolean: false, searchScopes: scopes });
    expect(actions(m)).toEqual([
      "repoint-search", "repoint-search", "repoint-search",
      "arm-select-another", "delete-filter",
    ]);
    const radios = m.filter((i) => i.action === "repoint-search");
    expect(radios.every((r) => r.kind === "radio")).toBe(true);
    expect(radios.map((r) => r.columnId)).toEqual([
      "display_name.search", "title_and_abstract.search", "fulltext.search",
    ]);
    expect(radios.filter((r) => r.on)).toHaveLength(1);
    expect(byKey(m, "scope-title_and_abstract.search").on).toBe(true);
  });
  it("numeric field: leads with predicate radios (≥/=/≤), current op flagged (#475)", () => {
    const ops = [
      { op: ">=", label: "≥ greater than or equal to", on: true },
      { op: "is", label: "= equal to", on: false },
      { op: "<=", label: "≤ less than or equal to", on: false },
    ];
    const m = filterPropMenu({ boolean: false, operators: ops });
    expect(actions(m)).toEqual([
      "set-operator", "set-operator", "set-operator",
      "arm-select-another", "delete-filter",
    ]);
    const radios = m.filter((i) => i.action === "set-operator");
    expect(radios.every((r) => r.kind === "radio")).toBe(true);
    expect(radios.map((r) => r.op)).toEqual([">=", "is", "<="]);
    expect(radios.filter((r) => r.on)).toHaveLength(1);
    expect(byKey(m, "op->=").on).toBe(true);
  });
  it("numeric field with a strict op (OQL-only >): no radio flagged, still offers the three", () => {
    const ops = [
      { op: ">=", label: "≥ greater than or equal to", on: false },
      { op: "is", label: "= equal to", on: false },
      { op: "<=", label: "≤ less than or equal to", on: false },
    ];
    const radios = filterPropMenu({ boolean: false, operators: ops }).filter((i) => i.action === "set-operator");
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => r.on)).toHaveLength(0);
  });
});

describe("chipMenus — join (any/all)", () => {
  it("value variant: radios reflect join, dbl-click hint on the OTHER radio", () => {
    const m = joinMenu({ join: "all", variant: "value" });
    expect(byKey(m, "all").on).toBe(true);
    expect(byKey(m, "any").on).toBe(false);
    // double-click toggles to the one you're NOT on → hint sits on `any`
    expect(byKey(m, "any").shortcut).toEqual([{ text: "double-click" }]);
    expect(byKey(m, "all").shortcut).toBe(null);
    expect(actions(m)).toEqual(["set-join-any", "set-join-all", "arm-select-another", "delete-clause"]);
  });
  it("clause variant: same structural ops as value (adds via click-the-gap, #494)", () => {
    const m = joinMenu({ join: "any", variant: "clause" });
    expect(byKey(m, "any").on).toBe(true);
    expect(actions(m)).toEqual(["set-join-any", "set-join-all", "arm-select-another", "delete-clause"]);
  });
  it("root variant: reduced menu — toggle + Clear filters (no select-another/delete-clause)", () => {
    const m = joinMenu({ join: "all", variant: "root" });
    expect(actions(m)).toEqual(["set-join-any", "set-join-all", "clear-query"]);
    expect(byKey(m, "clear-filters").danger).toBe(true);
  });
});

describe("chipMenus — close paren", () => {
  it("delete clause only (insert before/after moved to click-the-gap, #494)", () => {
    const m = closeParenMenu();
    expect(actions(m)).toEqual(["delete-clause"]);
    expect(byKey(m, "delete-clause").danger).toBe(true);
  });
});

describe("chipMenus — value", () => {
  it("Edit (primary) · Not toggle · select another · Delete value", () => {
    const m = valueMenu({ negated: true, canNegate: true });
    expect(actions(m)).toEqual(["edit", "toggle-neg", "arm-select-another", "delete-value"]);
    expect(byKey(m, "edit").primary).toBe(true);
    expect(byKey(m, "not").on).toBe(true);
  });
  it("omits Not when the value kind can't negate (e.g. boolean handled on name chip)", () => {
    const m = valueMenu({ canNegate: false });
    expect(actions(m)).toEqual(["edit", "arm-select-another", "delete-value"]);
  });
});

describe("chipMenus — multi-select", () => {
  it("wrap (disabled when !canWrap) · select another · unselect all · Delete selected <kind>", () => {
    const m = multiSelectMenu({ kind: "filters", canWrap: false });
    expect(actions(m)).toEqual(["wrap-subclause", "arm-select-another", "unselect-all", "delete-selected"]);
    expect(byKey(m, "wrap").disabled).toBe(true);
    expect(byKey(m, "delete-selected").label).toBe("Delete selected filters");
    expect(byKey(multiSelectMenu({ kind: "values", canWrap: true }), "wrap").disabled).toBe(false);
  });
});
