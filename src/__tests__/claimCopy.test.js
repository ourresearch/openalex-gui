import { describe, it, expect } from 'vitest';
import { reasonText, claimView, orcidAuthorizeUrl } from '@/components/Entity/claimCopy.js';

describe('claim copy (oxjob #1466)', () => {
  const ctx = { email: 'ana.silva@gmail.com', link: 'https://x.org/me' };

  it('has a reason for every users-api feedback code', () => {
    for (const code of ['no_link', 'unreachable', 'email_not_found', 'self_made', 'email_not_contact', 'cant_tell']) {
      const t = reasonText(code, ctx);
      expect(t.length).toBeGreaterThan(40);
      expect(t).not.toContain('undefined');
    }
    expect(reasonText('email_not_found', ctx)).toContain('ana.silva@gmail.com');
    expect(reasonText('self_made', ctx)).toMatch(/^https:\/\/x\.org\/me is a kind of page/);
    expect(reasonText('mystery', ctx)).toContain('support@openalex.org');
  });

  it('picks the claim window screen', () => {
    const c = (decision, author_id = 'https://openalex.org/A1') => ({ decision, author_id });
    expect(claimView({ claim: null, eligibility: 'instant', authorId: 'A1' })).toBe('instant');
    expect(claimView({ claim: null, eligibility: 'review', authorId: 'A1' })).toBe('form');
    expect(claimView({ claim: c('pending'), eligibility: 'review', authorId: 'a1' })).toBe('checking');
    expect(claimView({ claim: c('needs_evidence'), eligibility: 'review', authorId: 'A1' })).toBe('needs_evidence');
    // A needs_evidence claim on another profile: this profile shows the form.
    expect(claimView({ claim: c('needs_evidence', 'A2'), eligibility: 'review', authorId: 'A1' })).toBe('form');
  });

  it('builds the ORCID authorize URL', () => {
    const u = new URL(orcidAuthorizeUrl({ clientId: 'APP-X', origin: 'https://openalex.org', authorId: 'https://openalex.org/a5023888391' }));
    expect(u.searchParams.get('scope')).toBe('/authenticate');
    expect(u.searchParams.get('redirect_uri')).toBe('https://openalex.org/orcid-callback');
    expect(u.searchParams.get('state')).toBe('A5023888391');
  });
});
