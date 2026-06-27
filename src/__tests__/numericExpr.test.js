import { describe, it, expect } from 'vitest';
import { parseNumericExpr } from '../components/Oql/numericExpr.js';

// oxjob #527 — parse a numeric/range filter chip's typed text into one or more
// comparison filters. Semantics locked with Jason: symbol comparators are literal,
// word comparators (after/before) are inclusive, `-`/`to`/`..` is a range (TWO
// filters), `or`/`,` is a value list (ONE filter), `and`/`&` splits into TWO filters.

const f = (op, ...values) => ({ op, values });

describe('parseNumericExpr — equality', () => {
  it('a bare number is equality', () => {
    expect(parseNumericExpr('2020')).toEqual({ filters: [f('is', 2020)] });
  });
  it('trims surrounding whitespace', () => {
    expect(parseNumericExpr('  2020  ')).toEqual({ filters: [f('is', 2020)] });
  });
  it('empty / whitespace -> null', () => {
    expect(parseNumericExpr('')).toBeNull();
    expect(parseNumericExpr('   ')).toBeNull();
    expect(parseNumericExpr(null)).toBeNull();
    expect(parseNumericExpr(undefined)).toBeNull();
  });
});

describe('parseNumericExpr — single inequality (symbol forms are literal)', () => {
  it('>2000 -> >', () => {
    expect(parseNumericExpr('>2000')).toEqual({ filters: [f('>', 2000)] });
  });
  it('>=2000 -> >=', () => {
    expect(parseNumericExpr('>=2000')).toEqual({ filters: [f('>=', 2000)] });
    expect(parseNumericExpr('≥2000')).toEqual({ filters: [f('>=', 2000)] });
  });
  it('<1970 -> <', () => {
    expect(parseNumericExpr('<1970')).toEqual({ filters: [f('<', 1970)] });
  });
  it('<=1970 -> <=', () => {
    expect(parseNumericExpr('<=1970')).toEqual({ filters: [f('<=', 1970)] });
    expect(parseNumericExpr('≤1970')).toEqual({ filters: [f('<=', 1970)] });
  });
  it('tolerates a space after the comparator', () => {
    expect(parseNumericExpr('> 2000')).toEqual({ filters: [f('>', 2000)] });
  });
});

describe('parseNumericExpr — word comparators are INCLUSIVE', () => {
  it('after 2020 -> >= 2020', () => {
    expect(parseNumericExpr('after 2020')).toEqual({ filters: [f('>=', 2020)] });
  });
  it('before 1970 -> <= 1970', () => {
    expect(parseNumericExpr('before 1970')).toEqual({ filters: [f('<=', 1970)] });
  });
  it('is case-insensitive', () => {
    expect(parseNumericExpr('After 2020')).toEqual({ filters: [f('>=', 2020)] });
    expect(parseNumericExpr('BEFORE 1970')).toEqual({ filters: [f('<=', 1970)] });
  });
});

describe('parseNumericExpr — ranges become TWO filters', () => {
  it('2000-2020 -> >= 2000 AND <= 2020', () => {
    expect(parseNumericExpr('2000-2020')).toEqual({ filters: [f('>=', 2000), f('<=', 2020)] });
  });
  it('open-ended low: 2000- -> >= 2000', () => {
    expect(parseNumericExpr('2000-')).toEqual({ filters: [f('>=', 2000)] });
  });
  it('open-ended high: -2020 -> <= 2020', () => {
    expect(parseNumericExpr('-2020')).toEqual({ filters: [f('<=', 2020)] });
  });
  it('reversed range auto-swaps: 2020-2000 -> >= 2000 AND <= 2020', () => {
    expect(parseNumericExpr('2020-2000')).toEqual({ filters: [f('>=', 2000), f('<=', 2020)] });
  });
  it('accepts alternate separators (to, .., en-dash, em-dash)', () => {
    const expected = { filters: [f('>=', 2000), f('<=', 2020)] };
    expect(parseNumericExpr('2000 to 2020')).toEqual(expected);
    expect(parseNumericExpr('2000..2020')).toEqual(expected);
    expect(parseNumericExpr('2000–2020')).toEqual(expected); // –
    expect(parseNumericExpr('2000—2020')).toEqual(expected); // —
  });
  it('a bare separator is not a range', () => {
    expect(parseNumericExpr('-')).toBeNull();
  });
});

describe('parseNumericExpr — value lists (one filter)', () => {
  it('comma list -> single is filter with multiple values', () => {
    expect(parseNumericExpr('2020, 2011')).toEqual({ filters: [f('is', 2020, 2011)] });
  });
  it('or list -> same value list', () => {
    expect(parseNumericExpr('2020 or 2021')).toEqual({ filters: [f('is', 2020, 2021)] });
  });
  it('comma without spaces', () => {
    expect(parseNumericExpr('2020,2011,1999')).toEqual({ filters: [f('is', 2020, 2011, 1999)] });
  });
  it('a value list with a comparator is rejected (no-op)', () => {
    expect(parseNumericExpr('>2000 or 2021')).toBeNull();
  });
});

describe('parseNumericExpr — and splits into separate filters', () => {
  it('2020 and 2021 -> TWO equality filters', () => {
    expect(parseNumericExpr('2020 and 2021')).toEqual({ filters: [f('is', 2020), f('is', 2021)] });
  });
  it('& is an alias for and', () => {
    expect(parseNumericExpr('2020 & 2021')).toEqual({ filters: [f('is', 2020), f('is', 2021)] });
  });
  it('and-joined inequalities -> a range expressed explicitly', () => {
    expect(parseNumericExpr('>2000 and <2020')).toEqual({ filters: [f('>', 2000), f('<', 2020)] });
  });
  it('and-joined word comparators (inclusive)', () => {
    expect(parseNumericExpr('after 2000 and before 2020')).toEqual({ filters: [f('>=', 2000), f('<=', 2020)] });
  });
  it('and of two ranges', () => {
    expect(parseNumericExpr('2000-2010 and 2015-2020')).toEqual({
      filters: [f('>=', 2000), f('<=', 2010), f('>=', 2015), f('<=', 2020)],
    });
  });
});

describe('parseNumericExpr — invalid / graceful no-op', () => {
  it('non-numeric -> null', () => {
    expect(parseNumericExpr('abc')).toBeNull();
    expect(parseNumericExpr('twenty')).toBeNull();
  });
  it('a lone comparator -> null', () => {
    expect(parseNumericExpr('>')).toBeNull();
    expect(parseNumericExpr('after')).toBeNull();
  });
  it('a mixed garbage segment invalidates the whole expression', () => {
    expect(parseNumericExpr('2020 and abc')).toBeNull();
  });
});
