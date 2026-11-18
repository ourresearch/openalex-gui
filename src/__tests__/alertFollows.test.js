import { describe, it, expect } from 'vitest';
import { alertFollows, groupAlerts } from '@/views/Me/alertFollows';

const u = (q) => `https://openalex.org/works?${q}`;

describe('alertFollows: what an alert follows (oxjob #635)', () => {
  it('reads an author, a topic, a keyword, an institution and a source', () => {
    expect(alertFollows(u('filter=authorships.author.id:a5023888391&id=abc'))).toBe('authors');
    expect(alertFollows(u('filter=primary_topic.id:t10643'))).toBe('topics');
    expect(alertFollows(u('filter=topics.id:t10643'))).toBe('topics');
    expect(alertFollows(u('filter=keywords.id:keywords/drones'))).toBe('topics');
    expect(alertFollows(u('filter=authorships.institutions.lineage:i136199984'))).toBe('institutions');
    expect(alertFollows(u('filter=primary_location.source.id:s137773608'))).toBe('sources');
  });

  it('puts a search on several kinds under the first group (author before topic)', () => {
    expect(alertFollows(u('filter=primary_topic.id:t10643,authorships.author.id:a5023888391'))).toBe('authors');
    expect(alertFollows(u('filter=publication_year:2025,primary_topic.id:t10643'))).toBe('topics');
  });

  it('does not count an excluded author as followed', () => {
    expect(alertFollows(u('filter=authorships.author.id:!a5023888391,primary_topic.id:t10643'))).toBe('topics');
  });

  it('puts text searches, OQL and unreadable URLs under other searches', () => {
    expect(alertFollows(u('search=coral%20reefs'))).toBe('other');
    expect(alertFollows(u('filter=title_and_abstract.search:drones'))).toBe('other');
    expect(alertFollows(u('oql=works%20where%20title%20has%20coral'))).toBe('other');
    expect(alertFollows('')).toBe('other');
    expect(alertFollows(undefined)).toBe('other');
    expect(alertFollows('not a url %%%')).toBe('other');
  });
});

describe('groupAlerts (oxjob #635)', () => {
  it('returns only the groups that have alerts, in page order, keeping each alert', () => {
    const a = { id: 1, search_url: u('search=x') };
    const b = { id: 2, search_url: u('filter=topics.id:t1') };
    const c = { id: 3, search_url: u('filter=authorships.author.id:a1') };
    const d = { id: 4, search_url: u('filter=authorships.author.id:a2') };
    const groups = groupAlerts([a, b, c, d]);
    expect(groups.map(g => g.key)).toEqual(['authors', 'topics', 'other']);
    expect(groups[0].items).toEqual([c, d]);
    expect(groups[0].title).toBe('Authors');
  });

  it('copes with no alerts', () => {
    expect(groupAlerts([])).toEqual([]);
    expect(groupAlerts(undefined)).toEqual([]);
  });
});
