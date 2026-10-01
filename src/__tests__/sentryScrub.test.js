import { describe, it, expect } from "vitest";
import { scrubUrl, scrubBreadcrumb, scrubEvent } from "../sentryScrub.js";

describe("sentryScrub (oxjob #1479)", () => {
  it("filters api_key and api-key values, keeps everything else", () => {
    expect(scrubUrl("https://api.openalex.org/rate-limit?api_key=abc123")).toBe(
      "https://api.openalex.org/rate-limit?api_key=[Filtered]");
    expect(scrubUrl("https://api.openalex.org/works?filter=x&API-KEY=k&page=2#top")).toBe(
      "https://api.openalex.org/works?filter=x&API-KEY=[Filtered]&page=2#top");
    expect(scrubUrl("https://openalex.org/works?filter=x")).toBe("https://openalex.org/works?filter=x");
    expect(scrubUrl(undefined)).toBe(undefined);
  });
  it("scrubs breadcrumb urls and event request urls", () => {
    const crumb = scrubBreadcrumb({ category: "xhr", data: { url: "/x?api_key=s", method: "GET" } });
    expect(crumb.data.url).toBe("/x?api_key=[Filtered]");
    const nav = scrubBreadcrumb({ category: "navigation", data: { from: "/a?api_key=1", to: "/b" } });
    expect(nav.data.from).toBe("/a?api_key=[Filtered]");
    const ev = scrubEvent({ request: { url: "https://openalex.org/?api_key=z" },
      breadcrumbs: [{ data: { url: "https://api.openalex.org/?api_key=y" } }] });
    expect(ev.request.url).toBe("https://openalex.org/?api_key=[Filtered]");
    expect(ev.breadcrumbs[0].data.url).toBe("https://api.openalex.org/?api_key=[Filtered]");
  });
});
