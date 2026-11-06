import { describe, it, expect } from 'vitest';
import { typeIcons, getTypeIcon, fallbackTypeIcon } from '@/typeIcons';

describe('typeIcons', () => {
  it('names the live work types only: libguides is retired (oxjob #1647)', () => {
    expect(Object.keys(typeIcons)).toHaveLength(25);
    expect(typeIcons).not.toHaveProperty('libguides');
  });
  it('has an icon for study-registration, added 7 Nov 2026 (oxjob #2063)', () => {
    expect(getTypeIcon('study-registration')).toBe('mdi-clipboard-text-clock-outline');
  });
  it('an old or unknown type still gets an icon', () => {
    expect(getTypeIcon('libguides')).toBe(fallbackTypeIcon);
    expect(getTypeIcon('https://openalex.org/types/article')).toBe('mdi-file-document-outline');
  });
});
