import { describe, it, expect } from "vitest";
import { facetConfigs } from "@/facetConfigs";
import { RENDER_KINDS } from "@/components/Results/Table/cellFormat";

// Guards the table-view column config. The render-kind vocabulary is closed
// (9 kinds); a typo in a `column.render.kind` across the catalog sweep would
// otherwise silently render nothing. This test fails loud instead.
describe("facetConfigs column blocks", () => {
    const all = facetConfigs(); // no entityType -> every entry across all types

    it("every column.render.kind is in the frozen vocabulary", () => {
        const offenders = all
            .filter((c) => c.column?.render)
            .filter((c) => !RENDER_KINDS.includes(c.column.render.kind))
            .map((c) => `${c.key}: ${c.column.render.kind}`);
        expect(offenders).toEqual([]);
    });

    it("every entry with a column block also declares the 'column' action", () => {
        const offenders = all
            .filter((c) => c.column)
            .filter((c) => !(c.actions || []).includes("column"))
            .map((c) => c.key);
        expect(offenders).toEqual([]);
    });

    it("the 5 Phase-1 representative entries carry their expected render kinds", () => {
        const byKey = (key) => all.find((c) => c.key === key);
        expect(byKey("publication_year").column.render).toMatchObject({ kind: "number", format: "year" });
        expect(byKey("apc_paid.value_usd").column.render).toMatchObject({ kind: "currency", currency: "USD" });
        expect(byKey("open_access.is_oa").column.render).toMatchObject({ kind: "boolean" });
        expect(byKey("authorships.author.id").column.render).toMatchObject({ kind: "entityList" });
        expect(byKey("authorships.institutions.ror").column.render).toMatchObject({ kind: "stringList" });
    });
});
