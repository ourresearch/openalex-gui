import { describe, it, expect } from 'vitest';
import { quoteExactFilterValue } from '../utils/exactFilter';

describe('quoteExactFilterValue', () => {
  it('wraps a plain value in double quotes', () => {
    expect(quoteExactFilterValue('SLUB Dresden')).toBe('"SLUB Dresden"');
  });

  it('preserves operator-like characters inside the quoted value', () => {
    expect(quoteExactFilterValue('A | B, C*D')).toBe('"A | B, C*D"');
  });

  it('escapes embedded double quotes as \\"', () => {
    expect(
      quoteExactFilterValue('Universitätsbibliothek "Georgius Agricola"')
    ).toBe('"Universitätsbibliothek \\"Georgius Agricola\\""');
  });

  it('escapes backslashes as \\\\ before escaping quotes', () => {
    expect(quoteExactFilterValue('path\\to\\thing')).toBe('"path\\\\to\\\\thing"');
    expect(quoteExactFilterValue('he said \\"hi\\"')).toBe('"he said \\\\\\"hi\\\\\\""');
  });

  it('coerces non-string values', () => {
    expect(quoteExactFilterValue(42)).toBe('"42"');
  });
});
