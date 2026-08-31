import { describe, it, expect } from 'vitest';
import { extractIssn, extractLocationId, extractOpenalexId, hasUnquotedWildcard, looksLikeOql, dedupeByName, footerSearchEntityType } from '../components/searchBox.helpers.js';

describe('extractIssn', () => {
  it('accepts a canonical hyphenated ISSN', () => {
    expect(extractIssn('2041-1723')).toBe('2041-1723');
  });

  it('accepts an ISSN without the hyphen', () => {
    expect(extractIssn('20411723')).toBe('2041-1723');
  });

  it('accepts an X check digit (any case) and uppercases it', () => {
    expect(extractIssn('1234-567x')).toBe('1234-567X');
    expect(extractIssn('1234567X')).toBe('1234-567X');
  });

  it('strips an ISSN: label and surrounding whitespace', () => {
    expect(extractIssn('ISSN: 2041-1723')).toBe('2041-1723');
    expect(extractIssn('  issn 2041-1723  ')).toBe('2041-1723');
  });

  // Paste-tolerance cases (zd#8095): copying an ISSN from a styled source.
  it('normalizes Unicode dash variants to an ASCII hyphen', () => {
    expect(extractIssn('2041–1723')).toBe('2041-1723'); // en-dash
    expect(extractIssn('2041—1723')).toBe('2041-1723'); // em-dash
    expect(extractIssn('2041‑1723')).toBe('2041-1723'); // non-breaking hyphen
    expect(extractIssn('2041−1723')).toBe('2041-1723'); // minus sign
    expect(extractIssn('2041－1723')).toBe('2041-1723'); // full-width hyphen
  });

  it('handles eISSN / Online ISSN / ISSN-L labels', () => {
    expect(extractIssn('eISSN 2041-1723')).toBe('2041-1723');
    expect(extractIssn('Online ISSN: 2041-1723')).toBe('2041-1723');
    expect(extractIssn('ISSN-L 2041-1723')).toBe('2041-1723');
  });

  it('handles a trailing parenthetical and nbsp/zero-width chars', () => {
    expect(extractIssn('2041-1723 (Online)')).toBe('2041-1723');
    expect(extractIssn('2041 - 1723'.replace(/\s/g, ''))).toBe('2041-1723');
    expect(extractIssn('​2041-1723​')).toBe('2041-1723');
  });

  it('rejects non-ISSN input', () => {
    expect(extractIssn('')).toBeNull();
    expect(extractIssn(null)).toBeNull();
    expect(extractIssn('machine learning')).toBeNull();
    expect(extractIssn('204-1723')).toBeNull();      // wrong digit grouping
    expect(extractIssn('2041-17234')).toBeNull();     // too many digits
    expect(extractIssn('10.1234/abcd')).toBeNull();    // a DOI, not an ISSN
    expect(extractIssn('1234-56AB')).toBeNull();       // letters in body
  });
});

describe('extractOpenalexId', () => {
  it('detects a bare native author ID', () => {
    const r = extractOpenalexId('A5017453014');
    expect(r).not.toBeNull();
    expect(r.entityType).toBe('authors');
    expect(r.normalized).toBe('authors/a5017453014');
  });

  it('detects other native entity types by prefix', () => {
    expect(extractOpenalexId('W2163605009').entityType).toBe('works');
    expect(extractOpenalexId('S137773608').entityType).toBe('sources');
    expect(extractOpenalexId('I27837315').entityType).toBe('institutions');
    expect(extractOpenalexId('P4310320990').entityType).toBe('publishers');
  });

  it('accepts a full openalex.org URL (bare and namespaced)', () => {
    expect(extractOpenalexId('https://openalex.org/A5017453014').entityType).toBe('authors');
    expect(extractOpenalexId('https://openalex.org/authors/A5017453014').normalized)
      .toBe('authors/a5017453014');
  });

  it('is case-insensitive on the prefix', () => {
    expect(extractOpenalexId('a5017453014').entityType).toBe('authors');
  });

  it('rejects multi-word queries that merely start with an ID-shaped token', () => {
    expect(extractOpenalexId('A5017453014 cancer')).toBeNull();
    expect(extractOpenalexId('climate change')).toBeNull();
  });

  it('rejects short ID-shaped tokens that are really search terms', () => {
    expect(extractOpenalexId('a5')).toBeNull();   // < 4 digits
    expect(extractOpenalexId('t2')).toBeNull();
    expect(extractOpenalexId('c19')).toBeNull();
  });

  it('rejects non-native / namespaced external IDs and junk', () => {
    expect(extractOpenalexId('sdgs/1')).toBeNull();
    expect(extractOpenalexId('countries/us')).toBeNull();
    expect(extractOpenalexId('')).toBeNull();
    expect(extractOpenalexId(null)).toBeNull();
    expect(extractOpenalexId('h2o')).toBeNull();        // 'h' isn't a native prefix
    expect(extractOpenalexId('10.1234/abcd')).toBeNull(); // a DOI
  });
});

