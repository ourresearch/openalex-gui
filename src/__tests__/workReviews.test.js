// oxjob #2540: a work page lists the reviews linked to the work, "N reviews", no
// rating; a work with none shows nothing.
import { describe, it, expect, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { getEntityConfig } from '@/entityConfigs';
import {
  hasReviews, linksParams, reviewRows, reviewWorkIds, reviewWorksParams, reviewsHeading,
} from '@/workReviews';

vi.mock('@/components/Entity/EntityDatumRow.vue', async () => {
  const { h: hh } = await import('vue');
  return { default: { name: 'EntityDatumRow', props: ['filterKey', 'data', 'type', 'showMissing'], render() { return hh('div', `[row ${this.filterKey}]`); } } };
});
vi.mock('@/components/Entity/WorkReviews.vue', async () => {
  const { h: hh } = await import('vue');
  return { __esModule: true, default: { name: 'WorkReviews', props: ['work'], render() { return hh('div', `[reviews ${this.work.id}]`); } } };
});
const { default: EntityNew } = await import('@/components/Entity/EntityNew.vue');
const render = (props) => renderToString(createSSRApp({ render: () => h(EntityNew, props) }));
const text = (html) => html.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

const ELIFE_LINKS = {
  results: ['W7167927612', 'W7167934821', 'W7167930190', 'W7167899164'].map((id) => ({
    origin: `https://openalex.org/${id}`,
    target: 'https://openalex.org/W7167926423',
    link_type: 'https://openalex.org/link-types/review',
  })),
};
const title = 'PCNA-Polκ-Polδ/USP18 axes stabilize replication fork and restart to reduce cisplatin cytotoxicity';
const elife = { display_name: 'eLife', id: 'https://openalex.org/S1336409049' };
const ELIFE_WORKS = {
  results: [
    ['W7167899164', `Reviewer #1 (Public review): ${title}`],
    ['W7167927612', `Reviewer #2 (Public review): ${title}`],
    ['W7167930190', `eLife Assessment: ${title}`],
    ['W7167934821', `Reviewer #3 (Public review): ${title}`],
  ].map(([id, name]) => ({
    id: `https://openalex.org/${id}`, display_name: name, publication_date: '2026-07-10', publication_year: 2026,
    type: 'peer-review', primary_location: { source: elife },
  })),
};

describe('work reviews (#2540)', () => {
  it('says "N reviews", never "reviewed"', () => {
    expect(reviewsHeading(4)).toBe('4 reviews');
    expect(reviewsHeading(1)).toBe('1 review');
    expect(reviewsHeading(1200)).toBe('1,200 reviews');
  });

  it('asks /links only for works with a review count', () => {
    expect(hasReviews({ reviewed_by_count: 4 })).toBe(true);
    expect(hasReviews({ reviewed_by_count: 0 })).toBe(false);
    expect(hasReviews({})).toBe(false);
    expect(linksParams('https://openalex.org/W7167926423')).toEqual({ filter: 'target:W7167926423,link_type:review', 'per-page': 100 });
  });

  it('looks the reviews up by id, xpac included (book reviews)', () => {
    const ids = reviewWorkIds(ELIFE_LINKS);
    expect(ids).toEqual(['W7167927612', 'W7167934821', 'W7167930190', 'W7167899164']);
    const p = reviewWorksParams(ids);
    expect(p.filter).toBe('ids.openalex:W7167927612|W7167934821|W7167930190|W7167899164');
    expect(p.include_xpac).toBe('true');
  });

  it('lists the eLife assessment, then reviewers 1-3, with venue and year', () => {
    const rows = reviewRows(reviewWorkIds(ELIFE_LINKS), ELIFE_WORKS);
    expect(rows.map((r) => r.id)).toEqual(['W7167930190', 'W7167899164', 'W7167927612', 'W7167934821']);
    expect(rows[0].meta).toBe('eLife, 2026');
  });

  it('keeps a review the lookup did not return, by id', () => {
    const rows = reviewRows(['W1', 'W7167930190'], ELIFE_WORKS);
    expect(rows.map((r) => r.title)).toContain('W1');
    expect(rows).toHaveLength(2);
  });

  it('the work page holds the reviews block after the first chunk', async () => {
    const rows = getEntityConfig('works').rowsToShowOnEntityPage;
    expect(rows.indexOf('reviews')).toBeGreaterThan(rows.indexOf('authorships.author.id'));
    expect(rows.indexOf('reviews')).toBeLessThan(rows.indexOf('primary_topic.id'));
    const work = { id: 'https://openalex.org/W7167926423', display_name: title, reviewed_by_count: 4, language: 'en' };
    expect(text(await render({ data: work, type: 'works' }))).toContain('[reviews https://openalex.org/W7167926423]');
  });

  it('a work with no reviews shows no reviews block at all', async () => {
    const work = { id: 'https://openalex.org/W1', display_name: 'x', reviewed_by_count: 0, language: 'en' };
    const t = text(await render({ data: work, type: 'works' }));
    expect(t).not.toContain('[reviews');
    expect(t.toLowerCase()).not.toContain('review');
  });
});
