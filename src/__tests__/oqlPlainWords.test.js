// Plain words typed into the OQL statement (oxjob #1597): what the editor marks and what the
// chat is sent. The detection itself is the API's (/validate?plain_words=1, elastic-api
// query_translation/oql_plain_words.py); these lock the editor's side of the contract.
import { describe, it, expect, vi } from "vitest";
vi.mock("@/components/OqlPlayground/oqlEditorApi", () => ({
  validateOql: () => Promise.resolve({}),
}));
vi.mock("@/components/OqlPlayground/unresolvedIds", () => ({
  unresolvedIdDiagnostics: () => [],
}));
import { cmDiagnostics } from "@/components/OqlPlayground/oqlLanguage";
import { editorAsk } from "@/components/OqlPlayground/oqlComments";

const Q = "get works about kelp since 2020 but only the open access ones";
const PLAIN = {
  valid: false,
  plain_words: { start: 32, end: Q.length, text: "but only the open access ones" },
  diagnostics: [{
    code: "OQL_PLAIN_WORDS", severity: "info", start: 32, end: Q.length,
    message: "Plain words, not OQL: Ask sends them to the assistant to work into the query", fixit: null,
  }],
};

describe("plain words in the OQL editor (#1597)", () => {
  it("sends the whole statement as typed, with the query the editor opened on", () => {
    expect(editorAsk(` ${Q} `, PLAIN, "get works about kelp since 2020")).toEqual({
      kind: "plain",
      text: Q,
      currentQuery: "get works about kelp since 2020",
    });
    expect(editorAsk(Q, PLAIN, "")).toEqual({ kind: "plain", text: Q, currentQuery: null });
  });

  it("sends a # note as before: the note, applied to the editor's OQL", () => {
    expect(editorAsk("get works about kelp # only open access", PLAIN, "get works")).toEqual({
      kind: "note",
      text: "only open access",
      currentQuery: "get works about kelp",
    });
  });

  it("asks nothing when the statement has no plain words", () => {
    expect(editorAsk(Q, { valid: false, diagnostics: [] }, "x")).toBeNull();
    expect(editorAsk(Q, null, "x")).toBeNull();
    expect(editorAsk("  ", PLAIN, "x")).toBeNull();
  });

  it("marks plain words softly instead of squiggling them", () => {
    const [d] = cmDiagnostics(PLAIN, Q.length);
    expect(d).toMatchObject({ from: 32, to: Q.length, severity: "info", markClass: "cm-oql-plain-words" });
    // other info diagnostics stay hidden, as before
    expect(cmDiagnostics({ diagnostics: [{ code: "X", severity: "info", start: 0, end: 3 }] }, 10)).toEqual([]);
  });

  it("gives a typo a one-click fix", () => {
    const q = "get works about kelp snce 2020";
    const [d] = cmDiagnostics({
      valid: false,
      diagnostics: [{
        code: "OQL_TYPO", severity: "error", start: 21, end: 25, replacement: "since",
        message: "`snce` isn't an OQL word", fixit: "did you mean `since`?",
      }],
    }, q.length);
    expect(d).toMatchObject({ from: 21, to: 25, severity: "error" });
    expect(d.actions.map((a) => a.name)).toEqual(["Use “since”"]);
    const dispatched = [];
    d.actions[0].apply({ dispatch: (tr) => dispatched.push(tr) }, 21, 25);
    expect(dispatched).toEqual([{ changes: { from: 21, to: 25, insert: "since" } }]);
  });
});
