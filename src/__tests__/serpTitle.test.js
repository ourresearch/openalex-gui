import { describe, it, expect } from "vitest";
import { serpTitle } from "@/serpTitle";

describe("serpTitle (ZD 8148, oxjob #635)", () => {
    it("an OQL search names the query, without the leading 'get'", () => {
        expect(serpTitle("works", { oql: "get works about (psoriasis AND biologics)" }))
            .toBe("works about (psoriasis AND biologics)");
    });
    it("a keyword search names the words before the entity", () => {
        expect(serpTitle("works", { search: "psoriasis" })).toBe("psoriasis - Works search");
        expect(serpTitle("authors", { "search.exact": "  Smith   J " })).toBe("Smith J - Authors search");
    });
    it("no search text keeps the plain title", () => {
        expect(serpTitle("works", { filter: "type:article" })).toBe("Works search");
        expect(serpTitle("works", {})).toBe("Works search");
        expect(serpTitle("works")).toBe("Works search");
    });
    it("long queries are clipped", () => {
        const t = serpTitle("works", { search: "x".repeat(200) });
        expect(t.startsWith("x".repeat(79) + "…")).toBe(true);
    });
    it("a repeated query param uses the first value", () => {
        expect(serpTitle("works", { search: ["kelp", "algae"] })).toBe("kelp - Works search");
    });
});
