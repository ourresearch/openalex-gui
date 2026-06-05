import { describe, it, expect } from 'vitest';
import {
  shortWorkId,
  shortAuthorId,
  bucketWorksByName,
  buildNameRows,
  buildRemoveCuration,
  namePending,
  nameRemoved,
} from '../composables/observedNamesMapping';

// oxjob #342 — name-level "remove observed names". These pin the correctness
// claims behind the mapper: EXACT case-sensitive raw_author_name bucketing
// (EXPLORE Q1) and curation-derived name visibility (EXPLORE Q2).

const A = 'A5023888391';
const OTHER = 'A9999999999';

const work = (wid, authorships) => ({
  id: `https://openalex.org/${wid}`,
  authorships,
});
const aship = (authorId, raw) => ({
  author: { id: `https://openalex.org/${authorId}` },
  raw_author_name: raw,
});

describe('id normalizers', () => {
  it('extracts short uppercase ids from full URLs and bare ids', () => {
    expect(shortWorkId('https://openalex.org/W123')).toBe('W123');
    expect(shortWorkId('w123')).toBe('W123');
    expect(shortAuthorId('https://openalex.org/A5023888391')).toBe(A);
    expect(shortWorkId(null)).toBe('');
  });
});

describe('bucketWorksByName (EXPLORE Q1: exact, case-sensitive)', () => {
  it('buckets each work under THIS author\'s exact raw_author_name', () => {
    const works = [
      work('W1', [aship(A, 'Jason Priem'), aship(OTHER, 'Someone Else')]),
      work('W2', [aship(A, 'Jason Priem')]),
      work('W3', [aship(A, 'J. Priem')]),
    ];
    const buckets = bucketWorksByName(works, A);
    expect(buckets['Jason Priem']).toEqual(['W1', 'W2']);
    expect(buckets['J. Priem']).toEqual(['W3']);
    // never buckets under another author's name
    expect(buckets['Someone Else']).toBeUndefined();
  });

  it('treats case/spacing variants as DISTINCT names (no normalization)', () => {
    const works = [
      work('W1', [aship(A, 'Jason Priem')]),
      work('W2', [aship(A, 'jason priem')]),
      work('W3', [aship(A, 'Jason  Priem')]),
    ];
    const buckets = bucketWorksByName(works, A);
    expect(Object.keys(buckets).sort()).toEqual([
      'Jason  Priem',
      'Jason Priem',
      'jason priem',
    ]);
  });

  it('accumulates across pages into the same object', () => {
    const buckets = {};
    bucketWorksByName([work('W1', [aship(A, 'Jason Priem')])], A, buckets);
    bucketWorksByName([work('W2', [aship(A, 'Jason Priem')])], A, buckets);
    expect(buckets['Jason Priem']).toEqual(['W1', 'W2']);
  });

  it('skips works/authorships with no raw name for this author', () => {
    const works = [
      work('W1', [aship(OTHER, 'Other Name')]),
      work('W2', [{ author: { id: `https://openalex.org/${A}` } }]),
    ];
    expect(bucketWorksByName(works, A)).toEqual({});
  });
});

describe('buildNameRows (preview rows; hide stale + fully-removed)', () => {
  const nameToWorkIds = {
    'Jason Priem': ['W1', 'W2', 'W3'],
    'J. Priem': ['W4'],
    'Stale Name': [], // observed name with no matching raw string -> 0 works
  };
  it('lists names with removable-work counts, hiding 0-work names', () => {
    const rows = buildNameRows(
      ['Jason Priem', 'J. Priem', 'Stale Name'],
      nameToWorkIds,
      {}
    );
    expect(rows).toEqual([
      { name: 'Jason Priem', workIds: ['W1', 'W2', 'W3'], removableIds: ['W1', 'W2', 'W3'], count: 3 },
      { name: 'J. Priem', workIds: ['W4'], removableIds: ['W4'], count: 1 },
    ]);
  });
  it('drops a name once all its works already have remove-curations', () => {
    const removed = { W4: true };
    const rows = buildNameRows(['J. Priem'], nameToWorkIds, removed);
    expect(rows).toEqual([]);
  });
  it('counts only NOT-yet-removed works as removable', () => {
    const removed = { W1: true };
    const rows = buildNameRows(['Jason Priem'], nameToWorkIds, removed);
    expect(rows[0].count).toBe(2);
    expect(rows[0].removableIds).toEqual(['W2', 'W3']);
  });
});

