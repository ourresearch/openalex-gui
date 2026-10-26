// Record-page heads (oxjob #1689): one function feeds the server render and the app.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  recordHead, recordDescription, recordJsonLd, canonicalUrl, apiUrl, bareDoi, recordTitle, surname, plain, jsonForScript, DESCRIPTION_MAX,
} from '@/seo/recordHead.mjs';
import { noindexReason, isIndexable } from '@/seo/indexable.mjs';

const FIXTURES = path.resolve(__dirname, '../../assistantPages/fixtures');
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8'));
const work = load('works-W2741809807');
const RECORDS = {
  works: work,
  authors: load('authors-A5048491430'),
  sources: load('sources-S1983995261'),
  institutions: load('institutions-I136199984'),
  funders: load('funders-F4320306076'),
  publishers: load('publishers-P4310320595'),
  topics: load('topics-T13607'),
  keywords: load('keywords-open-access'),
};
const meta = (head, key) => head.meta.find((m) => m.name === key || m.property === key)?.content;
const ldOf = (head) => JSON.parse(head.script[0].innerHTML);

describe('canonicalUrl', () => {
  it('is the long form with an upper-case id, from the record id', () => {
    expect(canonicalUrl(work)).toBe('https://openalex.org/works/W2741809807');
    expect(canonicalUrl('https://openalex.org/a5023888391')).toBe('https://openalex.org/authors/A5023888391');
    expect(canonicalUrl('W1')).toBe('https://openalex.org/works/W1');
    expect(canonicalUrl('https://openalex.org/keywords/open-access')).toBe('https://openalex.org/keywords/open-access');
    expect(canonicalUrl('https://openalex.org/subfields/1802')).toBe('https://openalex.org/subfields/1802');
    expect(canonicalUrl(null)).toBe(null);
    expect(canonicalUrl('not an id')).toBe(null);
  });
  it('never carries the page URL query string (it comes from the record, not the request)', () => {
    const head = recordHead('works', work);
    expect(head.link).toEqual([
      { rel: 'canonical', href: 'https://openalex.org/works/W2741809807' },
      { rel: 'alternate', type: 'application/json', href: 'https://api.openalex.org/works/W2741809807' },
    ]);
  });
  it('points a merged id at the record it was merged into', () => {
    // The API answers /works/W_old with the surviving record; its id wins.
    const head = recordHead('works', { ...work, id: 'https://openalex.org/W999' });
    expect(head.link[0].href).toBe('https://openalex.org/works/W999');
  });
});

describe('API pointer (#1689)', () => {
  it('apiUrl is the API URL for the record id, any entity type', () => {
    expect(apiUrl(work)).toBe('https://api.openalex.org/works/W2741809807');
    expect(apiUrl('https://openalex.org/a5023888391')).toBe('https://api.openalex.org/authors/A5023888391');
    expect(apiUrl('https://openalex.org/keywords/open-access')).toBe('https://api.openalex.org/keywords/open-access');
    expect(apiUrl('https://openalex.org/sdgs/3')).toBe('https://api.openalex.org/sdgs/3');
    expect(apiUrl('https://openalex.org/countries/US')).toBe('https://api.openalex.org/countries/US');
    expect(apiUrl(null)).toBe(null);
    expect(apiUrl('doi:10.1/x')).toBe(null);
  });
  it('every record head links the same record as JSON (rel=alternate)', () => {
    const want = {
      works: 'works/W2741809807', authors: 'authors/A5048491430', sources: 'sources/S1983995261',
      institutions: 'institutions/I136199984', funders: 'funders/F4320306076', publishers: 'publishers/P4310320595',
      topics: 'topics/T13607', keywords: 'keywords/open-access',
    };
    for (const [type, r] of Object.entries(RECORDS)) {
      const alt = recordHead(type, r).link.filter((l) => l.rel === 'alternate');
      expect(alt, type).toEqual([{ rel: 'alternate', type: 'application/json', href: `https://api.openalex.org/${want[type]}` }]);
    }
  });
  it('a merged id points at the surviving record in the API too', () => {
    const head = recordHead('works', { ...work, id: 'https://openalex.org/W999' });
    expect(head.link.find((l) => l.rel === 'alternate').href).toBe('https://api.openalex.org/works/W999');
  });
  it('bareDoi strips the resolver and rejects non-DOIs', () => {
    expect(bareDoi('https://doi.org/10.7717/peerj.4375')).toBe('10.7717/peerj.4375');
    expect(bareDoi('http://dx.doi.org/10.1000/ABC(1)')).toBe('10.1000/ABC(1)');
    expect(bareDoi('doi:10.1/x')).toBe('10.1/x');
    expect(bareDoi(null)).toBe('');
    expect(bareDoi('https://example.org/paper')).toBe('');
  });
});

