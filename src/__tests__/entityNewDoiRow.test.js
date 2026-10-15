// #1689: work pages show the DOI as text in the server render (search engines,
// AI fetchers and Markdown conversions read it), linked to doi.org.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';

// The real rows pull in the whole app (router, EntityPage, Nuxt's #app); a stub that
// prints each row's key is enough to check what EntityNew adds and where.
vi.mock('@/components/Entity/EntityDatumRow.vue', async () => {
  const { h: hh } = await import('vue');
  return { default: { name: 'EntityDatumRow', props: ['filterKey', 'data', 'type', 'showMissing'], render() { return hh('div', `[row ${this.filterKey}]`); } } };
});
const { default: EntityNew } = await import('@/components/Entity/EntityNew.vue');

const FIXTURES = path.resolve(__dirname, '../../assistantPages/fixtures');
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8'));
const work = load('works-W2741809807');
const author = load('authors-A5048491430');

const render = (props) => renderToString(createSSRApp({ render: () => h(EntityNew, props) }));
const text = (html) => html.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('EntityNew DOI row (#1689)', () => {
  it('works: the bare DOI linked to doi.org, right after Source', async () => {
    const html = await render({ data: work, type: 'works' });
    expect(text(html)).toContain('DOI: 10.7717/peerj.4375');
    expect(html).toMatch(/<a href="https:\/\/doi\.org\/10\.7717\/peerj\.4375" target="_blank">\s*10\.7717\/peerj\.4375/);
    const t = text(html);
    expect(t.indexOf('[row primary_location.source.id]')).toBeGreaterThan(-1);
    expect(t.indexOf('[row primary_location.source.id]')).toBeLessThan(t.indexOf('DOI:'));
    expect(t.indexOf('DOI:')).toBeLessThan(t.indexOf('[row authorships.author.id]'));
  });
  it('no DOI row for a work without a DOI, or for other entity types', async () => {
    expect(text(await render({ data: { ...work, doi: null }, type: 'works' }))).not.toContain('DOI:');
    expect(text(await render({ data: author, type: 'authors' }))).not.toContain('DOI:');
  });
  it('no inline API line (dropped 2026-10-15; agents get the notice instead)', async () => {
    expect(text(await render({ data: work, type: 'works' }))).not.toContain('Use the API');
  });
});
