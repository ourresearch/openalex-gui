import { describe, it, expect } from 'vitest';
import { sanitizeRedirectPath } from '../util.js';

// oxjob #855. `redirect` starts in an attacker-suppliable URL and rides through
// an email we send, so these cases are the open-redirect guard, not cosmetics.
// Keep in sync with the Python twin's tests in
// openalex-users-api/tests/test_sanitize_redirect_path.py.
describe('sanitizeRedirectPath', () => {
  describe('accepts real destinations', () => {
    it('keeps a plain path', () => {
      expect(sanitizeRedirectPath('/jobs/software-engineer')).toBe('/jobs/software-engineer');
    });

    it('keeps the root path', () => {
      expect(sanitizeRedirectPath('/')).toBe('/');
    });

    it('keeps a query string and hash (a SERP fullPath)', () => {
      const p = '/works?filter=publication_year%3A2020&sort=cited_by_count%3Adesc#top';
      expect(sanitizeRedirectPath(p)).toBe(p);
    });

    it('keeps percent-encoded segments', () => {
      expect(sanitizeRedirectPath('/works/W123?q=a%20b')).toBe('/works/W123?q=a%20b');
    });

    it('keeps a long-but-allowed path at the cap', () => {
      const p = '/works?filter=' + 'a'.repeat(2048 - '/works?filter='.length);
      expect(p.length).toBe(2048);
      expect(sanitizeRedirectPath(p)).toBe(p);
    });
  });

  describe('rejects off-origin destinations', () => {
    it('rejects protocol-relative //evil.com', () => {
      expect(sanitizeRedirectPath('//evil.example.com')).toBe('/');
    });

    it('rejects backslash-flavoured protocol-relative /\\evil.com', () => {
      expect(sanitizeRedirectPath('/\\evil.example.com')).toBe('/');
    });

    it('rejects an absolute http(s) URL', () => {
      expect(sanitizeRedirectPath('https://evil.example.com')).toBe('/');
      expect(sanitizeRedirectPath('http://evil.example.com')).toBe('/');
    });

    it('rejects a javascript: URL', () => {
      expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/');
    });

    it('rejects a data: URL', () => {
      expect(sanitizeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/');
    });

    it('rejects a bare relative path (no leading slash)', () => {
      expect(sanitizeRedirectPath('jobs/software-engineer')).toBe('/');
    });

    it('rejects a backslash anywhere in the path', () => {
      expect(sanitizeRedirectPath('/jobs\\..\\evil')).toBe('/');
    });

    it('rejects leading whitespace before a protocol-relative URL', () => {
      expect(sanitizeRedirectPath('  //evil.example.com')).toBe('/');
    });
  });

  describe('rejects control characters', () => {
    // Browsers strip tabs/newlines out of URLs, so "/\t/evil.com" would
    // re-form as protocol-relative "//evil.com" if we let it through.
    it('rejects an embedded tab that would re-form as //', () => {
      expect(sanitizeRedirectPath('/\t/evil.example.com')).toBe('/');
    });

    it('rejects an embedded newline', () => {
      expect(sanitizeRedirectPath('/jobs\n/evil')).toBe('/');
    });

    it('rejects a NUL byte', () => {
      expect(sanitizeRedirectPath('/jobs\u0000')).toBe('/');
    });

    it('rejects DEL', () => {
      expect(sanitizeRedirectPath('/jobs\u007F')).toBe('/');
    });
  });

  describe('rejects the wrong shape entirely', () => {
    it('rejects an over-length string', () => {
      expect(sanitizeRedirectPath('/' + 'a'.repeat(4096))).toBe('/');
    });

    it('rejects the empty string', () => {
      expect(sanitizeRedirectPath('')).toBe('/');
    });

    it('rejects null and undefined', () => {
      expect(sanitizeRedirectPath(null)).toBe('/');
      expect(sanitizeRedirectPath(undefined)).toBe('/');
    });

    it('rejects non-strings (an array of params, as vue-router can hand back)', () => {
      expect(sanitizeRedirectPath(['/a', '/b'])).toBe('/');
      expect(sanitizeRedirectPath(42)).toBe('/');
      expect(sanitizeRedirectPath({})).toBe('/');
    });
  });

  describe('fallback handling', () => {
    it('returns the supplied fallback instead of "/"', () => {
      expect(sanitizeRedirectPath('//evil.example.com', '/settings/org-profile'))
        .toBe('/settings/org-profile');
    });

    it('never throws, whatever it is handed', () => {
      const nasty = [null, undefined, 0, NaN, [], {}, () => {}, Symbol('x')];
      nasty.forEach((v) => expect(() => sanitizeRedirectPath(v)).not.toThrow());
    });
  });
});
