// oxjob #1486: company pages carry real head tags in the HTML server.js sends.
//
// Checks the one map (src/companyPages.mjs) against the router, and renders
// every page through the server path (companyPageHtml.mjs) to confirm each gets
// its own title, description, canonical and Open Graph tags.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { COMPANY_PAGES, companyPageHead, titleTemplate } from "@/companyPages.mjs";
import { renderCompanyPageHtml } from "../../companyPageHtml.mjs";

const SRC = path.resolve(__dirname, "..");
const routerSource = fs.readFileSync(path.join(SRC, "router/index.js"), "utf8");

// The built shell's head, trimmed to what the swap touches.
const SHELL = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>OpenAlex</title><link rel="icon" href="/tricon-outlined.png"></head><body><div id="app"></div></body></html>`;

const paths = Object.keys(COMPANY_PAGES);
const rendered = await renderCompanyPageHtml(SHELL);

function attr(html, selector) {
  // selector like 'property="og:title"' -> that tag's content attribute
  const m = html.match(new RegExp(`<meta ${selector} content="([^"]*)">`));
  return m ? m[1] : null;
}

describe("company pages map", () => {
  it.each(paths)("%s is a route in the router", (p) => {
    expect(routerSource).toMatch(new RegExp(`path: ['"]${p}['"]`));
  });

  it.each(paths)("%s copy follows the style rules", (p) => {
    const { title, description } = COMPANY_PAGES[p];
    for (const text of [title, description]) {
      expect(text).not.toMatch(/—/);
      expect(text).not.toMatch(/OurResearch/i);
    }
    expect(description.length).toBeGreaterThan(50);
    expect(description.length).toBeLessThanOrEqual(220);
  });

  it("returns null for anything that isn't a company page", () => {
    expect(companyPageHead("/works")).toBeNull();
    expect(companyPageHead("/about/")).toBeNull();
  });

  it("uses the site title template, except where a page opts out", () => {
    expect(companyPageHead("/about").title).toBe("About | OpenAlex");
    expect(companyPageHead("/").title).toBe(COMPANY_PAGES["/"].title);
    expect(titleTemplate("")).toBe("OpenAlex");
  });
});

describe("renderCompanyPageHtml", () => {
  it.each(paths)("%s gets its own head in the HTML", (p) => {
    const html = rendered.get(p);
    const head = companyPageHead(p);
    const description = COMPANY_PAGES[p].description.replace(/"/g, "&quot;");

    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain(`<title>${head.title.replace(/&/g, "&amp;")}</title>`);
    expect(attr(html, 'name="description"')).toBe(description);
    expect(attr(html, 'property="og:description"')).toBe(description);
    expect(attr(html, 'property="og:title"')).toBe(head.title);
    expect(attr(html, 'property="og:url"')).toBe(`https://openalex.org${p}`);
    expect(attr(html, 'property="og:image"')).toMatch(/^https:\/\/openalex\.org\/brand-assets\//);
    expect(attr(html, 'name="twitter:card"')).toBe("summary");
    expect(html).toContain(`<link rel="canonical" href="https://openalex.org${p}">`);
    // The rest of the shell is untouched.
    expect(html).toContain('<div id="app"></div>');
  });

  it("refuses a shell with no <title> to replace", async () => {
    await expect(renderCompanyPageHtml("<html><head></head></html>")).rejects.toThrow();
  });
});
