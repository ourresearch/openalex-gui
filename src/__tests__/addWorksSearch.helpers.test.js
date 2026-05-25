import { describe, it, expect } from 'vitest';
import {
  nameTokens,
  looksLikePersonName,
  detectSearchType,
  buildLadderFilterValue,
  givenMatch,
  authorshipMatches,
  findMatchedAuthorship,
  buildSearchUrls,
  computeFullMatchCount,
  isAlreadyOnProfile,
  makeResultComparator,
} from '../components/AuthorCuration/addWorksSearch.helpers.js';

// Helpers — synth fixtures shaped like the real /works API response.
function mkAuthorship(name) {
  return { raw_author_name: name, author: { display_name: name } };
}
function mkWork(...names) {
  return { id: 'W' + names.join('_'), authorships: names.map(mkAuthorship) };
}

describe('nameTokens', () => {
  it('lowercases, strips punctuation, splits on whitespace', () => {
    expect(nameTokens('Jason Priem')).toEqual(['jason', 'priem']);
    expect(nameTokens('J. Priem')).toEqual(['j', 'priem']);
    expect(nameTokens('Richard J. Priem')).toEqual(['richard', 'j', 'priem']);
  });

  it('NFD-strips diacritics', () => {
    expect(nameTokens('Vincent Larivière')).toEqual(['vincent', 'lariviere']);
    expect(nameTokens('Erdős')).toEqual(['erdos']);
  });

  it('handles comma-flipped names', () => {
    expect(nameTokens('Priem, Jason')).toEqual(['jason', 'priem']);
    expect(nameTokens('Heidmann, M. F.')).toEqual(['m', 'f', 'heidmann']);
  });

  it('returns empty for empty/garbage input', () => {
    expect(nameTokens('')).toEqual([]);
    expect(nameTokens(null)).toEqual([]);
    expect(nameTokens(undefined)).toEqual([]);
  });
});

describe('looksLikePersonName', () => {
  it('accepts plausible 2-4 word names', () => {
    expect(looksLikePersonName('Jason Priem')).toBe(true);
    expect(looksLikePersonName('Vincent Larivière')).toBe(true);
    expect(looksLikePersonName('Jane M Smith')).toBe(true);
    expect(looksLikePersonName('Maria del Carmen Garcia')).toBe(true);
  });

  it('rejects single-word and very-long queries', () => {
    expect(looksLikePersonName('Priem')).toBe(false);
    expect(looksLikePersonName('Jason Robert Priem-Smith Jr Esquire')).toBe(false);
  });

  it('rejects queries with digits or sentence punctuation', () => {
    expect(looksLikePersonName('Smith et al 2024')).toBe(false);
    expect(looksLikePersonName('What about X: a survey')).toBe(false);
  });

  // BUG 1 regression (oxjob #240, 2026-05-25):
  // "the state of oa" passed the 4-short-word heuristic, was classified
  // as a person name, fired the name ladder, and step 3's first-initial
  // form `"t oa"` matched garbage. Real names never contain "the"/"of"/etc.
  it('rejects queries containing English stopwords', () => {
    expect(looksLikePersonName('the state of oa')).toBe(false);
    expect(looksLikePersonName('a study of trees')).toBe(false);
    expect(looksLikePersonName('research on cells')).toBe(false);
    expect(looksLikePersonName('In Search Of')).toBe(false);
    expect(looksLikePersonName('Born in Texas')).toBe(false);
  });
});

describe('detectSearchType', () => {
  it('detects DOIs', () => {
    expect(detectSearchType('10.1234/abcd').type).toBe('doi');
    expect(detectSearchType('https://doi.org/10.1234/abcd').type).toBe('doi');
  });

  it('detects OpenAlex work IDs', () => {
    expect(detectSearchType('W12345').type).toBe('openalex_id');
    expect(detectSearchType('https://openalex.org/W12345').type).toBe('openalex_id');
  });

  it('classifies plausible names as author_name', () => {
    expect(detectSearchType('Jason Priem').type).toBe('author_name');
    expect(detectSearchType('Jane Smith').type).toBe('author_name');
  });

  // BUG 1 regression: title-like queries with stopwords must NOT be routed
  // to the name ladder.
  it('classifies stopword-containing queries as title', () => {
    expect(detectSearchType('the state of oa').type).toBe('title');
    expect(detectSearchType('on the origin of species').type).toBe('title');
  });

  // Quotes around the entire query = user wants phrase title search.
  it('treats fully-quoted queries as title', () => {
    expect(detectSearchType('"the state of oa"').type).toBe('title');
    expect(detectSearchType("'jane smith biography'").type).toBe('title');
  });
});