describe('hasUnquotedWildcard', () => {
  // The zd#9012 trigger: a plain trailing wildcard must auto-route to exact.
  it('detects a trailing * / ? on an unquoted word', () => {
    expect(hasUnquotedWildcard('metasta*')).toBe(true);
    expect(hasUnquotedWildcard('colo?r')).toBe(true);
    expect(hasUnquotedWildcard('cancer metasta*')).toBe(true);
  });

  it('detects a leading wildcard (still unquoted — engine rejects it, but it IS a wildcard)', () => {
    expect(hasUnquotedWildcard('*phone')).toBe(true);
    expect(hasUnquotedWildcard('?test')).toBe(true);
  });

  it('ignores wildcards that appear only inside a quoted phrase', () => {
    // A wildcard inside quotes is the adjacency/proximity case the engine routes
    // on its own — it does NOT need the stemmed→exact auto-route.
    expect(hasUnquotedWildcard('"smart* phone"')).toBe(false);
    expect(hasUnquotedWildcard('foo "bar*" baz')).toBe(false);
    expect(hasUnquotedWildcard('"basal cell carcinoma"')).toBe(false);
  });

  it('detects an unquoted wildcard alongside a quoted phrase (the #363 / zd#9012 shape)', () => {
    expect(hasUnquotedWildcard('"basal cell carcinoma" AND metasta*')).toBe(true);
    expect(hasUnquotedWildcard('foo "bar" baz*')).toBe(true);
  });

  it('returns false for ordinary queries and empty/invalid input', () => {
    expect(hasUnquotedWildcard('machine learning')).toBe(false);
    expect(hasUnquotedWildcard('"exact phrase"')).toBe(false);
    expect(hasUnquotedWildcard('')).toBe(false);
    expect(hasUnquotedWildcard(null)).toBe(false);
    expect(hasUnquotedWildcard(undefined)).toBe(false);
  });
});

describe('looksLikeOql', () => {
  // Real OQL shapes (from the docs/oql-cheatsheet.md examples, prod-verified in #530).
  it('fires on entity + where + operator clauses', () => {
    expect(looksLikeOql('works where year is (2020)')).toBe(true);
    expect(looksLikeOql('works where title has (cancer) and year >= (2020)')).toBe(true);
    expect(looksLikeOql('works where institution is (I136199984) or funder is (F4320332161)')).toBe(true);
    expect(looksLikeOql('works where title/abstract has ((vape or vaping) and (health or harm))')).toBe(true);
    expect(looksLikeOql('works where country is (not FR)')).toBe(true);
    expect(looksLikeOql("works where it's cited by (W2741809807)")).toBe(true);
    expect(looksLikeOql('authors where works count >= (100)')).toBe(true);
    expect(looksLikeOql('institutions where country is (CA)')).toBe(true);
  });

  it('accepts an optional leading "get"', () => {
    expect(looksLikeOql('get works where year is (2020)')).toBe(true);
  });

  it('fires on sort by / group by / sample tails without where', () => {
    expect(looksLikeOql('works sort by year desc')).toBe(true);
    expect(looksLikeOql('works group by type')).toBe(true);
    expect(looksLikeOql('works sample 100')).toBe(true);
  });

  it('normalizes pretty-printed (multi-line) OQL', () => {
    expect(looksLikeOql('works\n  where title has (cancer)\n  and year >= (2020)')).toBe(true);
  });

  it('is case-insensitive on the frame words', () => {
    expect(looksLikeOql('Works WHERE year is (2020)')).toBe(true);
  });

  // Prose / search phrases must stay quiet.
  it('stays quiet on ordinary prose, even with "where"/"and"', () => {
    expect(looksLikeOql('where do camels live and why')).toBe(false);
    expect(looksLikeOql('works about camels')).toBe(false);
    expect(looksLikeOql('the decline of institutions')).toBe(false);
    expect(looksLikeOql('sources say the economy is bad')).toBe(false);
    expect(looksLikeOql('types of renewable energy')).toBe(false);
    expect(looksLikeOql('climate change and health')).toBe(false);
  });

  it('stays quiet on a where-body with no operator machinery', () => {
    expect(looksLikeOql('works where to find data')).toBe(false);
  });

  it('never fires on a bare entity noun', () => {
    expect(looksLikeOql('works')).toBe(false);
    expect(looksLikeOql('  authors  ')).toBe(false);
  });

  it('never fires on identifiers or wildcard searches', () => {
    expect(looksLikeOql('https://doi.org/10.7717/peerj.4375')).toBe(false);
    expect(looksLikeOql('0000-0002-3126-6811')).toBe(false);
    expect(looksLikeOql('W2741809807')).toBe(false);
    expect(looksLikeOql('wom?n')).toBe(false);
    expect(looksLikeOql('psoriati*')).toBe(false);
  });

  it('handles junk input', () => {
    expect(looksLikeOql('')).toBe(false);
    expect(looksLikeOql(null)).toBe(false);
    expect(looksLikeOql(undefined)).toBe(false);
    expect(looksLikeOql(42)).toBe(false);
  });
});

