// Server side of oxjob #1486: the HTML server.js sends for each company page.
// Takes the built index.html shell and swaps its generic <title> for the
// page's real head (title, description, canonical, Open Graph), rendered by
// unhead's own server renderer from the same companyPageHead() object the
// page's view passes to useHead(). Rendered once at startup, not per request.
import { createServerHead } from 'unhead';
import { renderSSRHead } from '@unhead/ssr';
import { COMPANY_PAGES, companyPageHead } from './src/companyPages.mjs';

const SHELL_TITLE = /<title>[^<]*<\/title>/;

// Returns a Map of path -> HTML for every company page.
export async function renderCompanyPageHtml(shell) {
  if (!SHELL_TITLE.test(shell)) {
    throw new Error('index.html has no <title> to replace');
  }
  const pages = new Map();
  for (const path of Object.keys(COMPANY_PAGES)) {
    const head = createServerHead();
    head.push(companyPageHead(path));
    const { headTags } = await renderSSRHead(head);
    // A function replacement, so a "$" in the copy is never read as a pattern.
    pages.set(path, shell.replace(SHELL_TITLE, () => headTags));
  }
  return pages;
}