describe('buildLadderFilterValue', () => {
  it('step 1 emits the typed phrase only', () => {
    expect(buildLadderFilterValue(['jason', 'priem'], 1)).toBe('"jason priem"');
  });

  it('step 2 adds the comma-reversed form', () => {
    expect(buildLadderFilterValue(['jason', 'priem'], 2))
      .toBe('"jason priem" OR "priem jason"');
  });

  it('step 3 adds first-initial substitution', () => {
    expect(buildLadderFilterValue(['jason', 'priem'], 3))
      .toBe('"jason priem" OR "priem jason" OR "j priem" OR "priem j"');
  });

  it('step 4 applies slop ~1 to the step-3 phrase set', () => {
    const v = buildLadderFilterValue(['jason', 'priem'], 4);
    expect(v.endsWith('"~1')).toBe(true);
    expect(v.split(' OR ').every(p => p.endsWith('"~1'))).toBe(true);
  });

  it('step 5 applies slop ~2', () => {
    const v = buildLadderFilterValue(['jason', 'priem'], 5);
    expect(v.split(' OR ').every(p => p.endsWith('"~2'))).toBe(true);
  });

  it('step 3 with a single-character first token does not add no-op variants', () => {
    // "j priem" — first token already 1 char, so step 3 has nothing new
    // to add and dedup squashes any collisions.
    const v3 = buildLadderFilterValue(['j', 'priem'], 3);
    const v2 = buildLadderFilterValue(['j', 'priem'], 2);
    expect(v3).toBe(v2);
  });

  it('returns null for empty tokens', () => {
    expect(buildLadderFilterValue([], 1)).toBe(null);
  });
});

describe('givenMatch', () => {
  it('matches exact-equal tokens', () => {
    expect(givenMatch('jason', 'jason')).toBe(true);
  });

  it('matches initial against full given', () => {
    expect(givenMatch('j', 'jason')).toBe(true);
    expect(givenMatch('jason', 'j')).toBe(true);
  });

  it('does not match unrelated givens', () => {
    expect(givenMatch('jason', 'richard')).toBe(false);
    expect(givenMatch('jason', 'r')).toBe(false);
  });
});

describe('findMatchedAuthorship', () => {
  it('finds the Priem authorship even when others co-author', () => {
    const w = mkWork('Heather Piwowar', 'Jason Priem', 'Vincent Larivière');
    expect(findMatchedAuthorship(w, 'Jason Priem')).toBe(1);
  });

  it('matches "J. Priem" against query "Jason Priem"', () => {
    const w = mkWork('Heather Piwowar', 'J. Priem');
    expect(findMatchedAuthorship(w, 'Jason Priem')).toBe(1);
  });

  // BUG 2 regression: ladder step 3 returned works where the matching
  // authorship was "Richard J. Priem" (rocket-fuel Priem) — given !=
  // "jason" so we must NOT accept that as a Jason Priem match.
  it('rejects "Richard J. Priem" for query "Jason Priem"', () => {
    const w = mkWork('M. F. Heidmann', 'Richard J. Priem');
    expect(findMatchedAuthorship(w, 'Jason Priem')).toBe(-1);
  });

  // BUG 2 regression: Phase 2's transformWork fell back to authorship[0]
  // when findMatchedAuthorship missed, displaying "M. F. Heidmann" as
  // the matched author for a query of "Jason Priem". The right behavior
  // for name-source rows is to drop the row, not pick a co-author.
  it('returns -1 when no authorship has compatible surname+given', () => {
    const w = mkWork('M. F. Heidmann', 'Richard J. Priem');
    expect(findMatchedAuthorship(w, 'Jason Priem')).toBe(-1);
    const w2 = mkWork('Alice Walker', 'Bob Jones');
    expect(findMatchedAuthorship(w2, 'Jason Priem')).toBe(-1);
  });

  it('handles diacritics + comma-flipped raw names', () => {
    const w = mkWork('Larivière, Vincent');
    expect(findMatchedAuthorship(w, 'Vincent Larivière')).toBe(0);
  });
});

