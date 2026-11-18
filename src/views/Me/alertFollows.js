// What an alert follows (oxjob #635): the alerts page groups alerts by the kind of thing their saved search
// filters on, so people who follow many authors and many topics can scan the two apart.
import { filtersFromUrlStr } from '@/filterConfigs';
import { getFacetConfig } from '@/facetConfigUtils';

// In page order. A search that filters on several kinds (an author's works on a topic) goes in the first.
export const ALERT_GROUPS = [
  { key: 'authors', title: 'Authors' },
  { key: 'topics', title: 'Topics and keywords' },
  { key: 'institutions', title: 'Institutions' },
  { key: 'sources', title: 'Sources' },
  { key: 'other', title: 'Other searches' },
];

const GROUP_OF_ENTITY = {
  authors: 'authors',
  topics: 'topics',
  subfields: 'topics',
  fields: 'topics',
  domains: 'topics',
  keywords: 'topics',
  concepts: 'topics',
  institutions: 'institutions',
  sources: 'sources',
};

// Keys with no facet config (older or alias spellings) still read as what they name.
const GROUP_OF_KEY = [
  [/^authorships\.author\./, 'authors'],
  [/(^|\.)(topics?|primary_topic|keywords|concepts)(\.|$)/, 'topics'],
  [/institutions/, 'institutions'],
  [/(^|\.)source\./, 'sources'],
];

function groupOfFilter(entityType, filter) {
  const entity = getFacetConfig(entityType, filter.key)?.entityToSelect;
  if (GROUP_OF_ENTITY[entity]) return GROUP_OF_ENTITY[entity];
  return GROUP_OF_KEY.find(([re]) => re.test(filter.key))?.[1];
}

export function alertFollows(searchUrl) {
  try {
    // Read like url.routeFromOxurl, without that module's router and store.
    const parsed = new URL(searchUrl, 'https://openalex.org');
    if (parsed.searchParams.get('oql')) return 'other';
    const entityType = parsed.pathname.split('/').filter(Boolean)[0] || 'works';
    // An excluded author or topic ("not this one") is not what the alert follows.
    const kinds = new Set(
      filtersFromUrlStr(entityType, parsed.searchParams.get('filter'))
        .filter(f => !f.isNegated)
        .map(f => groupOfFilter(entityType, f))
    );
    return ALERT_GROUPS.find(g => kinds.has(g.key))?.key || 'other';
  } catch (e) {
    return 'other';   // a URL this page can't read still lists, under other searches
  }
}

// The groups that have alerts, each with its alerts, in page order.
export function groupAlerts(searches) {
  const byGroup = {};
  for (const s of searches || []) (byGroup[alertFollows(s.search_url)] ||= []).push(s);
  return ALERT_GROUPS.filter(g => byGroup[g.key]).map(g => ({ ...g, items: byGroup[g.key] }));
}
