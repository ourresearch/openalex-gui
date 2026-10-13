// Which canonical OQL the site shows (oxjob #1555): the `new_oql` flag picks x_new_oql.
import { describe, it, expect } from 'vitest';
import { pickOql, NEW_OQL_FLAG } from '@/oqlForm';

describe('pickOql', () => {
  const both = { oql: 'get works where title-abstract-keywords has (kelp)', x_new_oql: 'get works about kelp' };
  it('shows today\'s form with the flag off', () => {
    expect(pickOql(both, false)).toBe(both.oql);
  });
  it('shows the new form with the flag on', () => {
    expect(pickOql(both, true)).toBe('get works about kelp');
  });
  it('falls back to today\'s form when the API gave no new form', () => {
    expect(pickOql({ oql: 'get works' }, true)).toBe('get works');
    expect(pickOql({ oql: 'get works', x_new_oql: null }, true)).toBe('get works');
  });
  it('is null for nothing', () => {
    expect(pickOql(null, true)).toBeNull();
    expect(pickOql({}, false)).toBeNull();
  });
  it('names the flag', () => {
    expect(NEW_OQL_FLAG).toBe('new_oql');
  });
});
