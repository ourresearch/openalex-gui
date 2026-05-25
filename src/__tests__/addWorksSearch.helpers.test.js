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
