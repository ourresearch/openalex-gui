/**
 * treeToTokens parity (oxjob #490).
 *
 * `treeToTokens` (src/components/Oql/treeToTokens.js) is a JS port of the server's
 * `_flat_tokens` (elastic-api query_translation/oql_render_v2.py). This test proves
 * the port: for a sweep of real queries, feed the server's `oql_render_v2.where`
 * tree into treeToTokens and assert the output equals the server's own
 * `oql_render_v2.lines` token stream (concatenated).
 *
 * Comparison is modulo:
 *   - `addr` — a string address stamped by the server's render_v2 AFTER _flat_tokens;
 *     the builder computes addresses separately (buildAddrIndex/lineAddr), so
 *     treeToTokens never emits it.
 *   - whitespace-only `text` tokens — neither side emits these for these queries,
 *     but displayLines drops them anyway, so we drop them defensively.
 *
 * Fixtures live in the job dir (so the gui + elastic-api repos can keep them in
 * lockstep without coupling). Regenerate:
 *   cd ~/Documents/oxjobs/working/oql-builder-instant-commit/work/treetokens-parity
 *   python3 capture.py
 * The suite is gated on the fixture file existing — a no-op in clean CI.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { treeToTokens } from "@/components/Oql/treeToTokens";

// #490's job dir moved working/ -> archived/ when it closed; resolve whichever
// stage the fixtures live in (still a no-op in clean CI when none exists).
const FIXTURE = ["working", "done", "archived"]
  .map((stage) => path.resolve(
    __dirname,
    `../../../oxjobs/${stage}/oql-builder-instant-commit/work/treetokens-parity/fixtures.json`,
  ))
  .find((p) => fs.existsSync(p));

const haveFixtures = !!FIXTURE;

// strip server-only `addr`; drop whitespace-only `text` tokens.
const norm = (toks) =>
  (toks || [])
    .filter((t) => !(t.t === "text" && !(t.text || "").trim()))
    .map((t) => {
      const { addr, ...rest } = t; // eslint-disable-line no-unused-vars
      return rest;
    });

const serverTokens = (fix) =>
  norm((fix.lines || []).flatMap((ln) => ln.tokens || []));

describe.skipIf(!haveFixtures)("treeToTokens parity vs server oql_render_v2", () => {
  const fixtures = haveFixtures ? JSON.parse(fs.readFileSync(FIXTURE, "utf8")) : {};

  for (const [name, fix] of Object.entries(fixtures)) {
    it(`${name}: ${fix.oql}`, () => {
      const tree = {
        entity: fix.entity,
        where_keyword: fix.where_keyword,
        where: fix.where,
        directives: fix.directives || [],
      };
      const got = norm(treeToTokens(tree));
      const want = serverTokens(fix);
      expect(got).toEqual(want);
    });
  }
});
