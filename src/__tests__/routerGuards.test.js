// oxjob #1689: Nuxt 4.5 brings vue-router 5, which deprecates the next() callback
// in navigation guards. The guards now return their result; this runs each one
// through a real vue-router 5 router (memory history) to show the outcome is the
// same as before.
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { createRouter, createMemoryHistory } from "vue-router";

// The router module imports these views eagerly; vitest has no .vue compiler.
const stub = { render: () => null };
vi.mock("@/views/HomeV2.vue", () => ({ default: stub }));
vi.mock("@/views/Serp.vue", () => ({ default: stub }));
vi.mock("@/views/EntityPage.vue", () => ({ default: stub }));
vi.mock("@/views/Login.vue", () => ({ default: stub }));
vi.mock("@/views/OAuthConsent.vue", () => ({ default: stub }));
vi.mock("@/views/Signup.vue", () => ({ default: stub }));
vi.mock("@/components/User/UserMagicToken.vue", () => ({ default: stub }));
vi.mock("@/components/User/UserVerifyEmail.vue", () => ({ default: stub }));
vi.mock("@/views/PageNotFound.vue", () => ({ default: stub }));
// Lazy ones the redirects below land on.
vi.mock("@/views/Settings/SettingsBase.vue", () => ({ default: stub }));
vi.mock("@/views/Me/MeProfile.vue", () => ({ default: stub }));
vi.mock("@/views/Settings/SettingsOrgUsage.vue", () => ({ default: stub }));

const { routes, scrollBehavior, installGuards, setAppRouter } = await import("@/router/index.js");

function fakeStore({ userId = null, isAdmin = false, orgRole = null } = {}) {
  return {
    getters: {
      "user/userLive": !!userId,
      "user/userId": userId,
      "user/isAdmin": isAdmin,
      "user/isOrgOwner": orgRole === "owner",
      "user/hasSiteWideAccess": isAdmin,
    },
    state: { user: { organizationRole: orgRole } },
    dispatch: vi.fn(),
    commit: vi.fn(),
  };
}

let router;
async function go(to, store = fakeStore()) {
  router = createRouter({ history: createMemoryHistory(), routes, scrollBehavior });
  installGuards(router, store);
  setAppRouter(router);
  await router.push(to);
  return router.currentRoute.value;
}

describe("navigation guards on vue-router 5", () => {
  beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));

  it("legacy ?v2 becomes data-version=2", async () => {
    const r = await go("/works?v2&search=kelp");
    expect(r.name).toBe("Serp");
    expect(r.query).toEqual({ search: "kelp", "data-version": "2" });
  });

  it("an /:entityType?oql= link moves to /q, keeping the query", async () => {
    const r = await go("/authors?oql=works%20where%20x&mode=1");
    expect(r.name).toBe("OqlQuery");
    expect(r.path).toBe("/q");
    expect(r.query).toEqual({ oql: "works where x", mode: "1" });
  });

  it("a single filter=<x>.search: clause becomes the top-level search param", async () => {
    const r = await go("/works?filter=title.search:kelp&page=2");
    expect(r.name).toBe("Serp");
    expect(r.query.filter).toBeUndefined();
    expect(r.query.page).toBe("2");
    expect(Object.values(r.query)).toContain("kelp");
  });

  it("a namespaced entity id is normalized to the canonical route", async () => {
    const r = await go("/keywords/keywords%2Fkelp?tab=works");
    expect(r.name).toBe("EntityPage");
    expect(r.params).toEqual({ entityType: "keywords", entityId: "kelp" });
    expect(r.query).toEqual({ tab: "works" });
  });

  it("location pages still get entityType set by their guard", async () => {
    const r = await go("/locations/doi.org%2F10.1234%2Fabc");
    expect(r.name).toBe("LocationPage");
    expect(r.params.entityType).toBe("locations");
  });

  it("requiresAuth sends a logged-out visitor to /login with the way back", async () => {
    const r = await go("/oauth/consent?client_id=x");
    expect(r.name).toBe("Login");
    expect(r.query).toEqual({ redirect: "/oauth/consent?client_id=x" });
  });

  it("requiresAdmin sends a non-admin home", async () => {
    const r = await go("/nl/map", fakeStore({ userId: "user-1" }));
    expect(r.name).toBe("Home");
  });

  it("requiresOrgOwner sends a member to settings-profile; an owner gets in", async () => {
    expect((await go("/settings/org-api", fakeStore({ userId: "user-1", orgRole: "member" }))).name).toBe("settings-profile");
    expect((await go("/settings/org-api", fakeStore({ userId: "user-1", orgRole: "owner" }))).name).toBe("settings-org-api");
  });

  it("ordinary pages pass straight through", async () => {
    expect((await go("/works?search=kelp")).fullPath).toBe("/works?search=kelp");
    expect((await go("/login")).name).toBe("Login");
    expect((await go("/no/such/page")).name).toBe("PageNotFound");
  });
});

describe("no guard uses the deprecated next() callback", () => {
  it("router/index.js guards take (to) and return their result", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../router/index.js"), "utf8").replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/\(\s*to\s*,\s*from\s*,\s*next\s*\)/);
    expect(src).not.toMatch(/\bnext\(/);
  });
});
