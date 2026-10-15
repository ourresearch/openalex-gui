// #1689 (Sentry OPENALEX-GUI-J): /authors/A… → click a work → /works/W… crashed in
// WorkLinkouts ("reading 'landing_page_url'") because the work layout rendered
// with the author's record for one tick.
import { describe, it, expect } from 'vitest';
import { ref, computed, watch, nextTick, createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { tagRecordData, recordDataFor } from '@/ssr/recordData';
import WorkLinkouts from '@/components/WorkLinkouts.vue';

const AUTHOR = { id: 'https://openalex.org/A5029290445', display_name: 'An Author', works_count: 12 };
const WORK = {
  id: 'https://openalex.org/W7171967220',
  display_name: 'A Work',
  primary_location: { landing_page_url: 'https://example.org/w', is_oa: false },
};

// A minimal model of Nuxt 4 useAsyncData with a reactive key, as EntityPage uses
// it: when the key changes, the new key starts with the OLD key's data
// (nuxt/dist/app/composables/asyncData.js, `initialValue = ... oldKey data`)
// and is replaced when the new fetch resolves.
function keyedAsyncData(keyFn, handler) {
  const store = {};
  const key = computed(keyFn);
  const pending = {};
  const run = (k) => {
    pending[k] = handler().then((v) => { store[k].value = v; });
  };
  store[key.value] = ref(undefined);
  run(key.value);
  watch(key, (newKey, oldKey) => {
    store[newKey] = ref(store[oldKey]?.value); // Nuxt's carry-over
    run(newKey);
  }, { flush: 'sync' });
  return { data: computed(() => store[key.value].value), settle: () => pending[key.value] };
}

function entityPage(route, { tagged }) {
  const apiPath = computed(() => `${route.value.entityType}/${route.value.entityId}`);
  const records = { 'authors/A5029290445': AUTHOR, 'works/W7171967220': WORK };
  const { data, settle } = keyedAsyncData(
    () => `entity:${apiPath.value}`,
    async () => {
      const path = apiPath.value;
      const rec = records[path];
      return tagged ? tagRecordData(path, rec) : rec;
    },
  );
  const entityData = tagged
    ? computed(() => recordDataFor(data.value, apiPath.value))
    : computed(() => data.value ?? null); // the shipped 3154c410 code
  return { entityData, settle };
}

describe('record data belongs to the route on screen (#1689)', () => {
  it('reproduces the bug: untagged data shows the author record on the work route', async () => {
    const route = ref({ entityType: 'authors', entityId: 'A5029290445' });
    const page = entityPage(route, { tagged: false });
    await page.settle();
    expect(page.entityData.value).toEqual(AUTHOR);
    route.value = { entityType: 'works', entityId: 'W7171967220' };
    // Route type is now 'works' but the data is still the author: WorkLinkouts crashes.
    expect(page.entityData.value).toEqual(AUTHOR);
    expect(page.entityData.value.primary_location).toBeUndefined();
  });

  it('fixed: tagged data reads as loading (null) until the work arrives', async () => {
    const route = ref({ entityType: 'authors', entityId: 'A5029290445' });
    const page = entityPage(route, { tagged: true });
    await page.settle();
    expect(page.entityData.value).toEqual(AUTHOR);
    route.value = { entityType: 'works', entityId: 'W7171967220' };
    expect(page.entityData.value).toBeNull();
    await page.settle();
    await nextTick();
    expect(page.entityData.value).toEqual(WORK);
  });

  it('recordDataFor ignores other paths, untagged and empty values', () => {
    expect(recordDataFor(tagRecordData('works/W1', WORK), 'works/W1')).toBe(WORK);
    expect(recordDataFor(tagRecordData('authors/A1', AUTHOR), 'works/W1')).toBeNull();
    expect(recordDataFor(AUTHOR, 'authors/A1')).toBeNull();
    expect(recordDataFor(undefined, 'works/W1')).toBeNull();
    expect(recordDataFor(null, 'works/W1')).toBeNull();
    expect(recordDataFor(tagRecordData('works/W1', null), 'works/W1')).toBeNull();
  });
});

describe('WorkLinkouts never crashes on a record without primary_location', () => {
  const render = async (data) => {
    const app = createSSRApp({ render: () => h(WorkLinkouts, { data }) });
    const stub = (tag) => ({ render() { return h(tag, this.$attrs, this.$slots.default?.()); } });
    app.component('v-btn', stub('a'));
    app.component('v-icon', stub('i'));
    app.config.warnHandler = () => {};
    let err = null;
    app.config.errorHandler = (e) => { err = e; };
    const html = await renderToString(app);
    if (err) throw err;
    return html;
  };

  it('renders an author record (the pre-fix crash) without throwing', async () => {
    await expect(render(AUTHOR)).resolves.toContain('HTML');
  });

  it('still links to the landing page for a real work', async () => {
    await expect(render(WORK)).resolves.toContain('https://example.org/w');
  });
});