describe('buildSearchUrls (orchestration)', () => {
  const API = 'https://api.openalex.org';
  const ME = 'A5023888391';

  // BUG 1 regression: title-like queries must NOT produce a name-ladder
  // URL. Pre-fix, "the state of oa" classified as author_name → ladder
  // fired → step 3's "t oa" matched garbage.
  it('"the state of oa" fires title.search only (no ladder URL)', () => {
    const { titleUrl, ladderStep1Url } = buildSearchUrls('the state of oa', ME, API);
    expect(titleUrl).toBeTruthy();
    expect(titleUrl).toContain('title.search');
    expect(titleUrl).toContain('include_xpac=true');
    expect(ladderStep1Url).toBe(null);
  });

  // Quoted queries are always title-only, regardless of word count.
  it('quoted query "..." fires title.search only', () => {
    const { titleUrl, ladderStep1Url } = buildSearchUrls('"the state of oa"', ME, API);
    expect(titleUrl).toContain('title.search');
    expect(ladderStep1Url).toBe(null);
  });

  it('"Jason Priem" fires BOTH name-ladder and title search', () => {
    const { titleUrl, ladderStep1Url, detected, ladderTokens } =
      buildSearchUrls('Jason Priem', ME, API);
    expect(detected.type).toBe('author_name');
    expect(titleUrl).toContain('title.search');
    expect(ladderStep1Url).toContain('raw_author_name.search');
    expect(ladderStep1Url).toContain('%22jason%20priem%22');
    expect(ladderTokens).toEqual(['jason', 'priem']);
  });

  it('all URLs include the type:!paratext exclusion', () => {
    const { titleUrl, ladderStep1Url } = buildSearchUrls('Jason Priem', ME, API);
    expect(titleUrl).toContain('type:!paratext');
    expect(ladderStep1Url).toContain('type:!paratext');
  });

  it('single-word query suppresses title.search (too noisy)', () => {
    const { titleUrl } = buildSearchUrls('neural', ME, API);
    expect(titleUrl).toBe(null);
  });

  it('excludes the current author from results', () => {
    const { titleUrl, ladderStep1Url } = buildSearchUrls('Jason Priem', ME, API);
    expect(titleUrl).toContain(`authorships.author.id:!${ME}`);
    expect(ladderStep1Url).toContain(`authorships.author.id:!${ME}`);
  });
});

describe('authorshipMatches', () => {
  it('surname-only query matches any author with that surname', () => {
    expect(authorshipMatches(mkAuthorship('Richard J. Priem'), ['priem'])).toBe(true);
    expect(authorshipMatches(mkAuthorship('M. F. Heidmann'), ['priem'])).toBe(false);
  });

  it('full-name query requires given compatibility', () => {
    expect(authorshipMatches(mkAuthorship('Jason Priem'), ['jason', 'priem'])).toBe(true);
    expect(authorshipMatches(mkAuthorship('J. Priem'), ['jason', 'priem'])).toBe(true);
    expect(authorshipMatches(mkAuthorship('Richard J. Priem'), ['jason', 'priem'])).toBe(false);
  });
});

describe('computeFullMatchCount', () => {
  const q2 = ['jason', 'priem'];
  const q3 = ['jason', 'r', 'priem'];

  // Spec walkthrough from Jason 2026-05-25:
  //   "jason priem" → "Jason Priem" / "Jason R Priem" tier-2, "J Priem" tier-1
  it('query "jason priem": full-form Priem variants get 2, initial-only gets 1', () => {
    expect(computeFullMatchCount(mkAuthorship('Jason Priem'), q2)).toBe(2);
    expect(computeFullMatchCount(mkAuthorship('Jason R Priem'), q2)).toBe(2);
    expect(computeFullMatchCount(mkAuthorship('Jason Robert Priem'), q2)).toBe(2);
    expect(computeFullMatchCount(mkAuthorship('J Priem'), q2)).toBe(1);
    expect(computeFullMatchCount(mkAuthorship('J. Priem'), q2)).toBe(1);
  });

  it('query "jason r priem" tiers as 3 / 2 / 2 / 1', () => {
    expect(computeFullMatchCount(mkAuthorship('Jason R Priem'), q3)).toBe(3);
    expect(computeFullMatchCount(mkAuthorship('Jason Priem'), q3)).toBe(2);
    expect(computeFullMatchCount(mkAuthorship('J R Priem'), q3)).toBe(2);
    expect(computeFullMatchCount(mkAuthorship('J Priem'), q3)).toBe(1);
  });

  it('initial substitution gets ZERO credit (no full match)', () => {
    // Surname matches in full, "j" cand vs "jason" typed is initial sub only.
    expect(computeFullMatchCount(mkAuthorship('J Priem'), ['jason', 'priem'])).toBe(1);
  });

  it('normalizes diacritics and comma-flipped raw names', () => {
    expect(computeFullMatchCount(mkAuthorship('Larivière, Vincent'), ['vincent', 'lariviere'])).toBe(2);
  });

  it('returns 0 for empty inputs', () => {
    expect(computeFullMatchCount(mkAuthorship(''), q2)).toBe(0);
    expect(computeFullMatchCount(mkAuthorship('Jason Priem'), [])).toBe(0);
  });
});

