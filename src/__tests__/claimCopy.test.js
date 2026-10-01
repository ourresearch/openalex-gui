import { describe, it, expect } from 'vitest';
import {
  copy, reasonText, claimView, orcidAuthorizeUrl, orcidCallbackFlow, bareOrcid, sameOrcid, ORCID_STATE_SETTINGS,
} from '@/components/Entity/claimCopy.js';

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

  it('shows the one-click ORCID screen when the linked iD is on the profile (#1475)', () => {
    expect(claimView({ claim: null, eligibility: 'review', authorId: 'A1', orcidMatch: true })).toBe('orcid');
    // A university email still wins; an answered claim still shows its answer.
    expect(claimView({ claim: null, eligibility: 'instant', authorId: 'A1', orcidMatch: true })).toBe('instant');
    expect(claimView({ claim: { decision: 'pending', author_id: 'A1' }, eligibility: 'review', authorId: 'A1', orcidMatch: true })).toBe('checking');
  });

  it('routes /orcid-callback by state (#1475)', () => {
    expect(orcidCallbackFlow('A5023888391')).toEqual({ flow: 'claim', authorId: 'A5023888391' });
    expect(orcidCallbackFlow('a12')).toEqual({ flow: 'claim', authorId: 'A12' });
    expect(orcidCallbackFlow(ORCID_STATE_SETTINGS)).toEqual({ flow: 'settings' });
    expect(orcidCallbackFlow(undefined)).toEqual({ flow: 'settings' });
    expect(orcidCallbackFlow('A12; drop')).toEqual({ flow: 'settings' });
    const u = new URL(orcidAuthorizeUrl({ clientId: 'APP-X', origin: 'https://openalex.org', state: ORCID_STATE_SETTINGS }));
    expect(u.searchParams.get('state')).toBe('settings');
  });

  it('compares ORCID iDs in any shape', () => {
    expect(bareOrcid('https://orcid.org/0000-0002-1825-009x')).toBe('0000-0002-1825-009X');
    expect(sameOrcid('0000-0002-1825-0097', 'https://orcid.org/0000-0002-1825-0097')).toBe(true);
    expect(sameOrcid('', '')).toBe(false);
    expect(sameOrcid(null, '0000-0002-1825-0097')).toBe(false);
  });

  it('says "Link your ORCID" in the claim window and in Settings', () => {
    expect(copy.orcid.button).toBe('Link your ORCID');
    expect(copy.orcidSettings.linkButton).toBe(copy.orcid.button);
    expect(copy.orcidFound.one('Ana Silva', 1234)).toBe('We found your profile: Ana Silva (1,234 works). It has your ORCID iD.');
    expect(copy.orcidFound.one('Ana Silva', 1)).toContain('(1 work)');
  });
});
