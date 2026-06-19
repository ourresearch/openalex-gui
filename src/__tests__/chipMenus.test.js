import { describe, it, expect } from "vitest";
import {
  filterPropMenu, joinMenu, closeParenMenu, valueMenu, multiSelectMenu,
} from "@/components/Oql/chipMenus";

const actions = (items) => items.filter((i) => !i.divider).map((i) => i.action);
const byKey = (items, key) => items.find((i) => i.key === key);

describe("chipMenus — filter property name", () => {
  it("non-boolean: add value (primary, dbl-click) · select another · Delete filter", () => {
    const m = filterPropMenu({ boolean: false });
    expect(actions(m)).toEqual(["add-value", "arm-select-another", "delete-filter"]);
    expect(byKey(m, "add-value").primary).toBe(true);
    expect(byKey(m, "add-value").shortcut).toEqual([{ text: "double-click" }]);
    expect(byKey(m, "delete").danger).toBe(true);
  });
  it("boolean: replaces add-value with a Not toggle reflecting negated", () => {
    const on = filterPropMenu({ boolean: true, negated: true });
    expect(actions(on)).toEqual(["toggle-neg", "arm-select-another", "delete-filter"]);
    expect(byKey(on, "not").kind).toBe("toggle");
    expect(byKey(on, "not").on).toBe(true);
    expect(byKey(filterPropMenu({ boolean: true, negated: false }), "not").on).toBe(false);
  });
  it("search field: leads with scope re-point radios (current flagged), keeping add-value below", () => {
    const scopes = [
      { column_id: "display_name.search", label: "title", current: false },
      { column_id: "title_and_abstract.search", label: "title/abstract", current: true },
      { column_id: "fulltext.search", label: "full text", current: false },
    ];
    const m = filterPropMenu({ boolean: false, searchScopes: scopes });
    expect(actions(m)).toEqual([
      "repoint-search", "repoint-search", "repoint-search",
      "add-value", "arm-select-another", "delete-filter",
    ]);
    const radios = m.filter((i) => i.action === "repoint-search");
    expect(radios.every((r) => r.kind === "radio")).toBe(true);
    expect(radios.map((r) => r.columnId)).toEqual([
      "display_name.search", "title_and_abstract.search", "fulltext.search",
    ]);
    expect(radios.filter((r) => r.on)).toHaveLength(1);
    expect(byKey(m, "scope-title_and_abstract.search").on).toBe(true);
  });
});

describe("chipMenus — join (any/all)", () => {
  it("value variant: radios reflect join, dbl-click hint on the OTHER radio, add value at front", () => {
    const m = joinMenu({ join: "all", variant: "value" });
    expect(byKey(m, "all").on).toBe(true);
    expect(byKey(m, "any").on).toBe(false);
    // double-click toggles to the one you're NOT on → hint sits on `any`
    expect(byKey(m, "any").shortcut).toEqual([{ text: "double-click" }]);
    expect(byKey(m, "all").shortcut).toBe(null);
    expect(actions(m)).toEqual(["set-join-any", "set-join-all", "add-value-front", "arm-select-another", "delete-clause"]);
  });
  it("clause variant: add reads 'add filter' / front-inserts a filter", () => {
    const m = joinMenu({ join: "any", variant: "clause" });
    expect(byKey(m, "any").on).toBe(true);
    expect(byKey(m, "add").label).toBe("add filter");
    expect(byKey(m, "add").action).toBe("add-filter-front");
  });
  it("root variant: reduced menu — toggle + Add filter + Clear filters (no select-another/delete-clause)", () => {
    const m = joinMenu({ join: "all", variant: "root" });
    expect(actions(m)).toEqual(["set-join-any", "set-join-all", "root-add-filter", "clear-query"]);
    expect(byKey(m, "clear-filters").danger).toBe(true);
  });
});

describe("chipMenus — close paren", () => {
  it("insert before (primary, dbl-click) · insert after (cmd+enter) · delete clause", () => {
    const m = closeParenMenu();
    expect(actions(m)).toEqual(["insert-before", "insert-after", "delete-clause"]);
    expect(byKey(m, "insert-before").primary).toBe(true);
    expect(byKey(m, "insert-before").shortcut).toEqual([{ text: "double-click" }]);
    expect(byKey(m, "insert-after").shortcut.slice(-1)).toEqual(["Enter"]);
  });
});

describe("chipMenus — value", () => {
  it("Edit (primary) · Not toggle · select another · insert after · Delete value", () => {
    const m = valueMenu({ negated: true, canNegate: true });
    expect(actions(m)).toEqual(["edit", "toggle-neg", "arm-select-another", "insert-after-value", "delete-value"]);
    expect(byKey(m, "edit").primary).toBe(true);
    expect(byKey(m, "not").on).toBe(true);
    expect(byKey(m, "insert-after").icon).toBe("mdi-arrow-collapse-right");
  });
  it("omits Not when the value kind can't negate (e.g. boolean handled on name chip)", () => {
    const m = valueMenu({ canNegate: false });
    expect(actions(m)).toEqual(["edit", "arm-select-another", "insert-after-value", "delete-value"]);
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
