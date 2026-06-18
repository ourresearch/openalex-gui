import { describe, it, expect } from "vitest";
import { reconcileTreeIds, rewriteIds, sig } from "@/components/Oql/reconcileIds";

// Minimal tree builders mirroring the server's `oql_render_v2` shape.
const vleaf = (id, value) => ({ node: "vleaf", id, value });
const vgroup = (id, children) => ({ node: "vgroup", id, join: "or", children });
const clause = (id, column_id, value) => ({ node: "clause", id, column_id, value });
const group = (id, children, extra = {}) => ({ node: "group", id, join: "and", implicit: true, children, ...extra });
// a root with a `lines` token stream whose token ids reference the structure ids
const root = (where, tokenIds) => ({
  where,
  lines: [{ tokens: tokenIds.map((id) => ({ t: "vbrick", id })) }],
});

const idsOf = (node, out = []) => {
  if (Array.isArray(node)) { node.forEach((n) => idsOf(n, out)); return out; }
  if (node && typeof node === "object") {
    if (node.node && node.id) out.push(node.id);
    for (const k in node) if (k !== "id") idsOf(node[k], out);
  }
  return out;
};

describe("sig", () => {
  it("pairs leaves by value, clauses by column, groups by kind", () => {
    expect(sig(vleaf("x", "apple"))).toBe(sig(vleaf("y", "apple")));
    expect(sig(vleaf("x", "apple"))).not.toBe(sig(vleaf("y", "banana")));
    expect(sig(clause("a", "type"))).toBe(sig(clause("b", "type")));
    expect(sig(clause("a", "type"))).not.toBe(sig(clause("b", "year")));
  });
});

describe("reconcileTreeIds — survivors keep ids", () => {
  it("value-bag REORDER: all leaves keep their local ids, in the new order", () => {
    const local = root(clause("n5", "t", vgroup("n4", [vleaf("n3", "cherry"), vleaf("n1", "apple"), vleaf("n2", "banana")])), []);
    const server = root(clause("s5", "t", vgroup("s4", [vleaf("s3", "cherry"), vleaf("s1", "apple"), vleaf("s2", "banana")])), ["s5", "s4", "s3", "s1", "s2"]);
    expect(reconcileTreeIds(server, local)).toBe(true);
    expect(server.where.value.children.map((c) => `${c.id}:${c.value}`))
      .toEqual(["n3:cherry", "n1:apple", "n2:banana"]);
    // lines token ids carried over too
    expect(server.lines[0].tokens.map((t) => t.id)).toEqual(["n5", "n4", "n3", "n1", "n2"]);
  });

  it("ADD a sibling row: existing rows keep ids, the new row gets a fresh minted id", () => {
    const local = root(group("n3", [clause("n1", "cited_by_count"), clause("n2", "type")]), []);
    // server re-rendered with a new third clause, all renumbered
    const server = root(group("s3", [clause("s1", "cited_by_count"), clause("s2", "type"), clause("s9", "title_and_abstract.search")]),
      ["s3", "s1", "s2", "s9"]);
    expect(reconcileTreeIds(server, local)).toBe(true);
    const kids = server.where.children;
    expect(kids[0].id).toBe("n1"); // survivor
    expect(kids[1].id).toBe("n2"); // survivor
    expect(kids[2].id).toMatch(/^g\d+$/); // new → minted
    // no id collisions across the whole tree
    const all = idsOf(server);
    expect(new Set(all).size).toBe(all.length);
  });

  it("DELETE a sibling row: the remaining rows keep their ids", () => {
    const local = root(group("n3", [clause("n1", "a"), clause("n2", "b"), clause("n7", "c")]), []);
    const server = root(group("s3", [clause("s1", "a"), clause("s2", "c")]), ["s3", "s1", "s2"]); // 'b' deleted
    expect(reconcileTreeIds(server, local)).toBe(true);
    expect(server.where.children.map((c) => `${c.id}:${c.column_id}`)).toEqual(["n1:a", "n7:c"]);
  });

  it("ADD a value to an existing bag: old values keep ids, new value minted, no collisions", () => {
    const local = root(clause("n5", "t", vgroup("n4", [vleaf("n1", "apple"), vleaf("n2", "banana")])), []);
    const server = root(clause("s5", "t", vgroup("s4", [vleaf("s1", "apple"), vleaf("s2", "banana"), vleaf("s8", "cherry")])),
      ["s5", "s4", "s1", "s2", "s8"]);
    expect(reconcileTreeIds(server, local)).toBe(true);
    const vals = server.where.value.children;
    expect(`${vals[0].id}:${vals[0].value}`).toBe("n1:apple");
    expect(`${vals[1].id}:${vals[1].value}`).toBe("n2:banana");
    expect(vals[2].value).toBe("cherry");
    expect(vals[2].id).toMatch(/^g\d+$/);
    const all = idsOf(server);
    expect(new Set(all).size).toBe(all.length);
  });

  it("never produces duplicate ids even when fresh server ids overlap local ids", () => {
    // server's fresh ids (n1,n2,n3) overlap the local id space (n1,n2,n5) — the classic collision trap
    const local = root(group("n5", [clause("n1", "a"), clause("n2", "b")]), []);
    const server = root(group("n3", [clause("n1", "a"), clause("n2", "b"), clause("n4", "c")]),
      ["n3", "n1", "n2", "n4"]);
    expect(reconcileTreeIds(server, local)).toBe(true);
    const all = idsOf(server);
    expect(new Set(all).size).toBe(all.length);
  });

  it("returns false when either tree lacks a where", () => {
    expect(reconcileTreeIds({}, { where: vleaf("n1", "a") })).toBe(false);
    expect(reconcileTreeIds({ where: vleaf("s1", "a") }, {})).toBe(false);
  });
});

describe("rewriteIds", () => {
  it("leaves unmapped ids (e.g. the `works` keyword) untouched", () => {
    const tree = { lines: [{ tokens: [{ t: "kw", id: "works" }, { t: "vbrick", id: "s1" }] }] };
    rewriteIds(tree, { s1: "n1" });
    expect(tree.lines[0].tokens.map((t) => t.id)).toEqual(["works", "n1"]);
  });
});
