// #557 row-subject highlighter regression lock: verb clauses carry no operator
// word, so the tokenizer needs the verb phrase itself (bug: whole clause,
// value included, colored field-violet and W-ids lost atom styling).
import { describe, it, expect, vi } from "vitest";
vi.mock("@/components/OqlPlayground/oqlEditorApi", () => ({
  validateOql: () => Promise.resolve({}),
}));
vi.mock("@/components/OqlPlayground/unresolvedIds", () => ({
  unresolvedIdDiagnostics: () => [],
}));
import { oqlSyntax } from "@/components/OqlPlayground/oqlLanguage";

// drive the StreamLanguage tokenizer directly
function tokenize(text) {
  const lang = oqlSyntax()[0]; // StreamLanguage instance
  const sp = lang.streamParser;
  const state = sp.startState(4);
  const { StringStream } = require("@codemirror/language");
  const stream = new StringStream(text, 4, 2);
  const out = [];
  while (!stream.eol()) {
    stream.start = stream.pos;
    const style = sp.token(stream, state);
    out.push([text.slice(stream.start, stream.pos), style]);
  }
  return out.filter(([txt]) => txt.trim() !== "");
}

const roleOf = (toks, word) => toks.find(([txt]) => txt === word)?.[1];

describe("row-subject highlighting (#557)", () => {
  it("canonical it cites (…) — value gets atom styling", () => {
    const toks = tokenize("works where it cites (W2741809807)");
    expect(roleOf(toks, "it")).toBe("field");
    expect(roleOf(toks, "cites")).toBe("relation");
    expect(roleOf(toks, "W2741809807")).toBe("atom");
  });
  it("it's cited by (…)", () => {
    const toks = tokenize("works where it's cited by (W123456)");
    expect(roleOf(toks, "it's")).toBe("field");
    expect(roleOf(toks, "cited")).toBe("relation");
    expect(roleOf(toks, "by")).toBe("relation");
    expect(roleOf(toks, "W123456")).toBe("atom");
  });
  it("bare verb form cites (…)", () => {
    const toks = tokenize("works where cites (W123456)");
    expect(roleOf(toks, "cites")).toBe("field");
    expect(roleOf(toks, "W123456")).toBe("atom");
  });
  it("legacy cited by is (…) unchanged", () => {
    const toks = tokenize("works where cited by is (W123456)");
    expect(roleOf(toks, "cited")).toBe("field");
    expect(roleOf(toks, "is")).toBe("relation");
    expect(roleOf(toks, "W123456")).toBe("atom");
  });
  it("clause group after conjunction not poisoned by earlier rs flag", () => {
    const toks = tokenize("works where cites (W1234567) and (year is (2020) or year is (2021))");
    // the "year" inside the group must still color as field
    expect(roleOf(toks, "year")).toBe("field");
    expect(roleOf(toks, "2020")).toBe("number");
  });
  it("ordinary clauses unaffected", () => {
    const toks = tokenize("works where title has (climate) and year is (2020)");
    expect(roleOf(toks, "title")).toBe("field");
    expect(roleOf(toks, "has")).toBe("relation");
    expect(roleOf(toks, "climate")).toBe("value");
    expect(roleOf(toks, "2020")).toBe("number");
  });
  it("mixed chain: it cites mid-chain", () => {
    const toks = tokenize("works where title has (foo) and it cites (W99999) and year is (2020)");
    expect(roleOf(toks, "it")).toBe("field");
    expect(roleOf(toks, "cites")).toBe("relation");
    expect(roleOf(toks, "W99999")).toBe("atom");
    expect(roleOf(toks, "year")).toBe("field");
  });
});