describe('name visibility (EXPLORE Q2: curation-derived, not doc-derived)', () => {
  const nameToWorkIds = { 'Jason Priem': ['W1', 'W2'] };
  it('pending while >=1 constituent work has a PENDING removal', () => {
    expect(namePending('Jason Priem', nameToWorkIds, { W1: true })).toBe(true);
    expect(namePending('Jason Priem', nameToWorkIds, {})).toBe(false);
  });
  it('removed (hidden) only once EVERY constituent work removal is APPLIED', () => {
    // pass the APPLIED set: a single applied work is not enough for a 2-work name
    expect(nameRemoved('Jason Priem', nameToWorkIds, { W1: true })).toBe(false);
    expect(nameRemoved('Jason Priem', nameToWorkIds, { W1: true, W2: true })).toBe(true);
  });
  it('pending-but-not-applied => struck-through, NOT hidden (regression: 1-work name vanished on submit)', () => {
    // The single work has a pending removal (pendingSet) but is not yet applied
    // (appliedSet empty). The name must stay visible & struck, not disappear.
    const single = { 'Terliesner, Jens': ['W9'] };
    const pendingSet = { W9: true };
    const appliedSet = {};
    expect(namePending('Terliesner, Jens', single, pendingSet)).toBe(true); // struck
    expect(nameRemoved('Terliesner, Jens', single, appliedSet)).toBe(false); // not hidden
    // …then the hourly worker applies it:
    expect(nameRemoved('Terliesner, Jens', single, { W9: true })).toBe(true); // now hidden
  });
  it('an unmapped name is neither pending nor removed', () => {
    expect(namePending('Unknown', nameToWorkIds, { W1: true })).toBe(false);
    expect(nameRemoved('Unknown', nameToWorkIds, { W1: true })).toBe(false);
  });
});

describe('buildRemoveCuration (canonical FULL-URL id form — #342 P8)', () => {
  // The Walden export view `work_author_remove_curations` filters BOTH
  // entity_id and value with `~ '^https?://openalex.org/(W|A)\d+$'` and silently
  // drops non-matching rows. A short id on either field => the removal never
  // reaches the pipeline and sits pending until it times out. These pin the
  // contract so a regression to short ids fails loudly instead of silently.
  const FULL_AUTHOR = 'https://openalex.org/A5023888391';

  it('emits a FULL-URL entity_id from the bucket short id', () => {
    const c = buildRemoveCuration('W2949258821', FULL_AUTHOR);
    expect(c.entity_id).toBe('https://openalex.org/W2949258821');
    expect(c.entity_id).toMatch(/^https:\/\/openalex\.org\/W\d+$/);
  });

  it('passes value (full author URL) through unchanged', () => {
    expect(buildRemoveCuration('W1', FULL_AUTHOR).value).toBe(FULL_AUTHOR);
  });

  it('builds the exact works/remove/authorships.author.id shape', () => {
    expect(buildRemoveCuration('W1', FULL_AUTHOR)).toEqual({
      entity: 'works',
      entity_id: 'https://openalex.org/W1',
      property: 'authorships.author.id',
      action: 'remove',
      value: FULL_AUTHOR,
    });
  });

  it('both id fields satisfy the Walden export-view regex (the gate this bug missed)', () => {
    const c = buildRemoveCuration('W2949258821', FULL_AUTHOR);
    const viewRe = /^https?:\/\/openalex\.org\/[WA]\d+$/;
    expect(c.entity_id).toMatch(viewRe);
    expect(c.value).toMatch(viewRe);
  });
});
