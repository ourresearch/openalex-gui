// public/robots.txt, read the way crawlers read it (oxjob #1689).
//
// parseRobots/isAllowed implement RFC 9309 as Google documents it: a crawler obeys
// the group(s) naming its product token (case-insensitive), else `*`; the longest
// matching rule wins; Allow wins a tie; `*` and `$` are wildcards; paths are
// case-sensitive and include the query string.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getEntityConfigs } from '@/entityConfigs';
import { COMPANY_PAGES } from '@/companyPages.mjs';

const ROBOTS = fs.readFileSync(path.resolve(__dirname, '../../public/robots.txt'), 'utf8');

function parseRobots(text) {
  const groups = [];
  const sitemaps = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((key === 'allow' || key === 'disallow') && current) {
      if (value) current.rules.push({ allow: key === 'allow', pattern: value });
    } else if (key === 'sitemap') {
      sitemaps.push(value);
    }
  }
  return { groups, sitemaps };
}

function patternMatches(pattern, urlPath) {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const re = body.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${re}${anchored ? '$' : ''}`).test(urlPath);
}

function isAllowed(parsed, agent, urlPath) {
  const token = agent.toLowerCase();
  let groups = parsed.groups.filter((g) => g.agents.includes(token));
  if (!groups.length) groups = parsed.groups.filter((g) => g.agents.includes('*'));
  let best = null;
  for (const rule of groups.flatMap((g) => g.rules)) {
    if (!patternMatches(rule.pattern, urlPath)) continue;
    const len = rule.pattern.length;
    if (!best || len > best.len || (len === best.len && rule.allow)) best = { len, allow: rule.allow };
  }
  return best ? best.allow : true;
}

const robots = parseRobots(ROBOTS);
const allowed = (agent, p) => isAllowed(robots, agent, p);

const SEARCH = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Applebot', 'DuckDuckBot'];
const ASSISTANTS = ['ChatGPT-User', 'Claude-User', 'Perplexity-User', 'MistralAI-User'];
const TRAINING = ['GPTBot', 'ClaudeBot', 'CCBot', 'Applebot-Extended', 'meta-externalagent'];
// Google-Extended also governs Gemini Apps grounding (assistant traffic), so it follows the * group.
const GROUNDING = ['Google-Extended'];
const EVERYONE = [...SEARCH, ...ASSISTANTS, ...TRAINING, ...GROUNDING];

const RECORDS = [
  '/works/W2741809807', '/works/w2741809807', '/works/W2741809807?utm_source=chatgpt.com',
  '/works/W2741809807?tab=locations', '/authors/A5023888391', '/authors/a5023888391',
  '/sources/S1983995261', '/institutions/I136199984', '/topics/T13607', '/funders/F4320306076',
  '/publishers/P4310320595', '/keywords/open-access', '/subfields/1802', '/awards/G123',
];
const SHORT_RECORDS = ['/W2741809807', '/A5023888391', '/S1983995261', '/I136199984', '/T13607', '/F4320306076', '/P4310320595', '/C41008148', '/w2741809807', '/f4320306076'];
const FACETED = [
  '/works?filter=publication_year:2020', '/works?page=2', '/works?sort=cited_by_count:desc',
  '/authors?search=priem', '/sources?filter=is_oa:true', '/institutions?filter=country_code:fr',
  '/topics?page=3', '/q?oql=works%20where%20year%20is%202020', '/keywords?search=kelp',
];
const COMPANY = Object.keys(COMPANY_PAGES);
const PRIVATE = ['/settings/profile', '/me/api', '/admin', '/admin/users'];

describe('robots.txt', () => {
  it('parses into the three groups plus a sitemap', () => {
    expect(robots.groups.map((g) => g.agents)).toEqual([
      ['*'],
      ASSISTANTS.map((a) => a.toLowerCase()),
      TRAINING.map((a) => a.toLowerCase()),
    ]);
    expect(robots.sitemaps).toEqual(['https://openalex.org/sitemaps/index.xml']);
  });

  it('search crawlers: record pages and short record URLs open, faceted list URLs closed', () => {
    for (const agent of SEARCH) {
      for (const p of [...RECORDS, ...SHORT_RECORDS, '/works', '/authors']) expect(allowed(agent, p), `${agent} ${p}`).toBe(true);
      for (const p of [...FACETED, ...PRIVATE]) expect(allowed(agent, p), `${agent} ${p}`).toBe(false);
    }
  });

  it('Google-Extended (Gemini Apps grounding) may use record pages', () => {
    for (const agent of GROUNDING) {
      for (const p of [...RECORDS, ...SHORT_RECORDS]) expect(allowed(agent, p), `${agent} ${p}`).toBe(true);
    }
  });

  it('assistants fetching for a person: records and list pages open', () => {
    for (const agent of ASSISTANTS) {
      for (const p of [...RECORDS, ...SHORT_RECORDS, ...FACETED]) expect(allowed(agent, p), `${agent} ${p}`).toBe(true);
      for (const p of PRIVATE) expect(allowed(agent, p), `${agent} ${p}`).toBe(false);
    }
  });

  it('training crawlers: off record, short-form and list URLs', () => {
    for (const agent of TRAINING) {
      for (const p of [...RECORDS, ...SHORT_RECORDS, ...FACETED, '/works', '/q']) expect(allowed(agent, p), `${agent} ${p}`).toBe(false);
    }
  });

  it('every company page stays open to every crawler, training included', () => {
    expect(COMPANY.length).toBeGreaterThan(10);
    for (const agent of EVERYONE) {
      for (const p of [...COMPANY, '/repositories', '/collections']) expect(allowed(agent, p), `${agent} ${p}`).toBe(true);
    }
  });

  it('covers every entity type the router serves', () => {
    const names = getEntityConfigs().map((c) => c.name);
    expect(names.length).toBeGreaterThan(20);
    for (const name of names) {
      expect(allowed('Googlebot', `/${name}?filter=x`), `* /${name}?`).toBe(false);
      expect(allowed('Googlebot', `/${name}/x1`), `* /${name}/x1`).toBe(true);
      expect(allowed('GPTBot', `/${name}/x1`), `GPTBot /${name}/x1`).toBe(false);
    }
  });

  it('matches user-agent tokens case-insensitively and keeps groups apart', () => {
    expect(allowed('claude-user', '/works?filter=x')).toBe(true);
    expect(allowed('CLAUDEBOT', '/works/W1')).toBe(false);
    expect(allowed('Claude-SearchBot', '/works/W1')).toBe(true);
  });
});

describe('the RFC 9309 matcher itself', () => {
  const r = parseRobots('User-agent: a\nDisallow: /x\nAllow: /x/y\nDisallow: /*.pdf$\n\nUser-agent: *\nDisallow: /\n');
  it('longest match wins, Allow wins ties, wildcards work', () => {
    expect(isAllowed(r, 'a', '/x/z')).toBe(false);
    expect(isAllowed(r, 'a', '/x/y/z')).toBe(true);
    expect(isAllowed(r, 'a', '/doc.pdf')).toBe(false);
    expect(isAllowed(r, 'a', '/doc.pdf?x=1')).toBe(true);
    expect(isAllowed(r, 'b', '/anything')).toBe(false);
    expect(isAllowed(parseRobots('User-agent: *\nDisallow: /p\nAllow: /p\n'), 'z', '/p')).toBe(true);
  });
});
