import { describe, it, expect } from 'vitest';
import { unresolvedIdDiagnostics } from '@/components/OqlPlayground/unresolvedIds';

// oxjob #419 — the editor reads the server's "[no entity found]" sentinel (#418) out
// of the canonical oql and turns it into a loud, NON-blocking inline warning. These
// cover the pure detection/positioning logic; the badge + squiggle wiring is verified
// in-browser.
describe('unresolvedIdDiagnostics', () => {
  it('returns nothing when every id resolved (no sentinel in canonical)', () => {
    const q = 'works where institution is I136199984';
    const canonical = 'works where institution is I136199984 [Harvard University]';
    expect(unresolvedIdDiagnostics(q, canonical)).toEqual([]);
  });

  it('warns once for a single unresolvable id, bounding the buffer token', () => {
    const q = 'works where institution is I999999999';
    const canonical = 'works where institution is I999999999 [no entity found]';
    const out = unresolvedIdDiagnostics(q, canonical);
    expect(out).toHaveLength(1);
    const w = out[0];
    expect(w.severity).toBe('warning');
    expect(w.code).toBe('OQL_UNRESOLVABLE_ID');
    // from/to must bound exactly the id token in the *buffer*
    expect(q.slice(w.from, w.to)).toBe('I999999999');
    expect(w.message).toContain('I999999999');
    expect(w.message.toLowerCase()).toContain('no entity found');
  });

  it('warns per unresolvable id and ignores the resolved one (mixed)', () => {
    const q = 'works where institution is (I136199984 or I999999999 or W123456789)';
    const canonical =
      'works where institution is (I136199984 [Harvard University] or ' +
      'I999999999 [no entity found] or W123456789 [no entity found])';
    const out = unresolvedIdDiagnostics(q, canonical);
    expect(out.map((w) => q.slice(w.from, w.to)).sort()).toEqual([
      'I999999999',
      'W123456789',
    ]);
    expect(out.every((w) => w.severity === 'warning')).toBe(true);
  });

  it('matches case-insensitively (buffer lower-case, canonical upper-case)', () => {
    const q = 'works where institution is i999999999';
    const canonical = 'works where institution is I999999999 [no entity found]';
    const out = unresolvedIdDiagnostics(q, canonical);
    expect(out).toHaveLength(1);
    expect(q.slice(out[0].from, out[0].to)).toBe('i999999999');
  });

  it('warns on every occurrence of the same unresolvable id', () => {
    const q = 'works where institution is I999999999 or funder is I999999999';
    const canonical =
      'works where institution is I999999999 [no entity found] or ' +
      'funder is I999999999 [no entity found]';
    expect(unresolvedIdDiagnostics(q, canonical)).toHaveLength(2);
  });

  it('returns nothing when there is no canonical (invalid query → oql null)', () => {
    expect(unresolvedIdDiagnostics('works where institution is I999999999', null)).toEqual([]);
    expect(unresolvedIdDiagnostics('', '')).toEqual([]);
  });
});
