// Company pages: the one map from route to <head> (oxjob #1486).
//
// openalex.org is a single-page app, so bots that don't run JavaScript (link
// previews, AI training crawlers, agents' web-fetch tools) see only the
// index.html shell. For the company pages below, server.js renders this head
// into the HTML it sends (via unhead's server renderer, companyPageHtml.mjs),
// and App.vue applies the same object for the matched route, so the server and
// client-side navigation always agree. Data pages (search, entities) are left
// out on purpose: their data is for the API.
//
// Plain ESM with no imports: server.js loads this file directly in Node, and
// webpack bundles it for the app. Keep it that way.
//
// Adding a page: add its router path here (src/__tests__/companyPages.test.js
// checks the router has it) and don't call useHead in its view.
// Descriptions: claim first, no em dashes, trade name OpenAlex.

const SITE_URL = 'https://openalex.org';
const SITE_NAME = 'OpenAlex';
const SHARE_IMAGE = `${SITE_URL}/brand-assets/openalex-mark-square.png`;

// The site-wide title template (App.vue uses it for every page).
export function titleTemplate(title) {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

// titleTemplate: null means the title is used as is.
export const COMPANY_PAGES = {
  '/': {
    title: 'OpenAlex: The open catalog to the global research system',
    titleTemplate: null,
    description: "OpenAlex indexes half a billion scholarly works, with their authors, institutions, sources and topics, and makes them free to search, analyze and reuse through our web app, API and bulk download.",
  },
  '/about': {
    title: 'About',
    description: "OpenAlex is a free and open catalog of the world's scholarly research, built by a small nonprofit team. Our data is CC0, our code is open source, and our governance is transparent.",
  },
  '/team': {
    title: 'Team',
    description: 'The people behind OpenAlex: our small paid staff, our volunteer board of directors and our volunteer community advisory board.',
  },
  '/pricing': {
    title: 'Pricing',
    description: 'OpenAlex API pricing: every account gets $1 a day free. For more, add prepaid usage from $1 or get an annual subscription, with an optional PDF sync add-on.',
  },
  '/privacy': {
    title: 'Privacy',
    description: 'The OpenAlex privacy policy: what information we collect, how we use it, and the choices you have. The PDF is the canonical version.',
  },
  '/terms': {
    title: 'Terms',
    description: 'The OpenAlex terms of service, plus our conflict of interest, anti-fraud and bribery, and treasury policies. The PDFs are the canonical versions.',
  },
  '/accessibility': {
    title: 'Accessibility',
    description: 'The OpenAlex accessibility statement. We want OpenAlex to be usable by everyone; if you hit an accessibility problem anywhere on the site, please let us know.',
  },
  '/brand': {
    title: 'Brand',
    description: 'The OpenAlex brand kit: our tricon logo and lockup as PNGs, plus our colors and type. All free to use.',
  },
  '/testimonials': {
    title: 'Testimonials',
    description: 'What our users say about OpenAlex, in their own words, and how to share a testimonial of your own.',
  },
  '/events': {
    title: 'Events',
    description: 'Webinars, office hours, conferences and community meetings: all the ways to connect with the OpenAlex team and community.',
  },
  '/events/funders2026': {
    title: 'Enriching OpenAlex with Comprehensive Grant Metadata: London Workshop 2026',
    description: 'With funding from Wellcome, OpenAlex is building the first completely open database of research funding. Pipeline review and funder use cases from our London workshop, 27 and 28 April 2026.',
  },
  '/events/paris2026': {
    title: 'OpenAlex Users Meeting: Paris, 20–21 October 2026',
    description: 'The first in-person OpenAlex users meeting: a day of community talks at CNRS, then a day of demos and hands-on breakouts with the OpenAlex team at Sorbonne Université. Free, registration required.',
  },
  '/jobs': {
    title: 'Jobs',
    description: "Open roles at OpenAlex, the small nonprofit team building a free and open catalog of the world's research. Full-time and remote.",
  },
  '/jobs/community-lead': {
    title: 'Community Lead',
    description: 'OpenAlex is hiring a Community Lead to own our relationships with the people who use OpenAlex and the institutions that support it. Full-time, remote.',
  },
  '/jobs/software-engineer': {
    title: 'Software Engineer',
    description: 'OpenAlex is hiring a Software Engineer to work across our backend: the ETL, the AI and ML that make the data good, and the API. Full-time, remote.',
  },
  '/jobs/operations-associate': {
    title: 'Operations Associate',
    description: 'OpenAlex is hiring an Operations Associate to own the forms, member paperwork and team logistics that keep a growing nonprofit running. Full-time, remote (US or Canada).',
  },
  '/institutional-supporters': {
    title: 'Institutional supporters',
    description: 'The academic institutions, libraries and government agencies that sustain OpenAlex as open research infrastructure, and the Member, Member+ and Partner tiers they join.',
  },
  '/support': {
    title: 'Support',
    description: "Found a problem in OpenAlex data, or stuck on something? Send the OpenAlex team a note and we'll take a look.",
  },
};

// The useHead() input for a company page, or null for any other path.
export function companyPageHead(path) {
  const page = COMPANY_PAGES[path];
  if (!page) return null;
  const title = page.titleTemplate === null ? page.title : titleTemplate(page.title);
  const url = SITE_URL + path;
  return {
    title,
    titleTemplate: null,
    meta: [
      { name: 'description', content: page.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: title },
      { property: 'og:description', content: page.description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: SHARE_IMAGE },
      { name: 'twitter:card', content: 'summary' },
    ],
    link: [{ rel: 'canonical', href: url }],
  };
}