// --- Split-profile author detection (oxjob #820) ---

describe('dedupeByName', () => {
  it('keeps the highest-works profile per display name', () => {
    const items = [
      { id: 'A1', display_name: 'Philippe Houdry', works_count: 1 },
      { id: 'A2', display_name: 'Philippe Houdry', works_count: 6 },
      { id: 'A3', display_name: 'Someone Else', works_count: 3 },
    ];
    const out = dedupeByName(items);
    expect(out).toHaveLength(2);
    expect(out.find(i => i.display_name === 'Philippe Houdry').id).toBe('A2');
  });

  it('compares names case-insensitively', () => {
    const out = dedupeByName([
      { id: 'A1', display_name: 'wei zhang', works_count: 1 },
      { id: 'A2', display_name: 'Wei Zhang', works_count: 2 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('A2');
  });
});


describe('footerSearchEntityType', () => {
  it('swaps to authors when every suggestion is an author', () => {
    expect(footerSearchEntityType(['authors', 'authors', 'authors'], 'works')).toBe('authors');
  });

  it('swaps to sources / institutions when homogeneous', () => {
    expect(footerSearchEntityType(['sources', 'sources'], 'works')).toBe('sources');
    expect(footerSearchEntityType(['institutions'], 'works')).toBe('institutions');
  });

  it('stays on the current entity for mixed lists', () => {
    expect(footerSearchEntityType(['authors', 'institutions', 'keywords'], 'works')).toBe('works');
    expect(footerSearchEntityType(['authors', 'authors', 'keywords'], 'works')).toBe('works');
  });

  it('does not swap for non-swappable homogeneous types', () => {
    expect(footerSearchEntityType(['keywords', 'keywords'], 'works')).toBe('works');
    expect(footerSearchEntityType(['works', 'works'], 'works')).toBe('works');
    expect(footerSearchEntityType(['topics'], 'works')).toBe('works');
  });

  it('stays on the current entity for empty or missing lists', () => {
    expect(footerSearchEntityType([], 'works')).toBe('works');
    expect(footerSearchEntityType(null, 'topics')).toBe('topics');
  });

  it('a single author suggestion still swaps (no dupes required)', () => {
    expect(footerSearchEntityType(['authors'], 'works')).toBe('authors');
  });

  it('is a no-op swap on that entity\'s own SERP', () => {
    expect(footerSearchEntityType(['authors', 'authors'], 'authors')).toBe('authors');
  });
});

describe('extractLocationId', () => {
  it('accepts a labeled DOI, preserving case of the suffix', () => {
    expect(extractLocationId('doi:10.1038/nature12373')).toBe('doi:10.1038/nature12373');
    expect(extractLocationId('DOI:10.1002/(SICI)1096-8644')).toBe('doi:10.1002/(SICI)1096-8644');
  });

  it('accepts a bare DOI and namespaces it', () => {
    expect(extractLocationId('10.1038/nature12373')).toBe('doi:10.1038/nature12373');
  });

  it('accepts a doi.org URL', () => {
    expect(extractLocationId('https://doi.org/10.1038/nature12373')).toBe('doi:10.1038/nature12373');
    expect(extractLocationId('http://dx.doi.org/10.1038/nature12373')).toBe('doi:10.1038/nature12373');
  });

  it('accepts pmh ids verbatim (slashes, colons, case) with lowercased namespace', () => {
    expect(extractLocationId('pmh:/neu:cj82kt84h')).toBe('pmh:/neu:cj82kt84h');
    expect(extractLocationId('PMH:oai:HAL:hal-01234')).toBe('pmh:oai:HAL:hal-01234');
  });

  it('accepts mag/pmid ids only when all-digit', () => {
    expect(extractLocationId('mag:999999992')).toBe('mag:999999992');
    expect(extractLocationId('pmid:12345678')).toBe('pmid:12345678');
    expect(extractLocationId('mag:not-a-number')).toBeNull();
  });

  it('accepts a full location URL, stripping the prefix verbatim', () => {
    expect(extractLocationId('https://openalex.org/locations/doi:10.1038/nature12373')).toBe('doi:10.1038/nature12373');
    expect(extractLocationId('https://openalex.org/locations/pmh:/neu:cj82kt84h')).toBe('pmh:/neu:cj82kt84h');
  });

  it('rejects multi-word queries and plain text', () => {
    expect(extractLocationId('climate change')).toBeNull();
    expect(extractLocationId('doi:10.1038/nature12373 extra')).toBeNull();
    expect(extractLocationId('repository records')).toBeNull();
    expect(extractLocationId('')).toBeNull();
    expect(extractLocationId(null)).toBeNull();
  });

  it('rejects a doi namespace with a non-DOI value', () => {
    expect(extractLocationId('doi:not-a-doi')).toBeNull();
  });
});
