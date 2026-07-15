// oxjob #603 round 26c: `?oql=` URLs are BARE — annotations are stripped at the
// single URL-serialization point (see oqlSerialize.js for the direction decision).
import { describe, it, expect } from "vitest";
import { oqlForUrl, stripOqlAnnotations } from "@/oqlSerialize";

describe("stripOqlAnnotations", () => {
  it("strips a display-name annotation after a slug value", () => {
    expect(stripOqlAnnotations("works where keyword is (machine-learning [Machine learning])"))
      .toBe("works where keyword is (machine-learning)");
  });

  it("strips an annotation after an OpenAlex ID", () => {
    expect(stripOqlAnnotations("works where institution is I136199984 [Harvard University]"))
      .toBe("works where institution is I136199984");
  });

  it("strips [no entity found] markers after a value", () => {
    expect(stripOqlAnnotations("works where author is A99 [no entity found]"))
      .toBe("works where author is A99");
  });

  it("strips every annotation in a multi-value bag, preserving commas", () => {
    expect(stripOqlAnnotations("works where keyword is any (a [A], b [B])"))
      .toBe("works where keyword is any (a, b)");
  });

  it("handles an annotation abutting its value with no space", () => {
    expect(stripOqlAnnotations("works where institution is I123[Harvard]"))
      .toBe("works where institution is I123");
  });

  it("preserves a LONE annotation — it is the value ref itself", () => {
    expect(stripOqlAnnotations("works where institution is [Harvard]"))
      .toBe("works where institution is [Harvard]");
  });

  it("preserves a lone annotation after an opening paren or comma", () => {
    expect(stripOqlAnnotations("works where institution is any ([Harvard], I123 [MIT])"))
      .toBe("works where institution is any ([Harvard], I123)");
  });

  it("never touches bracket text inside a quoted string", () => {
    expect(stripOqlAnnotations('works where title has "climate [zones] rising"'))
      .toBe('works where title has "climate [zones] rising"');
  });

  it("strips an annotation that follows a quoted value", () => {
    expect(stripOqlAnnotations('works where title has "climate" [why not]'))
      .toBe('works where title has "climate"');
  });

  it("copies unterminated constructs verbatim (server is the validator)", () => {
    expect(stripOqlAnnotations("works where keyword is (x [oops")).toBe("works where keyword is (x [oops");
    expect(stripOqlAnnotations('works where title has "unclosed [x]')).toBe('works where title has "unclosed [x]');
  });

  it("is identity on annotation-free OQL", () => {
    const s = "works where type is (article) and year >= (2020)";
    expect(stripOqlAnnotations(s)).toBe(s);
  });
});

describe("oqlForUrl", () => {
  it("still collapses newline-bearing whitespace runs and trims", () => {
    expect(oqlForUrl("works\n  where year >= 2020\n")).toBe("works where year >= 2020");
  });

  it("still preserves internal spacing of quoted phrases", () => {
    expect(oqlForUrl('works where title has "academic  teacher"'))
      .toBe('works where title has "academic  teacher"');
  });

  it("strips annotations from the URL form (round 26c)", () => {
    expect(oqlForUrl("works where\n  keyword is (machine-learning [Machine learning])"))
      .toBe("works where keyword is (machine-learning)");
  });

  it("equates the annotated render canonical with the bare execute canonical", () => {
    const rendered = "works where keyword is (machine-learning [Machine learning]) and year >= (2020)";
    const executed = "works where keyword is (machine-learning) and year >= (2020)";
    expect(oqlForUrl(rendered)).toBe(oqlForUrl(executed));
  });
});
