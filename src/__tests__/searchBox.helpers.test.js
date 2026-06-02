import { describe, it, expect } from 'vitest';
import { extractIssn } from '../components/searchBox.helpers.js';

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