describe('isAlreadyOnProfile', () => {
  const ME = 'A5023888391';
  const mkAuthorshipWithId = (name, id) => ({
    raw_author_name: name,
    author: { id: id ? `https://openalex.org/${id}` : null, display_name: name },
  });

  it('true when any authorship.author.id matches the profile owner', () => {
    const w = {
      authorships: [
        mkAuthorshipWithId('Heather Piwowar', 'A5048491430'),
        mkAuthorshipWithId('Jason Priem', ME),
      ],
    };
    expect(isAlreadyOnProfile(w, ME)).toBe(true);
  });

  it('false when no authorship resolves to the profile owner (duplicate-paper case)', () => {
    // Real shape from oxjob #240 follow-up — the all-caps duplicate of
    // "The State of OA" has "J. Priem" pointed to a different author
    // entity, NOT Jason's canonical id.
    const w = {
      authorships: [
        mkAuthorshipWithId('H. Piwowar', 'A5048491430'),
        mkAuthorshipWithId('J. Priem', 'A5047056791'),
      ],
    };
    expect(isAlreadyOnProfile(w, ME)).toBe(false);
  });

  it('case-insensitive on the author id', () => {
    const w = {
      authorships: [mkAuthorshipWithId('Jason Priem', ME.toLowerCase())],
    };
    expect(isAlreadyOnProfile(w, ME)).toBe(true);
  });

  it('false for malformed work / missing fields', () => {
    expect(isAlreadyOnProfile({}, ME)).toBe(false);
    expect(isAlreadyOnProfile({ authorships: [] }, ME)).toBe(false);
    expect(isAlreadyOnProfile({ authorships: [{}] }, ME)).toBe(false);
  });
});

describe('makeResultComparator (sort key)', () => {
  // Build a tagged row the way doSearch will after enrichment.
  const row = (id, opts) => ({
    id,
    cited_by_count: opts.cites ?? 0,
    _alreadyOnProfile: !!opts.alreadyOn,
    _fullMatchCount: opts.full ?? 0,
    _relevanceScore: opts.relevance ?? 0,
  });

  // Sort returns ordered ids by applying the comparator.
  const sortIds = (rows, cmp) => [...rows].sort(cmp).map(r => r.id);

  it('name-query: full match count is the primary key, citations break ties', () => {
    const cmp = makeResultComparator('author_name');
    const rows = [
      row('A', { full: 1, cites: 10000 }),  // tier 1, hugely cited — still below tier 2
      row('B', { full: 2, cites: 100 }),     // tier 2, modest cites
      row('C', { full: 2, cites: 5000 }),    // tier 2, more cites — wins
      row('D', { full: 1, cites: 50 }),
    ];
    expect(sortIds(rows, cmp)).toEqual(['C', 'B', 'A', 'D']);
  });

  it('name-query: already-on-profile rows go to the bottom regardless of tier', () => {
    const cmp = makeResultComparator('author_name');
    const rows = [
      row('A', { full: 2, cites: 10000, alreadyOn: true }),   // best tier but on profile
      row('B', { full: 1, cites: 50, alreadyOn: false }),     // worse tier, not on profile
      row('C', { full: 0, cites: 1, alreadyOn: false }),      // even worse, not on profile
    ];
    // B and C are not-on-profile → top. A on-profile → bottom.
    expect(sortIds(rows, cmp)).toEqual(['B', 'C', 'A']);
  });

  it('title-query: relevance_score is primary, citations break ties', () => {
    const cmp = makeResultComparator('title');
    const rows = [
      row('A', { relevance: 50, cites: 100 }),
      row('B', { relevance: 170, cites: 5 }),
      row('C', { relevance: 170, cites: 200 }),  // tied relevance, more cites — wins
    ];
    expect(sortIds(rows, cmp)).toEqual(['C', 'B', 'A']);
  });

  // Walked end-to-end with the canonical Jason Priem example.
  it('walked example: query "Jason Priem" with mixed cand authorships', () => {
    const cmp = makeResultComparator('author_name');
    const rows = [
      row('most-cited-jason', { full: 2, cites: 10000 }),    // top tier, top cites
      row('low-cited-jason',  { full: 2, cites: 50 }),       // top tier, low cites
      row('high-cited-j-init',{ full: 1, cites: 5000 }),     // lower tier — even highly cited, below top tier
      row('low-cited-j-init', { full: 1, cites: 10 }),
      row('already-on',       { full: 2, cites: 99999, alreadyOn: true }), // most cited overall, but on profile
    ];
    expect(sortIds(rows, cmp)).toEqual([
      'most-cited-jason',
      'low-cited-jason',
      'high-cited-j-init',
      'low-cited-j-init',
      'already-on',
    ]);
  });
});
