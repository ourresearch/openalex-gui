// Server side of oxjob #1486: the head tags each company page's HTML carries,
// so bots that don't run JavaScript read the page's real title, description,
// canonical and Open Graph tags. Rendered by unhead's own server renderer from
// the same companyPageHead() object App.vue passes to useHead(). Rendered once at
// startup, not per request.
//
// oxjob #1689: unhead 3 (the version Nuxt renders with). The Nuxt server swaps
// these tags in for the shell's generic <title> (server/plugins/page-shell.ts);
// renderCompanyPageHtml() does the same to a whole HTML string (server.js).
import { createHead, renderSSRHead } from '@unhead/vue/server';
import { COMPANY_PAGES, companyPageHead } from './src/companyPages.mjs';

export const SHELL_TITLE = /<title>[^<]*<\/title>/;

// Returns a Map of path -> the page's head tags (title first).
export function renderCompanyHeadTags() {
  const tags = new Map();
  for (const path of Object.keys(COMPANY_PAGES)) {
    // disableDefaults: unhead 3 would otherwise add its own charset and viewport.
    const head = createHead({ disableDefaults: true });
    head.push(companyPageHead(path));
    tags.set(path, renderSSRHead(head).headTags);
  }
  return tags;
}

// The shell's <title> swapped for a page's tags. A function replacement, so a
// "$" in the copy is never read as a pattern.
export function withCompanyHead(html, tags) {
  return html.replace(SHELL_TITLE, () => tags);
}

// Returns a Map of path -> HTML for every company page.
export async function renderCompanyPageHtml(shell) {
  if (!SHELL_TITLE.test(shell)) {
    throw new Error('index.html has no <title> to replace');
  }
  const pages = new Map();
  for (const [path, tags] of renderCompanyHeadTags()) {
    pages.set(path, withCompanyHead(shell, tags));
  }
  return pages;
}
