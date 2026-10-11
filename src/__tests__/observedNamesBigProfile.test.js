import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// oxjob #1641: the observed-names mapping pass reads every work on the profile in the browser. A claimed
// profile has 2.94M works (~14,700 requests on each page load), so past MAX_NAME_MAPPING_WORKS it is skipped.
const get = vi.fn(async () => ({ data: { results: [], meta: { count: 0, next_cursor: null } } }));
vi.mock('axios', () => ({ default: { get: (...a) => get(...a) } }));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.openalex.org' } }));
vi.mock('vuex', () => ({ useStore: () => ({ dispatch: vi.fn(async () => []), commit: vi.fn() }) }));

const { useObservedNamesCuration, MAX_NAME_MAPPING_WORKS } = await import('../composables/useObservedNamesCuration');

const make = (works) => useObservedNamesCuration({
  authorId: ref('https://openalex.org/A5028125522'),
  observedNames: ref(['KOBAYASHI, Tatsuya']),
  worksCount: ref(works),
});

describe('observed-names mapping on very large profiles (#1641)', () => {
  beforeEach(() => get.mockClear());

  it('skips the mapping pass past the cap and says so', async () => {
    const c = make(2943910);
    expect(c.tooLarge.value).toBe(true);
    await c.buildMapping();
    expect(get).not.toHaveBeenCalled();
    expect(c.mapped.value).toBe(false);
  });

  it('still maps a normal profile', async () => {
    const c = make(MAX_NAME_MAPPING_WORKS);
    expect(c.tooLarge.value).toBe(false);
    await c.buildMapping();
    expect(get).toHaveBeenCalledTimes(1);
    expect(c.mapped.value).toBe(true);
  });

  it('defaults to mapping when no works count is passed', () => {
    const c = useObservedNamesCuration({ authorId: ref('A1'), observedNames: ref([]) });
    expect(c.tooLarge.value).toBe(false);
  });
});
