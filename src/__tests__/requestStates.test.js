// oxjob #2002: the website's four request states, one test per unplanned combination
// #1999 found (its EXPLORE.md, Area 4 items 2, 4, 7, 8).
import { describe, it, expect, vi } from "vitest";

import {
  initialGroupsRequest, needsGroupsFetch, beginGroupsRequest, settleGroupsRequest,
} from "@/groupsRequestState";
import { classifyRequestError, refusalText, refusalReason, withRefusalPolicy } from "@/requestRefusal";
import { savedSearchIdState, searchQueryKey, savedSearchQueryKey } from "@/savedSearchIdentity";
import { inboundRunParams } from "@/store/query.store";

// An axios-shaped HTTP error.
const httpError = (status, data = {}, headers = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data, headers }, request: {},
  });

describe("facet counts: are these for the current query? (groupsRequestState)", () => {
  const rowsA = [{ value: "a", count: 3 }];
  const rowsB = [{ value: "b", count: 5 }];

  it("a failed re-fetch drops the previous query's counts and says error", () => {
    let s = beginGroupsRequest(initialGroupsRequest(), "A");
    s = settleGroupsRequest(s, s.seq, { groups: rowsA });
    s = beginGroupsRequest(s, "B");
    expect(s.groups).toEqual(rowsA); // #563: old rows stay on screen while B loads
    s = settleGroupsRequest(s, s.seq, { error: httpError(504) });
    expect(s.status).toBe("error");
    expect(s.forSignature).toBe("B");
    expect(s.groups).toEqual([]);
  });

  it("a failed first load is an error, not 'no values'", () => {
    let s = beginGroupsRequest(initialGroupsRequest(), "A");
    s = settleGroupsRequest(s, s.seq, { error: httpError(504) });
    expect(s.status).toBe("error");
    let empty = beginGroupsRequest(initialGroupsRequest(), "A");
    empty = settleGroupsRequest(empty, empty.seq, { groups: [] });
    expect(empty.status).toBe("ready");
  });

  it("an older request answering last is dropped", () => {
    let s = beginGroupsRequest(initialGroupsRequest(), "A");
    const seqA = s.seq;
    s = beginGroupsRequest(s, "B");
    const seqB = s.seq;
    s = settleGroupsRequest(s, seqB, { groups: rowsB });
    s = settleGroupsRequest(s, seqA, { groups: rowsA });
    expect(s.groups).toEqual(rowsB);
    expect(s.forSignature).toBe("B");
    // ...and an older request's failure can't wipe the newer counts either
    s = settleGroupsRequest(s, seqA, { error: httpError(504) });
    expect(s.status).toBe("ready");
  });

  it("fetches each query once, but a failed one may be asked again", () => {
    let s = beginGroupsRequest(initialGroupsRequest(), "A");
    expect(needsGroupsFetch(s, "A")).toBe(false); // in flight
    s = settleGroupsRequest(s, s.seq, { groups: rowsA });
    expect(needsGroupsFetch(s, "A")).toBe(false); // shown
    expect(needsGroupsFetch(s, "B")).toBe(true);
    s = beginGroupsRequest(s, "B");
    s = settleGroupsRequest(s, s.seq, { error: httpError(504) });
    expect(needsGroupsFetch(s, "B")).toBe(true); // Try again
  });
});

