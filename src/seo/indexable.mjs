// Which record pages ask search engines not to index them (oxjob #1689).
//
// Thin records keep working for people and AI assistants (noindex stops indexing,
// not fetching), but carry <meta name="robots" content="noindex"> and stay out of
// the sitemaps. Never robots.txt: an engine that can't fetch a page can't see its
// noindex, and may list the bare URL anyway.
//
// The bar is "really thin" on purpose: a noindexed record is also invisible to every
// AI search engine. Counted 2026-10-15 (RECOMMENDATION.md): about 106M of 327M works
// have no abstract and no citations; 47M of 97M authors have one work and no ORCID;
// 138M works are extended-corpus (xpac). Tune here, nowhere else; the sitemap
// builder should apply the same rule.
//
// Fields read: works: is_xpac, is_paratext, abstract_inverted_index, cited_by_count;
// authors: works_count, orcid (or ids.orcid). A record fetched with a trimmed
// `select=` must keep these.

const hasAbstract = (w) => !!w.abstract_inverted_index && Object.keys(w.abstract_inverted_index).length > 0;

// The reason a record's page is noindexed, or null when it should be indexed.
export function noindexReason(type, record) {
  if (!record) return null;
  if (type === 'works') {
    if (record.is_xpac) return 'extended corpus';
    if (record.is_paratext) return 'paratext';
    if (!hasAbstract(record) && !(record.cited_by_count > 0)) return 'no abstract and no citations';
    return null;
  }
  if (type === 'authors') {
    const orcid = record.orcid || record.ids?.orcid;
    if ((record.works_count ?? 0) <= 1 && !orcid) return 'at most one work and no ORCID';
    return null;
  }
  return null;
}

export const isIndexable = (type, record) => noindexReason(type, record) === null;
