import { describe, it, expect } from "vitest";
import { buildIdMap, reconcileTreeIds } from "@/components/Oql/reconcileIds";

// Minimal tree builders mirroring the server's `oql_render_v2` shape.
const vleaf = (id, value) => ({ node: "vleaf", id, value });
const vgroup = (id, children) => ({ node: "vgroup", id, join: "or", children });
const clause = (id, value) => ({ node: "clause", id, column_id: "c", value });
const group = (id, children) => ({ node: "group", id, join: "and", implicit: true, children });
// a root with a `lines` token stream whose token ids reference the structure ids
const root = (where, tokenIds) => ({
  where,
  lines: [{ tokens: tokenIds.map((id) => ({ t: "vbrick", id })) }],
});

describe("buildIdMap", () => {
  it("maps isomorphic value-bag reorder server->local by position", () => {
    // local (post-move) order: cherry, apple, banana with stable ids n3,n1,n2
    const local = clause("n5", vgroup("n4", [vleaf("n3", "cherry"), vleaf("n1", "apple"), vleaf("n2", "banana")]));
    // server canonical render of the SAME order, freshly renumbered s1..s5
    const server = clause("s5", vgroup("s4", [vleaf("s3", "cherry"), vleaf("s1", "apple"), vleaf("s2", "banana")]));
    const map = {};
    expect(buildIdMap(server, local, map)).toBe(true);
    expect(map).toEqual({ s5: "n5", s4: "n4", s3: "n3", s1: "n1", s2: "n2" });
  });

  it("rejects a differing child count (non-isomorphic)", () => {
    const local = vgroup("n4", [vleaf("n1", "a"), vleaf("n2", "b")]);
    const server = vgroup("s4", [vleaf("s1", "a")]);
    const map = {};
    expect(buildIdMap(server, local, map)).toBe(false);
  });

  it("rejects a differing node kind", () => {
    const local = clause("n1", vleaf("n2", "a"));
    const server = group("s1", [clause("s2", vleaf("s3", "a"))]);
    const map = {};
    expect(buildIdMap(server, local, map)).toBe(false);
  });
});

describe("reconcileTreeIds", () => {
  it("rewrites server ids to local ids in BOTH structure and lines on a match", () => {
    const local = { where: group("n3", [clause("n2", vleaf("n2", "x")), clause("n1", vleaf("n1", "y"))]) };
    const serverWhere = group("s3", [clause("s2", vleaf("s2b", "x")), clause("s1", vleaf("s1b", "y"))]);
    const server = root(serverWhere, ["s2", "s2b", "s1", "s1b"]);

    expect(reconcileTreeIds(server, local)).toBe(true);
    // structure remapped
    expect(server.where.id).toBe("n3");
    expect(server.where.children.map((c) => c.id)).toEqual(["n2", "n1"]);
    expect(server.where.children.map((c) => c.value.id)).toEqual(["n2", "n1"]);
    // lines token stream remapped consistently (shares ids with the structure)
    expect(server.lines[0].tokens.map((t) => t.id)).toEqual(["n2", "n2", "n1", "n1"]);
  });

  it("returns false and does NOT mutate when shapes diverge", () => {
    const local = { where: vgroup("n4", [vleaf("n1", "a"), vleaf("n2", "b")]) };
    const server = root(vgroup("s4", [vleaf("s1", "a")]), ["s1"]);
    expect(reconcileTreeIds(server, local)).toBe(false);
    expect(server.where.id).toBe("s4"); // untouched
    expect(server.lines[0].tokens[0].id).toBe("s1");
  });

  it("returns false when either tree lacks a where", () => {
    expect(reconcileTreeIds({}, { where: vleaf("n1", "a") })).toBe(false);
    expect(reconcileTreeIds({ where: vleaf("s1", "a") }, {})).toBe(false);
  });

  it("leaves genuinely-new (unmapped) server ids intact under an isomorphic prefix", () => {
    // identical shape, but the matched ids are remapped; this guards the rewrite never
    // invents a mapping for ids it didn't pair.
    const local = { where: vgroup("n4", [vleaf("n1", "a")]) };
    const server = root(vgroup("s4", [vleaf("s1", "a")]), ["s1", "ghost"]);
    expect(reconcileTreeIds(server, local)).toBe(true);
    expect(server.lines[0].tokens.map((t) => t.id)).toEqual(["n1", "ghost"]);
  });
});