describe("why was this request refused? (requestRefusal)", () => {
  it("a plan gate is named as such, whatever its status, never as a rate limit", () => {
    const gate = { error: "Plan upgrade required", message: 'OQL that filters or sorts by "created_date" is for Member+ plans.' };
    expect(classifyRequestError(httpError(429, gate)).kind).toBe("plan_gate");
    expect(classifyRequestError(httpError(403, gate)).kind).toBe("plan_gate");
    expect(refusalText(httpError(429, gate))).toBe(gate.message);
  });

  it("a short throttle, the daily budget and other rate limits are told apart", () => {
    expect(classifyRequestError(httpError(429, { retryAfter: 1 })).kind).toBe("throttle");
    expect(classifyRequestError(httpError(429, { message: "Insufficient budget. This request costs $0.001..." }, { "retry-after": "40000" })).kind).toBe("daily_limit");
    expect(classifyRequestError(httpError(429, {}, {})).kind).toBe("daily_limit");
    expect(classifyRequestError(httpError(429, { message: "Anonymous search is temporarily rate-limited..." }, { "retry-after": "30" })).kind).toBe("rate_limited");
  });

  it("people see the API's words, never 'Request failed with status code 429/504'", () => {
    const timeout = httpError(504, { error: "Gateway timeout", message: "Your query took too long and was stopped before completing." });
    expect(refusalText(timeout)).toBe("Your query took too long and was stopped before completing.");
    expect(refusalText(httpError(504, "<html>bad gateway</html>"))).toBe("The query took too long and was stopped. Try narrowing it.");
    expect(refusalText(httpError(429, {}))).toMatch(/today's free budget/);
    expect(refusalText(httpError(500, {}))).toBe("Something went wrong (error 500). Please try again.");
    for (const e of [timeout, httpError(429, {}), httpError(500, {}), httpError(502, null)]) {
      expect(refusalText(e)).not.toMatch(/status code/);
    }
  });

  it("a pipeline limit reads as its message plus its fix; a parse error as its first validation error", () => {
    const limit = { error: "too_many_groups", message: "Splitting by author gives about 100,964,546 groups here.", fix: "Narrow the starting set." };
    expect(refusalText(httpError(400, limit))).toBe(`${limit.message} Fix: ${limit.fix}`);
    const parse = { message: "Invalid query", validation: { errors: [{ message: "Unknown field 'titel' at 12" }] } };
    expect(refusalText(httpError(400, parse))).toBe("Unknown field 'titel' at 12");
  });

  it("our own cancels and a page unload are aborts; a client timeout is a timeout; no answer is network", () => {
    expect(classifyRequestError(Object.assign(new Error("canceled"), { code: "ERR_CANCELED" })).kind).toBe("aborted");
    expect(classifyRequestError(Object.assign(new Error("Request aborted"), { code: "ECONNABORTED", request: {} })).kind).toBe("aborted");
    expect(classifyRequestError(Object.assign(new Error("timeout of 30000ms exceeded"), { code: "ECONNABORTED", request: {} })).kind).toBe("timeout");
    expect(classifyRequestError(Object.assign(new Error("Network Error"), { code: "ERR_NETWORK", request: {} })).kind).toBe("network");
  });

  it("a throw from our own code before sending keeps its message (#228)", () => {
    expect(refusalText(new Error("no facetConfig found for is_oa"))).toBe("no facetConfig found for is_oa");
  });
});

describe("a facet card's reason (refusalReason)", () => {
  it("names a refusal a retry can't fix, and offers no Try again for it", () => {
    expect(refusalReason(httpError(429, { error: "Plan upgrade required", message: "..." }))).toEqual({ short: "this query needs a paid plan", canRetry: false });
    expect(refusalReason(httpError(429, { message: "Insufficient budget. ..." }))).toEqual({ short: "today's budget is used up", canRetry: false });
  });
  it("a timeout says only 'couldn't load', never the API's 'narrow your search', and can be retried", () => {
    expect(refusalReason(httpError(504, { message: "This usually means a very broad search" }))).toEqual({ short: null, canRetry: true });
  });
});

describe("one refusal policy for GET and the OQL POSTs (withRefusalPolicy)", () => {
  const noWait = () => Promise.resolve();

  it("waits out a short throttle once and retries", async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(httpError(429, { retryAfter: 1 }))
      .mockResolvedValueOnce({ data: "ok" });
    await expect(withRefusalPolicy(send, { wait: noWait })).resolves.toEqual({ data: "ok" });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("only once: a second throttle is thrown", async () => {
    const send = vi.fn().mockRejectedValue(httpError(429, { retryAfter: 1 }));
    await expect(withRefusalPolicy(send, { wait: noWait })).rejects.toMatchObject({ response: { status: 429 } });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("a signed-out visitor whose budget is spent gets the credit dialog; a signed-in one doesn't", async () => {
    const spent = httpError(429, { message: "Insufficient budget. ..." }, { "retry-after": "40000" });
    const dialog = vi.fn();
    await expect(withRefusalPolicy(() => Promise.reject(spent), { isSignedIn: () => false, onDailyLimitSignedOut: dialog })).rejects.toBe(spent);
    expect(dialog).toHaveBeenCalledTimes(1);
    await expect(withRefusalPolicy(() => Promise.reject(spent), { isSignedIn: () => true, onDailyLimitSignedOut: dialog })).rejects.toBe(spent);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it("a plan gate never opens the 'today's free limit' dialog", async () => {
    const gate = httpError(429, { error: "Plan upgrade required", message: "..." });
    const dialog = vi.fn();
    await expect(withRefusalPolicy(() => Promise.reject(gate), { isSignedIn: () => false, onDailyLimitSignedOut: dialog })).rejects.toBe(gate);
    expect(dialog).not.toHaveBeenCalled();
  });
});

describe("which saved search is this page? (savedSearchIdentity)", () => {
  const oqlUrl = "https://openalex.org/q?oql=works%20where%20title%20has%20frogs&id=ss-1";
  const classicUrl = "https://openalex.org/works?filter=title.search:frogs&id=ss-2";
  const list = [
    { id: "ss-1", search_url: oqlUrl, has_alert: true },
    { id: "ss-2", search_url: classicUrl, has_alert: true },
  ];
  const state = (over) => savedSearchIdState({
    queryId: "ss-1", signedIn: true, loaded: true, savedSearches: list,
    path: "/q", query: { oql: "works where title has frogs", id: "ss-1" }, ...over,
  });

  it("a signed-out visitor's ?id= is ignored, not dropped: the link opens its results", () => {
    expect(state({ signedIn: false })).toBe("none");
  });

  it("an id is judged only once the list is in", () => {
    expect(state({ loaded: false })).toBe("loading");
  });

  it("an id that isn't theirs is unknown (dropped from the URL)", () => {
    expect(state({ queryId: "ss-9", query: { oql: "works where title has frogs", id: "ss-9" } })).toBe("unknown");
  });

  it("the stored query on its own page is saved, whatever the paging or view params", () => {
    expect(state()).toBe("saved");
    expect(state({ query: { oql: "works where title has frogs", id: "ss-1", page: "3", per_page: "100", view: "table" } })).toBe("saved");
    // The URL writer collapses OQL's pretty-print newlines; the stored link may still have them.
    expect(state({ query: { oql: "works where\n  title has frogs", id: "ss-1" } })).toBe("saved");
  });

  it("an old-format search whose filters were edited (id kept) is no longer 'saved'", () => {
    const classic = { queryId: "ss-2", path: "/works" };
    expect(state({ ...classic, query: { filter: "title.search:frogs", id: "ss-2", page: "1" } })).toBe("saved");
    expect(state({ ...classic, query: { filter: "title.search:frogs,is_oa:true", id: "ss-2", page: "1" } })).toBe("edited");
    expect(state({ ...classic, path: "/authors", query: { filter: "title.search:frogs", id: "ss-2" } })).toBe("edited");
  });

  it("an OQL page names its entity in the OQL, so its path doesn't matter", () => {
    expect(searchQueryKey("/q", { oql: "works where x" })).toBe(searchQueryKey("/works", { oql: "works where x" }));
    expect(savedSearchQueryKey("not a url at all")).not.toBeNull();
  });
});

describe("OQL page size on an inbound run (inboundRunParams)", () => {
  it("sends the page size the pager counts by, and no page", () => {
    expect(inboundRunParams("works where title has frogs", 100)).toEqual({ per_page: 100 });
  });
  it("sends nothing when no size was picked (the API's 25 is the pager's default too)", () => {
    expect(inboundRunParams("works where title has frogs", undefined)).toEqual({});
  });
  it("a quoted phrase that says 'similar to' isn't a semantic search", () => {
    expect(inboundRunParams('works where title has "similar to"', 100)).toEqual({ per_page: 100 });
  });
  it("holds a semantic search to the API's 50", () => {
    expect(inboundRunParams('works where title and abstract is similar to "frog decline"', 100)).toEqual({ per_page: 50 });
    expect(inboundRunParams('works where title and abstract is Similar  To "frogs"', 25)).toEqual({ per_page: 25 });
  });
});
