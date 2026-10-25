import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { magicLoginConfig } from "@/store/magicLoginConfig.js";

// The magic-login call carries the signed-in account's key so an org invite to
// an address it added but never verified can join it (oxjob #1762), and never
// the impersonation header.
describe("magicLoginConfig", () => {
  let mem;
  beforeEach(() => {
    mem = new Map();
    globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null };
  });
  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("is empty when signed out", () => {
    expect(magicLoginConfig()).toEqual({});
  });

  it("sends the signed-in key", () => {
    mem.set("token", "KEY-1");
    expect(magicLoginConfig()).toEqual({ headers: { Authorization: "Bearer KEY-1" } });
  });

  it("never sends the impersonation header", () => {
    mem.set("token", "KEY-admin");
    mem.set("impersonatingUserId", "user-x");
    expect(magicLoginConfig()).toEqual({ headers: { Authorization: "Bearer KEY-admin" } });
  });

  it("is empty when storage throws or is missing", () => {
    globalThis.localStorage = { getItem: () => { throw new Error("blocked"); } };
    expect(magicLoginConfig()).toEqual({});
    delete globalThis.localStorage;
    expect(magicLoginConfig()).toEqual({});
  });
});
