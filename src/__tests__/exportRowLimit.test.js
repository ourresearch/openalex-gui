import { describe, it, expect } from 'vitest';
import { rowLimitOptions, exportRowCount } from '@/components/exportRowLimit';

describe('export row limit (oxjob #635)', () => {
  it('offers all rows, then every limit smaller than the list', () => {
    expect(rowLimitOptions(39122).map(o => o.value)).toEqual([null, 100, 200, 500, 1000, 5000, 10000]);
    expect(rowLimitOptions(39122)[0].title).toBe(`All ${(39122).toLocaleString()} rows`);
    expect(rowLimitOptions(39122)[2].title).toBe('First 200');
    expect(rowLimitOptions(350).map(o => o.value)).toEqual([null, 100, 200]);
  });

  it('offers only all rows for a short list', () => {
    expect(rowLimitOptions(100).map(o => o.value)).toEqual([null]);
    expect(rowLimitOptions(0).map(o => o.value)).toEqual([null]);
    expect(rowLimitOptions(undefined).map(o => o.value)).toEqual([null]);
  });

  it('counts the rows the export will hold', () => {
    expect(exportRowCount(39122, 200)).toBe(200);
    expect(exportRowCount(150, 200)).toBe(150);
    expect(exportRowCount(39122, null)).toBe(39122);
    expect(exportRowCount(undefined, 200)).toBe(0);
  });
});
