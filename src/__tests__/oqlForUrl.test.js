import { describe, it, expect } from 'vitest';
import { oqlForUrl } from '@/oqlSerialize';

// oxjob #373 Phase 2 — OQL goes into ?oql= whitespace-collapsed (the parser is
// whitespace-blind, so the pretty-print layout is needless in a URL).
describe('oqlForUrl', () => {
  it('collapses a pretty-printed multi-line OQL to a single line (T7)', () => {
    const pretty = [
      'works where',
      '  title/abstract contains (',
      '    review and (',
      '      HAVO or VWO',
      '    )',
      '  )',
    ].join('\n');
    const out = oqlForUrl(pretty);
    expect(out).not.toMatch(/[\r\n]/);            // no newlines survive
    expect(out).not.toMatch(/ {2,}/);             // no indentation runs survive
    expect(out).toBe(
      'works where title/abstract contains ( review and ( HAVO or VWO ) )'
    );
  });

  it('preserves internal spaces inside a quoted phrase (T9)', () => {
    // The pretty-printer never puts a newline inside a quoted literal, so a run of
    // spaces inside quotes must NOT be collapsed (we only collapse newline-bearing runs).
    expect(oqlForUrl('works where title contains "academic  teacher"'))
      .toBe('works where title contains "academic  teacher"');
  });

  it('is identity (modulo trim) for an already single-line query', () => {
    expect(oqlForUrl('works where type is article')).toBe('works where type is article');
    expect(oqlForUrl('  works where type is article  ')).toBe('works where type is article');
  });

  it('handles null/undefined safely', () => {
    expect(oqlForUrl(null)).toBe('');
    expect(oqlForUrl(undefined)).toBe('');
  });

  it('collapses tabs and CRLF newlines too', () => {
    expect(oqlForUrl('works where\r\n\ttype is article')).toBe('works where type is article');
  });
});
