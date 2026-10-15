// #1689: record pages show the record's DOI (works) and a "Use the API" line in
// the server render, so non-JS fetchers and Markdown conversions see them.
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
const source = load('sources-S1983995261');

const render = (props) => renderToString(createSSRApp({ render: () => h(EntityNew, props) }));
const text = (html) => html.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('EntityNew on record pages', () => {
  it('works: the API line, linked, after the OpenAlex ID', async () => {
    const html = await render({ data: work, type: 'works', apiLink: true });
    expect(text(html)).toContain('Use the API: https://api.openalex.org/works/W2741809807. It has more data and is faster.');
    expect(html).toContain('<a href="https://api.openalex.org/works/W2741809807">https://api.openalex.org/works/W2741809807</a>');
    expect(text(html).indexOf('OpenAlex ID:')).toBeLessThan(text(html).indexOf('Use the API:'));
    expect(html).not.toMatch(/—/);
  });
  it('authors and sources get their own API URL', async () => {
    expect(text(await render({ data: author, type: 'authors', apiLink: true }))).toContain('Use the API: https://api.openalex.org/authors/A5048491430.');
    expect(text(await render({ data: source, type: 'sources', apiLink: true }))).toContain('Use the API: https://api.openalex.org/sources/S1983995261.');
  });
  it('no API line where EntityNew is not the record page (drawer, locations)', async () => {
    expect(text(await render({ data: work, type: 'works' }))).not.toContain('Use the API');
  });
  it('works: a DOI row with the bare DOI linked to doi.org, right after Source', async () => {
    const html = await render({ data: work, type: 'works', apiLink: true });
    expect(text(html)).toContain('DOI: 10.7717/peerj.4375');
    expect(html).toMatch(/<a href="https:\/\/doi\.org\/10\.7717\/peerj\.4375" target="_blank">\s*10\.7717\/peerj\.4375/);
    const t = text(html);
    expect(t.indexOf('[row primary_location.source.id]')).toBeGreaterThan(-1);
    expect(t.indexOf('[row primary_location.source.id]')).toBeLessThan(t.indexOf('DOI:'));
    expect(t.indexOf('DOI:')).toBeLessThan(t.indexOf('[row authorships.author.id]'));
  });
  it('no DOI row for a work without a DOI', async () => {
    const html = await render({ data: { ...work, doi: null }, type: 'works', apiLink: true });
    expect(text(html)).not.toContain('DOI:');
  });
});