describe('descriptions', () => {
  it('work: year, type, venue, first surnames, citations, open access', () => {
    expect(recordDescription('works', work)).toBe(
      `2018 article in PeerJ by Piwowar, Priem, Larivière and 6 others; ${work.cited_by_count.toLocaleString('en-US')} citations; open access`,
    );
  });
  it('every fixture type gets a factual description of at most 160 characters', () => {
    for (const [type, r] of Object.entries(RECORDS)) {
      const d = recordDescription(type, r);
      expect(d.length, type).toBeGreaterThan(30);
      expect(d.length, type).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(d, type).not.toMatch(/—|undefined|null|NaN/);
    }
    expect(recordDescription('authors', RECORDS.authors)).toMatch(/^Author at OpenAlex with 140 works and 5,415 citations; ORCID 0000-0003-1613-5981/);
    expect(recordDescription('sources', RECORDS.sources)).toMatch(/^Journal published by PeerJ, Inc\./);
    expect(recordDescription('institutions', RECORDS.institutions)).toMatch(/^Educational institution in Cambridge, United States/);
    expect(recordDescription('funders', RECORDS.funders)).toMatch(/^Research funder in United States/);
    expect(recordDescription('topics', RECORDS.topics)).toMatch(/^Topic in Information Systems and Management, Decision Sciences, with/);
  });
  it('long venues and many authors shrink to fit', () => {
    const long = {
      ...work,
      primary_location: { source: { display_name: 'Proceedings of the International Conference on Extremely Long Venue Names and Their Applications to Search' } },
      authorships: Array.from({ length: 40 }, (_, i) => ({ author: { display_name: `Author Number${i}` } })),
    };
    const d = recordDescription('works', long);
    expect(d.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(d).toMatch(/Number0/);
  });
  it('a bare work still says something true', () => {
    expect(recordDescription('works', { id: 'W1', type: 'dataset' })).toBe('Dataset');
    expect(recordDescription('works', { id: 'W1', publication_year: 2020, type: 'book-chapter', cited_by_count: 1 })).toBe('2020 book chapter; 1 citation');
  });
});

describe('surname and plain', () => {
  it('takes the family name', () => {
    expect(surname('Heather Piwowar')).toBe('Piwowar');
    expect(surname('Piwowar, Heather A.')).toBe('Piwowar');
    expect(surname('Juan Pablo Alperin')).toBe('Alperin');
    expect(surname('Martin Luther King Jr.')).toBe('King');
  });
  it('strips markup from display names', () => {
    expect(plain('Growth of <i>E. coli</i> in H<sub>2</sub>O &amp; more')).toBe('Growth of E. coli in H2O & more');
  });
});

describe('recordHead', () => {
  it('works: title, description, Open Graph, Twitter, canonical, JSON-LD', () => {
    const head = recordHead('works', work, { abstract: 'Despite growing interest in Open Access...' });
    expect(head.title).toBe('The state of OA: a large-scale analysis of the prevalence and impact of Open Access articles | OpenAlex');
    expect(head.titleTemplate).toBe(null);
    expect(meta(head, 'description')).toBe(recordDescription('works', work));
    expect(meta(head, 'og:type')).toBe('article');
    expect(meta(head, 'og:title')).toBe(work.display_name);
    expect(meta(head, 'og:url')).toBe('https://openalex.org/works/W2741809807');
    expect(meta(head, 'twitter:card')).toBe('summary');
    expect(meta(head, 'robots')).toBeUndefined();
    const ld = ldOf(head);
    expect(ld['@type']).toBe('ScholarlyArticle');
    expect(ld.author).toHaveLength(9);
    expect(ld.author[0]).toMatchObject({ '@type': 'Person', name: 'Heather Piwowar', url: 'https://openalex.org/authors/A5048491430', sameAs: ['https://orcid.org/0000-0003-1613-5981'] });
    expect(ld.author[0].affiliation[0]).toMatchObject({ '@type': 'Organization', name: 'OpenAlex' });
    expect(ld.isPartOf).toMatchObject({ '@type': 'Periodical', name: 'PeerJ', issn: ['2167-8359'], url: 'https://openalex.org/sources/S1983995261' });
    expect(ld.identifier).toContainEqual({ '@type': 'PropertyValue', propertyID: 'DOI', value: '10.7717/peerj.4375' });
    expect(ld.sameAs).toContain('https://doi.org/10.7717/peerj.4375');
    expect(ld.abstract).toBe('Despite growing interest in Open Access...');
    expect(ld.datePublished).toBe('2018-02-13');
  });
  it('JSON-LD types per entity', () => {
    const types = Object.fromEntries(Object.entries(RECORDS).map(([t, r]) => [t, recordJsonLd(t, r)['@type']]));
    expect(types).toEqual({
      works: 'ScholarlyArticle', authors: 'Person', sources: 'Periodical', institutions: 'CollegeOrUniversity',
      funders: 'Organization', publishers: 'Organization', topics: 'DefinedTerm', keywords: 'DefinedTerm',
    });
    const person = recordJsonLd('authors', RECORDS.authors);
    expect(person.sameAs).toContain('https://orcid.org/0000-0003-1613-5981');
    expect(person.affiliation[0]).toMatchObject({ name: 'OpenAlex', url: 'https://openalex.org/institutions/I4200000001' });
    expect(recordJsonLd('institutions', RECORDS.institutions).sameAs).toContain('https://ror.org/03vek6s52');
    expect(recordJsonLd('topics', RECORDS.topics).inDefinedTermSet.name).toBe('OpenAlex topics');
    expect(recordJsonLd('works', { ...RECORDS.works, type: 'physical-object' })['@type']).toBe('CreativeWork');
  });
  it('authors get og:type profile; other records website', () => {
    expect(meta(recordHead('authors', RECORDS.authors), 'og:type')).toBe('profile');
    expect(meta(recordHead('sources', RECORDS.sources), 'og:type')).toBe('website');
  });
  it('thin records carry robots noindex', () => {
    const thin = { ...work, abstract_inverted_index: null, cited_by_count: 0 };
    expect(meta(recordHead('works', thin), 'robots')).toBe('noindex');
  });
  it('no record, no head (the app keeps its defaults while loading)', () => {
    expect(recordHead('works', null)).toEqual({});
    expect(recordTitle('works', null)).toBe('OpenAlex');
  });
  it('JSON-LD is safe inside a <script>', () => {
    const evil = { ...work, display_name: 'x</script><script>alert(1)</script>' };
    const html = recordHead('works', evil).script[0].innerHTML;
    expect(html).not.toMatch(/<\/script/i);
    expect(JSON.parse(html).name).toBe('xalert(1)');
    expect(jsonForScript({ a: '</script>&' })).toBe('{"a":"\\u003c/script\\u003e\\u0026"}');
  });
  it('very large author lists are capped in JSON-LD', () => {
    const big = { ...work, authorships: Array.from({ length: 3000 }, (_, i) => ({ author: { id: `https://openalex.org/A${i + 1}`, display_name: `A ${i}` } })) };
    expect(recordJsonLd('works', big).author).toHaveLength(100);
    expect(recordDescription('works', big)).toMatch(/and 2,997 others/);
  });
});

describe('noindexReason', () => {
  const w = (o) => ({ ...work, ...o });
  it('works: indexed when there is an abstract or a citation', () => {
    expect(noindexReason('works', work)).toBe(null);
    expect(noindexReason('works', w({ abstract_inverted_index: null }))).toBe(null);
    expect(noindexReason('works', w({ cited_by_count: 0 }))).toBe(null);
  });
  it('works: noindex with neither, for paratext, and for the extended corpus', () => {
    expect(noindexReason('works', w({ abstract_inverted_index: null, cited_by_count: 0 }))).toBe('no abstract and no citations');
    expect(noindexReason('works', w({ abstract_inverted_index: {}, cited_by_count: 0 }))).toBe('no abstract and no citations');
    expect(noindexReason('works', w({ is_paratext: true }))).toBe('paratext');
    expect(noindexReason('works', w({ is_xpac: true }))).toBe('extended corpus');
  });
  it('authors: noindex with at most one work and no ORCID', () => {
    const a = RECORDS.authors;
    expect(noindexReason('authors', a)).toBe(null);
    expect(noindexReason('authors', { ...a, works_count: 1, orcid: null, ids: {} })).toBe('at most one work and no ORCID');
    expect(noindexReason('authors', { ...a, works_count: 1, orcid: 'https://orcid.org/0000-0000-0000-0001' })).toBe(null);
    expect(noindexReason('authors', { ...a, works_count: 2, orcid: null, ids: {} })).toBe(null);
  });
  it('other entity types are always indexable', () => {
    for (const t of ['sources', 'institutions', 'topics', 'funders', 'publishers', 'keywords']) {
      expect(isIndexable(t, { ...RECORDS[t] ?? {}, works_count: 0 })).toBe(true);
    }
  });
});
