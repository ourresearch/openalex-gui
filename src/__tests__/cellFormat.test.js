import { describe, it, expect } from "vitest";
import { buildCell, cellToText, RENDER_KINDS } from "@/components/Results/Table/cellFormat";

describe("cellFormat", () => {
    describe("blank handling", () => {
        it("renders empty for null/undefined/empty-array", () => {
            expect(buildCell(null, { kind: "text" }).empty).toBe(true);
            expect(buildCell(undefined, { kind: "number" }).empty).toBe(true);
            expect(buildCell([], { kind: "entityList" }).empty).toBe(true);
        });
        it("renders empty when render config is missing", () => {
            expect(buildCell("x", null).empty).toBe(true);
            expect(buildCell("x", {}).empty).toBe(true);
        });
        it("treats boolean false as meaningful, not blank", () => {
            const cell = buildCell(false, { kind: "boolean" }, ["No", "Yes"]);
            expect(cell.empty).toBe(false);
            expect(cellToText(cell)).toBe("No");
        });
    });

    describe("number", () => {
        it("groups default numbers", () => {
            expect(cellToText(buildCell(12345, { kind: "number" }))).toBe("12,345");
        });
        it("compacts large numbers", () => {
            expect(cellToText(buildCell(1500000, { kind: "number", format: "compact" }))).toMatch(/1\.5M/i);
        });
    });

    describe("year", () => {
        it("renders years without grouping", () => {
            expect(cellToText(buildCell(2024, { kind: "year" }))).toBe("2024");
        });
        it("truncates a numeric year", () => {
            expect(cellToText(buildCell(2024.0, { kind: "year" }))).toBe("2024");
        });
    });

    describe("currency", () => {
        it("formats USD with a dollar sign and grouping", () => {
            expect(cellToText(buildCell(2500, { kind: "currency", currency: "USD" }))).toBe("$2,500");
        });
    });

    describe("boolean", () => {
        it("uses booleanValues labels", () => {
            expect(cellToText(buildCell(true, { kind: "boolean" }, ["Closed", "Open Access"]))).toBe("Open Access");
            expect(cellToText(buildCell(false, { kind: "boolean" }, ["Closed", "Open Access"]))).toBe("Closed");
        });
    });

    describe("date", () => {
        it("strips the time portion of an ISO datetime", () => {
            expect(cellToText(buildCell("2024-03-01T00:00:00", { kind: "date" }))).toBe("2024-03-01");
        });
    });

    describe("code", () => {
        it("looks up language names", () => {
            expect(cellToText(buildCell("en", { kind: "code", codebook: "languages" }))).toBe("English");
        });
        it("looks up country names", () => {
            expect(cellToText(buildCell("US", { kind: "code", codebook: "countries" }))).toMatch(/United States/);
        });
        it("falls back to the raw code when unknown", () => {
            expect(cellToText(buildCell("zz", { kind: "code", codebook: "languages" }))).toBe("zz");
        });
    });

    describe("entityLink", () => {
        it("renders the label and an internal entity id", () => {
            const cell = buildCell(
                { id: "https://openalex.org/A5023888391", display_name: "Jane Doe" },
                { kind: "entityLink" }
            );
            expect(cell.multi).toBe(false);
            expect(cell.items[0].text).toBe("Jane Doe");
            expect(cell.items[0].entityId).toBe("https://openalex.org/A5023888391");
        });
        it("renders id-less pseudo-objects as plain text (no link)", () => {
            const cell = buildCell({ id: null, display_name: "Raw Name" }, { kind: "entityLink" });
            expect(cell.items[0].text).toBe("Raw Name");
            expect(cell.items[0].entityId).toBeUndefined();
        });
    });

    describe("entityList", () => {
        it("renders a multi cell of linked names", () => {
            const cell = buildCell(
                [
                    { id: "https://openalex.org/A1", display_name: "Author One" },
                    { id: "https://openalex.org/A2", display_name: "Author Two" },
                ],
                { kind: "entityList" }
            );
            expect(cell.multi).toBe(true);
            expect(cellToText(cell)).toBe("Author One, Author Two");
            expect(cell.items[0].entityId).toBe("https://openalex.org/A1");
        });
    });

    describe("stringList", () => {
        it("auto-linkifies URL strings (e.g. ROR)", () => {
            const cell = buildCell(["https://ror.org/02mhbdp94"], { kind: "stringList" });
            expect(cell.items[0].url).toBe("https://ror.org/02mhbdp94");
            expect(cell.items[0].text).toBe("https://ror.org/02mhbdp94");
        });
        it("applies a linkPattern", () => {
            const cell = buildCell(["0000-0001"], { kind: "stringList", linkPattern: "https://orcid.org/{value}" });
            expect(cell.items[0].url).toBe("https://orcid.org/0000-0001");
        });
        it("renders bare IDs from entity objects when bareId is set (auto-ID column)", () => {
            const cell = buildCell(
                [
                    { id: "https://openalex.org/A5023888391", display_name: "Jane" },
                    { id: null, display_name: "Raw Name" },
                ],
                { kind: "stringList", bareId: true }
            );
            // id-less pseudo-object dropped; bare native form for the real one.
            expect(cellToText(cell)).toBe("A5023888391");
        });
        it("renders bare IDs for external namespaces (SDG)", () => {
            const cell = buildCell(
                [{ id: "https://metadata.un.org/sdg/2", display_name: "Zero Hunger" }],
                { kind: "stringList", bareId: true }
            );
            // Header carries the "SDG IDs" namespace; the cell shows the bare id.
            expect(cellToText(cell)).toBe("2");
        });
    });

    it("never invents a render kind outside the frozen vocabulary", () => {
        expect(RENDER_KINDS).toHaveLength(10);
    });
});
