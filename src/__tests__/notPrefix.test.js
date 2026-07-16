// oxjob #603 round 28: the value picker's "not" checkbox footer is gone — negation
// is typed on the chip ("not harvard"), and the autocomplete goes quiet while the
// input is just a prefix of the word "not".
import { describe, it, expect } from "vitest";
import { parseNotQuery } from "@/components/OqlPlayground/notPrefix";

describe("parseNotQuery", () => {
  it("suppresses autocomplete on the bare prefixes n / no / not", () => {
    for (const q of ["n", "no", "not", "N", "No", "NOT", " not"]) {
      expect(parseNotQuery(q)).toEqual({ negate: false, query: "", suppress: true });
    }
  });

  it("treats everything after 'not ' as the real query, negated", () => {
    expect(parseNotQuery("not harvard")).toEqual({ negate: true, query: "harvard", suppress: false });
    expect(parseNotQuery("NOT Harvard University"))
      .toEqual({ negate: true, query: "Harvard University", suppress: false });
  });

  it("'not ' with nothing after it arms negation with an empty query (default results)", () => {
    expect(parseNotQuery("not ")).toEqual({ negate: true, query: "", suppress: false });
  });

  it("resumes plain autocomplete the moment the input stops being a prefix of 'not'", () => {
    expect(parseNotQuery("nott")).toEqual({ negate: false, query: "nott", suppress: false });
    expect(parseNotQuery("ni")).toEqual({ negate: false, query: "ni", suppress: false });
    expect(parseNotQuery("nota")).toEqual({ negate: false, query: "nota", suppress: false });
  });

  it("passes ordinary queries through untouched", () => {
    expect(parseNotQuery("harvard")).toEqual({ negate: false, query: "harvard", suppress: false });
    expect(parseNotQuery("")).toEqual({ negate: false, query: "", suppress: false });
    expect(parseNotQuery(null)).toEqual({ negate: false, query: "", suppress: false });
  });

  it("only the word-boundary space arms negation — 'notre dame' searches normally", () => {
    expect(parseNotQuery("notre dame")).toEqual({ negate: false, query: "notre dame", suppress: false });
  });
});
