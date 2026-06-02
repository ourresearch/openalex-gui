import { describe, it, expect } from 'vitest';
import { sanitizeLoginToken } from '../util.js';

describe('sanitizeLoginToken', () => {
  const token = 'wbq9VnRJCpn62ZGxSe51Ho3fRNcdyXxKcGMLinMwZAc';

  it('leaves a clean base64url token untouched', () => {
    expect(sanitizeLoginToken(token)).toBe(token);
  });

  it('strips a trailing single quote (the #8891 failure)', () => {
    expect(sanitizeLoginToken(token + "'")).toBe(token);
  });

  it('strips a trailing double quote', () => {
    expect(sanitizeLoginToken(token + '"')).toBe(token);
  });

  it('strips a curly quote (as Zendesk rendered the report)', () => {
    expect(sanitizeLoginToken(token + '“')).toBe(token);
  });

  it('strips whitespace and angle brackets', () => {
    expect(sanitizeLoginToken(`<${token}>`)).toBe(token);
    expect(sanitizeLoginToken(`  ${token} `)).toBe(token);
  });

  it('preserves underscores and hyphens', () => {
    expect(sanitizeLoginToken('ab_cd-EF_gh-12')).toBe('ab_cd-EF_gh-12');
  });

  it('returns "" for null/undefined/empty', () => {
    expect(sanitizeLoginToken(null)).toBe('');
    expect(sanitizeLoginToken(undefined)).toBe('');
    expect(sanitizeLoginToken('')).toBe('');
  });
});
