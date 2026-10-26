import { describe, it, expect, vi } from 'vitest';

// oxjob #1758: the page says when an id in the query matches no entity. Only a 404 counts:
// a 429 or a network failure says nothing about whether the entity exists.

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.test' }, axiosConfig: () => ({ headers: {} }) }));
vi.mock('@/edgeAutocomplete', () => ({ edgeOn: () => false, edgeSupports: () => false, edgeRows: () => [] }));
vi.mock('@/entityConfigs', () => ({ getEntityConfig: () => null }));

import axios from 'axios';
import { entityMissing, getEntityRecord } from '../components/OqlPlayground/oqlEditorApi';

const err = (status) => Object.assign(new Error(String(status)), { response: { status } });

describe('entityMissing', () => {
  it('is true only on a 404', async () => {
    axios.get.mockImplementation(async (url) => {
      if (url.includes('I150451288')) throw err(404);
      if (url.includes('I999999999')) throw err(429);
      return { data: { id: 'https://openalex.org/I33213144', display_name: 'University of Florida' } };
    });
    expect(await entityMissing('institutions', 'I150451288')).toBe(true);
    expect(await entityMissing('institutions', 'I33213144')).toBe(false);
    expect(await entityMissing('institutions', 'I999999999')).toBe(false);
    expect(await getEntityRecord('institutions', 'I150451288')).toBeNull();
  });

  it('asks again after a failure that is not a 404', async () => {
    let calls = 0;
    axios.get.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw err(429);
      return { data: { display_name: 'Florida State University' } };
    });
    expect(await getEntityRecord('institutions', 'I103163165')).toBeNull();
    expect((await getEntityRecord('institutions', 'I103163165')).display_name).toBe('Florida State University');
  });
});
