import { describe, it, expect } from 'vitest';
import { extractIssn, extractOpenalexId, hasUnquotedWildcard } from '../components/searchBox.helpers.js';

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
