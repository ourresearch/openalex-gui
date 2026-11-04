// One status word per curation, read the same way everywhere (oxjob #2009).
import { describe, it, expect } from 'vitest';
import { isOpenCuration, latestCurationPerWork, statusMeta } from '@/composables/useCurationDescriptor';

const sid = (id) => (String(id || '').match(/W\d+/i) || [''])[0].toUpperCase();
const cur = (id, entityId, action, status, created) =>
  ({ id, entity_id: `https://openalex.org/${entityId}`, action, status, created });

describe('status words', () => {
  it('timed_out is a warning, not a red error', () => {
    expect(statusMeta({ status: 'timed_out' })).toMatchObject({ label: 'Not seen live yet', color: 'warning' });
  });
  it('unknown words fall back to pending', () => {
    expect(statusMeta({ status: 'something_new' }).label).toBe('Pending');
  });
  it('only pending and timed_out are open', () => {
    expect(['pending', 'timed_out', 'applied', 'superseded', 'not_applied'].filter((s) => isOpenCuration({ status: s })))
      .toEqual(['pending', 'timed_out']);
  });
});

describe('latestCurationPerWork', () => {
  it('a re-claim after a removal wins, so the work is not a pending removal', () => {
    const latest = latestCurationPerWork([
      cur('a', 'W1', 'remove', 'applied', '2026-10-01T00:00:00Z'),
      cur('b', 'W1', 'replace', 'pending', '2026-10-02T00:00:00Z'),
    ], sid);
    expect(latest.W1.id).toBe('b');
  });
  it('a superseded add is not open', () => {
    const latest = latestCurationPerWork([cur('a', 'W2', 'replace', 'superseded', '2026-10-01T00:00:00Z')], sid);
    expect(Object.values(latest).filter(isOpenCuration)).toEqual([]);
  });
  it('same created: the larger id is newer; a missing created is oldest', () => {
    const latest = latestCurationPerWork([
      cur('cur-b', 'W3', 'replace', 'pending', '2026-10-01T00:00:00Z'),
      cur('cur-a', 'W3', 'remove', 'pending', '2026-10-01T00:00:00Z'),
      cur('cur-z', 'W3', 'remove', 'pending', null),
    ], sid);
    expect(latest.W3.id).toBe('cur-b');
  });
});
